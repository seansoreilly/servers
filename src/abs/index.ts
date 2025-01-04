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
import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

// Create logs directory if it doesn't exist
const logsDir = join(process.cwd(), 'logs');
try {
  mkdirSync(logsDir, { recursive: true });
} catch (err) {
  console.error('Failed to create logs directory:', err);
}

const logFile = join(logsDir, 'abs-api.log');

function log(...args: any[]) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}\n`;

  try {
    appendFileSync(logFile, message);
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
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
  params.append('format', responseFormat);

  // Handle dataKey according to SDMX spec
  // If no dataKey provided or empty, use "all" to get all data
  // Otherwise use the provided dataKey which can include:
  // - Multiple values using + (OR operator)
  // - Wildcards by omitting values between dots
  // - Specific dimension values separated by dots
  const pathKey = dataKey?.trim() || 'all';
  const url = `${ABS_API_URL}/data/${dataflowIdentifier}/${pathKey}?${params.toString()}`;

  log('\n=== Data Request ===');
  log('URL:', url);
  log('Format:', responseFormat);
  log('DataKey:', pathKey);

  const response = await fetch(url);

  log('Response Status:', response.status, response.statusText);
  log('Response Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    log('Error Response:', errorText);
    throw new Error(`API request failed (${response.status}): ${response.statusText}\n${errorText}`);
  }

  // For CSV formats, return the text directly
  if (responseFormat === 'csvfile' || responseFormat === 'csvfilewithlabels') {
    const text = await response.text();
    log('Response Size:', text.length);
    return text;
  }

  // For other formats (like JSON), parse the response
  const text = await response.text();
  if (!text) {
    throw new Error('Empty response received from API');
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    log('Parse Error:', err);
    const parseError = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse response as JSON: ${parseError}`);
  }
}

async function listDataflows(): Promise<DataflowInfo[]> {
  const url = `${ABS_API_URL}/dataflow/all?detail=allstubs`;
  const headers = { 'Accept': 'application/vnd.sdmx.structure+json' };

  log('\n=== Dataflows Request ===');
  log('URL:', url);
  log('Headers:', headers);

  const response = await fetch(url, { headers });

  log('Response Status:', response.status, response.statusText);
  log('Response Headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    log('Error Response:', errorText);
    throw new Error(`API request failed (${response.status}): ${response.statusText}\n${errorText}`);
  }

  const text = await response.text();
  log('Response Text Length:', text.length);

  if (!text) {
    throw new Error('Empty response received from API');
  }

  try {
    const json = JSON.parse(text);
    log('Parsed JSON:', json);

    // SDMX JSON structure response format
    const structures = json.data?.dataflows || [];
    log('Found Structures:', structures.length);

    const dataflows = structures.map((flow: any) => {
      // Get name from either the direct name field or from names.en
      const name = flow.name || flow.names?.en || flow.id || '';
      return {
        id: String(flow.id || ''),
        name: String(name),
        version: String(flow.version || '1.0.0')
      };
    });

    log('Transformed Dataflows:', dataflows);
    return dataflows;
  } catch (err) {
    log('Parse Error:', err);
    const parseError = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse response as JSON: ${parseError}`);
  }
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "get_data",
    description: "Retrieve data from a specific dataflow. Use dataKey to filter the results.",
    inputSchema: {
      type: "object",
      properties: {
        dataflowIdentifier: {
          type: "string",
          description: "The identifier of the dataflow (e.g., 'ABS_ANNUAL_ERP_ASGS2016')"
        },
        dataKey: {
          type: "string",
          description: "Filter data using dimension values separated by dots (e.g., '1.AUS' for filtering). Use 'all' for all values, or combine values with + (e.g., '1.115486+131189.10..Q'). Leave empty for all data."
        },
        startPeriod: {
          type: "string",
          description: "Start period in format: yyyy, yyyy-Sn (semester), yyyy-Qn (quarter), or yyyy-mm (month)"
        },
        endPeriod: {
          type: "string",
          description: "End period in format: yyyy, yyyy-Sn (semester), yyyy-Qn (quarter), or yyyy-mm (month)"
        },
        format: {
          type: "string",
          description: "Response format: csvfile (default), csvfilewithlabels, jsondata, genericdata, or structurespecificdata",
          enum: ["csvfile", "csvfilewithlabels", "jsondata", "genericdata", "structurespecificdata"]
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