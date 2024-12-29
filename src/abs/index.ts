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
import {
  GetDataSchema,
  GetStructureListSchema,
  GetStructureSchema,
  GetStructureVersionSchema,
  type DataResponse,
  type StructureListResponse,
  type StructureResponse,
  type DataflowInfo,
  type DataflowDetails,
  DataflowListSchema,
  DataflowDetailsSchema,
} from "./schemas.js";

function log(...args: any[]) {
  console.error('\x1b[90m', ...args, '\x1b[0m');  // Gray color for logs
}

const server = new Server(
  {
    name: "abs",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Cache for dataflows
let dataflowCache: DataflowInfo[] | null = null;

// Base URLs for ABS APIs
const ABS_DATA_API_URL = "https://api.data.abs.gov.au/data";
const ABS_SDMX_API_URL = "https://data.api.abs.gov.au/rest";

// Helper function to make API requests
async function makeRequest<T>(url: string, isSDMX: boolean = false): Promise<T> {
  try {
    log('\n=== API Request ===');
    log('URL:', url);
    const headers = isSDMX ? {
      'Accept': 'application/vnd.sdmx.structure+json; charset=utf-8; version=1.0'
    } : {
      'Accept': 'application/vnd.sdmx.data+json'
    };

    log('Headers:', JSON.stringify(headers, null, 2));
    log('=================\n');

    const response = await fetch(url, { headers });

    log('\n=== API Response ===');
    log('Status:', response.status, response.statusText);
    const text = await response.text();
    log('Response Headers:', JSON.stringify(Object.fromEntries([...response.headers]), null, 2));
    log('Response Body (truncated):');
    log(text.substring(0, 1000) + (text.length > 1000 ? '...' : ''));
    log('===================\n');

    if (!response.ok) {
      console.error(`API request failed: ${response.statusText}`);
      console.error(`Response body: ${text}`);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseError) {
      console.error('\n=== Parse Error ===');
      console.error("Failed to parse response as JSON:", parseError);
      console.error('Full response text:', text);
      console.error('==================\n');
      throw new Error("Failed to parse response as JSON");
    }
  } catch (error) {
    console.error('\n=== Request Error ===');
    console.error("Error making request:", error);
    console.error('===================\n');
    throw error;
  }
}

// Main API functions
async function getData(
  dataflowIdentifier: string,
  dataKey: string,
  format: "xml" | "json" | "csv" = "json"
): Promise<DataResponse> {
  const url = `${ABS_DATA_API_URL}/${dataflowIdentifier}/${dataKey}?format=jsondata&dimensionAtObservation=AllDimensions`;
  return makeRequest<DataResponse>(url, false);
}

async function getStructureList(
  structureType: string,
  agencyId: string
): Promise<StructureListResponse> {
  const url = `${ABS_SDMX_API_URL}/${structureType}/${agencyId}`;
  return makeRequest<StructureListResponse>(url, true);
}

async function getStructure(
  structureType: string,
  agencyId: string,
  structureId: string
): Promise<StructureResponse> {
  const url = `${ABS_SDMX_API_URL}/${structureType}/${agencyId}/${structureId}`;
  return makeRequest<StructureResponse>(url, true);
}

async function getStructureVersion(
  structureType: string,
  agencyId: string,
  structureId: string,
  structureVersion: string
): Promise<StructureResponse> {
  const url = `${ABS_SDMX_API_URL}/${structureType}/${agencyId}/${structureId}/${structureVersion}`;
  return makeRequest<StructureResponse>(url, true);
}

async function parseDataflowList(response: any): Promise<DataflowInfo[]> {
  const dataflows: DataflowInfo[] = [];

  try {
    const structures = response.data?.structures || [];

    for (const flow of structures) {
      dataflows.push({
        id: flow.id || '',
        name: flow.names?.[0]?.name || flow.id || '',
        description: flow.descriptions?.[0]?.description || '',
        agency: flow.agencyID || 'ABS',
        version: flow.version || '1.0.0'
      });
    }
  } catch (err) {
    const error = err as Error;
    console.error("Error parsing dataflow list:", error);
    return [{
      id: 'error',
      name: 'Error parsing response',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      agency: 'ABS',
      version: '1.0'
    }];
  }

  return dataflows;
}

async function getAvailableDataflows(): Promise<DataflowInfo[]> {
  if (dataflowCache) return structuredClone(dataflowCache);
  try {
    const response = await getStructureList("dataflow", "ABS");
    console.log('response', response);
    dataflowCache = await parseDataflowList(response);
    return structuredClone(dataflowCache);
  } catch (err) {
    const error = err as Error;
    console.error("Error getting dataflows:", error);
    return [{
      id: 'error', 
      name: 'Error fetching dataflows',
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      agency: 'ABS',
      version: '1.0'
    }];
  }
}

async function parseDataflowDetails(response: StructureResponse): Promise<DataflowDetails> {
  try {
    const structure = response.content as any;

    if (!structure) {
      throw new Error("Invalid structure response");
    }

    // Extract dimensions
    const dimensions = (structure.dataStructureComponents?.dimensionList?.dimensions || [])
      .map((dim: any) => ({
        id: String(dim.id || ''),
        name: String(dim.name?.[0]?.name || dim.id || ''),
        values: (dim.localRepresentation?.enumeration || [])
          .map((enumValue: any) => ({
            id: String(enumValue.id || ''),
            name: String(enumValue.name?.[0]?.name || enumValue.id || '')
          }))
      }));

    // Extract measures
    const measures = (structure.dataStructureComponents?.measureList?.measures || [])
      .map((measure: any) => ({
        id: String(measure.id || ''),
        name: String(measure.name?.[0]?.name || measure.id || '')
      }));

    return {
      id: String(structure.id || ''),
      name: String(structure.name?.[0]?.name || structure.id || ''),
      dimensions,
      measures,
      attributes: structure.dataStructureComponents?.attributeList || []
    };
  } catch (error) {
    console.error("Error parsing dataflow details:", error);
    throw new Error("Failed to parse dataflow details");
  }
}

async function getDataflowDetails(dataflowId: string): Promise<DataflowDetails> {
  const structure = await getStructure("datastructure", "ABS", dataflowId);
  return parseDataflowDetails(structure);
}

// Tool definitions
const tools: Tool[] = [
  {
    name: "get_data",
    description: "Retrieve data from a specific dataflow",
    inputSchema: {
      type: "object",
      properties: {
        dataflowIdentifier: { type: "string", description: "The identifier of the dataflow" },
        dataKey: { type: "string", description: "The key identifying specific data" },
        format: { type: "string", enum: ["xml", "json", "csv"], default: "json", description: "Response format" }
      },
      required: ["dataflowIdentifier", "dataKey"]
    }
  },
  {
    name: "get_structure_list",
    description: "Get all structures of a specific type",
    inputSchema: {
      type: "object",
      properties: {
        structureType: { type: "string", description: "Type of structure to retrieve" },
        agencyId: { type: "string", description: "The agency identifier" }
      },
      required: ["structureType", "agencyId"]
    }
  },
  {
    name: "get_structure",
    description: "Get a specific structure",
    inputSchema: {
      type: "object",
      properties: {
        structureType: { type: "string", description: "Type of structure to retrieve" },
        agencyId: { type: "string", description: "The agency identifier" },
        structureId: { type: "string", description: "The structure identifier" }
      },
      required: ["structureType", "agencyId", "structureId"]
    }
  },
  {
    name: "get_structure_version",
    description: "Get a specific version of a structure",
    inputSchema: {
      type: "object",
      properties: {
        structureType: { type: "string", description: "Type of structure to retrieve" },
        agencyId: { type: "string", description: "The agency identifier" },
        structureId: { type: "string", description: "The structure identifier" },
        structureVersion: { type: "string", description: "Version of the structure" }
      },
      required: ["structureType", "agencyId", "structureId", "structureVersion"]
    }
  },
  {
    name: "list_dataflows",
    description: "List all available ABS statistical dataflows",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_dataflow_details",
    description: "Get detailed information about a specific dataflow including its dimensions and structure",
    inputSchema: {
      type: "object",
      properties: {
        dataflowId: {
          type: "string",
          description: "The identifier of the dataflow to retrieve details for"
        }
      },
      required: ["dataflowId"]
    }
  }
];

// Request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "get_data": {
        const args = GetDataSchema.parse(request.params.arguments);
        const data = await getData(
          args.dataflowIdentifier,
          args.dataKey,
          args.format
        );
        return { toolResult: data };
      }

      case "get_structure_list": {
        const args = GetStructureListSchema.parse(request.params.arguments);
        const structures = await getStructureList(
          args.structureType,
          args.agencyId
        );
        return { toolResult: structures };
      }

      case "get_structure": {
        const args = GetStructureSchema.parse(request.params.arguments);
        const structure = await getStructure(
          args.structureType,
          args.agencyId,
          args.structureId
        );
        return { toolResult: structure };
      }

      case "get_structure_version": {
        const args = GetStructureVersionSchema.parse(request.params.arguments);
        const structure = await getStructureVersion(
          args.structureType,
          args.agencyId,
          args.structureId,
          args.structureVersion
        );
        return { toolResult: structure };
      }

      case "list_dataflows": {
        const dataflows = await getAvailableDataflows();
        return { toolResult: dataflows };
      }

      case "get_dataflow_details": {
        const args = DataflowDetailsSchema.parse(request.params.arguments);
        const details = await getDataflowDetails(args.dataflowId);
        return { toolResult: details };
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
    throw error;
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