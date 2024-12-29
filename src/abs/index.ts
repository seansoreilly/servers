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
} from "./schemas.js";

const server = new Server(
  {
    name: "abs-mcp-server",
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
