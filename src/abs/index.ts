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
import { zodToJsonSchema } from "zod-to-json-schema";
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

// Base URL for ABS Data API
const ABS_API_BASE_URL = "https://data.api.abs.gov.au";

// Helper function to make API requests
async function makeRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// Tool implementations
async function getData(
  dataflowIdentifier: string,
  dataKey: string,
  format: "xml" | "json" | "csv" = "json"
): Promise<DataResponse> {
  const url = `${ABS_API_BASE_URL}/rest/data/${dataflowIdentifier}/${dataKey}?format=${format}`;
  return makeRequest<DataResponse>(url);
}

async function getStructureList(
  structureType: string,
  agencyId: string
): Promise<StructureListResponse> {
  const url = `${ABS_API_BASE_URL}/rest/${structureType}/${agencyId}`;
  return makeRequest<StructureListResponse>(url);
}

async function getStructure(
  structureType: string,
  agencyId: string,
  structureId: string
): Promise<StructureResponse> {
  const url = `${ABS_API_BASE_URL}/rest/${structureType}/${agencyId}/${structureId}`;
  return makeRequest<StructureResponse>(url);
}

async function getStructureVersion(
  structureType: string,
  agencyId: string,
  structureId: string,
  structureVersion: string
): Promise<StructureResponse> {
  const url = `${ABS_API_BASE_URL}/rest/${structureType}/${agencyId}/${structureId}/${structureVersion}`;
  return makeRequest<StructureResponse>(url);
}

let dataflowCache: DataflowInfo[] | null = null;

async function parseDataflowList(response: StructureListResponse): Promise<DataflowInfo[]> {
  const dataflows: DataflowInfo[] = [];

  try {
    // The response structure has changed to use 'structures' instead of 'data'
    const structures = response.structures || [];

    for (const flow of structures) {
      dataflows.push({
        id: flow.id,
        name: flow.name || flow.id,
        description: "", // Add description if available in the structure
        agency: flow.agency,
        version: flow.version
      });
    }
  } catch (error) {
    console.error("Error parsing dataflow list:", error);
    throw new Error("Failed to parse dataflow list");
  }

  return dataflows;
}

async function getAvailableDataflows(): Promise<DataflowInfo[]> {
  if (dataflowCache) return dataflowCache;

  const response = await getStructureList("dataflow", "ABS");
  dataflowCache = await parseDataflowList(response);
  return dataflowCache;
}

async function parseDataflowDetails(response: StructureResponse): Promise<DataflowDetails> {
  try {
    // Add type assertion to help TypeScript understand the structure
    const structure = response.content as any;

    if (!structure) {
      throw new Error("Invalid structure response");
    }

    // Extract dimensions with proper type handling
    const dimensions = (structure.dataStructureComponents?.dimensionList?.dimensions || [])
      .map((dim: any) => ({
        id: String(dim.id),
        name: String(dim.name?.[0]?.value || dim.id),
        values: (dim.localRepresentation?.enumeration || [])
          .map((enumValue: any) => ({
            id: String(enumValue.id),
            name: String(enumValue.name?.[0]?.value || enumValue.id)
          }))
      }));

    // Extract measures with proper type handling
    const measures = (structure.dataStructureComponents?.measureList?.measures || [])
      .map((measure: any) => ({
        id: String(measure.id),
        name: String(measure.name?.[0]?.value || measure.id)
      }));

    return {
      id: String(structure.id),
      name: String(structure.name?.[0]?.value || structure.id),
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

// Set up tool handlers
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

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
