#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from "zod";
import { GetDataSchema, type DataflowInfo } from "./schemas.js";

function log(...args: any[]) {
  console.error('\x1b[90m', ...args, '\x1b[0m');  // Gray color for logs
}

const server = new Server(
  {
    name: "abs",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Base URL for ABS API
const ABS_API_URL = "https://data.api.abs.gov.au/rest";

// Helper function to make API requests
async function makeRequest<T>(url: string, isDataflow: boolean = false, format?: string): Promise<T> {
  try {
    log('\n=== API Request ===');
    log('URL:', url);

    const response = await fetch(url);

    log('\n=== API Response ===');
    log('Status:', response.status, response.statusText);
    log('Content-Type:', response.headers.get('content-type'));

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed (${response.status}): ${response.statusText}\n${errorText}`);
    }

    // For CSV formats, return the text directly
    if (format === 'csvfile' || format === 'csvfilewithlabels') {
      const text = await response.text();
      return text as T;
    }

    const text = await response.text();

    if (!text) {
      throw new Error('Empty response received from API');
    }

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      log('Parse Error:', err);
      const parseError = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to parse response as JSON: ${parseError}`);
    }
  } catch (error) {
    log('\n=== Request Error ===');
    log("Error making request:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Main API functions
async function getData(dataflowIdentifier: string, dataKey?: string, startPeriod?: string, endPeriod?: string, responseFormat: string = "csvfile"): Promise<any> {
  // Calculate default time period if not provided
  if (!startPeriod) {
    const lastYear = new Date().getFullYear() - 1;
    startPeriod = lastYear.toString();
    endPeriod = (lastYear + 1).toString();
  }

  const params = new URLSearchParams();
  params.append('startPeriod', startPeriod);
  if (endPeriod) {
    params.append('endPeriod', endPeriod);
  }
  params.append('format', responseFormat);  // Always include format parameter
  if (dataKey) {
    params.append('dataKey', dataKey);
  }

  const url = `${ABS_API_URL}/data/${dataflowIdentifier}?${params.toString()}`;
  return makeRequest(url, false, responseFormat);
}

async function listDataflows(): Promise<DataflowInfo[]> {
  const url = `${ABS_API_URL}/dataflow/all?detail=allstubs&references=none`;
  const response = await makeRequest<any>(url, true);

  // Extract and transform the dataflows from the response
  const structures = response.data?.structures || response.structures || [];
  return structures.map((flow: any) => ({
    id: String(flow.id || ''),
    name: String(flow.names?.[0]?.name || flow.id || '')
  }));
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "get_data",
    description: "Retrieve data from a specific dataflow",
    inputSchema: {
      type: "object",
      properties: {
        dataflowIdentifier: {
          type: "string",
          description: "The identifier of the dataflow"
        },
        dataKey: {
          type: "string",
          description: "Optional key parameters (e.g., '1.AUS' for filtering)"
        },
        startPeriod: {
          type: "string",
          description: "Start period (e.g., '2023')"
        },
        endPeriod: {
          type: "string",
          description: "End period (e.g., '2024')"
        },
        format: {
          type: "string",
          description: "requested response data format"
        }
      },
      required: ["dataflowIdentifier"]
    }
  },
  {
    name: "list_dataflows",
    description: "List all available ABS statistical dataflows",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

// Request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "get_data": {
        const args = GetDataSchema.parse(request.params.arguments);
        const data = await getData(
          args.dataflowIdentifier,
          args.dataKey,
          args.startPeriod,
          args.endPeriod,
          args.responseFormat
        );
        return { toolResult: data };
      }

      case "list_dataflows": {
        const dataflows = await listDataflows();
        return { toolResult: dataflows };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid arguments: ${error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`
      );
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});