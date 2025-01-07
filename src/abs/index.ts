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
import { appendFileSync, mkdirSync, readFileSync } from "fs";
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

// API Configuration
const API_CONFIG = {
  baseUrl: "https://data.api.abs.gov.au/rest",
  defaultAgency: "ABS",
  version: "0.2.0",
  name: "abs",
};

// Response Format Types
type ResponseFormat =
  | "csvfilewithlabels"
  | "csvfile"
  | "jsondata"
  | "genericdata"
  | "structurespecificdata";

// Structure Types
type StructureType =
  | "dataflow"
  | "datastructure"
  | "codelist"
  | "conceptscheme"
  | "categoryscheme"
  | "contentconstraint"
  | "actualconstraint"
  | "agencyscheme"
  | "categorisation"
  | "hierarchicalcodelist";

// Detail Level Types
type DetailLevel =
  | "full"
  | "allstubs"
  | "referencestubs"
  | "referencepartial"
  | "allcompletestubs"
  | "referencecompletestubs";

// References Types
type ReferenceType =
  | "none"
  | "parents"
  | "parentsandsiblings"
  | "children"
  | "descendants"
  | "all"
  | StructureType;

// Add these types for better structure
type Dimension = {
  id: string;
  name: string;
  position: number;
  type: 'Dimension' | 'TimeDimension';
  conceptIdentity?: {
    id: string;
    name?: string;
  };
  representation?: {
    enumeration?: string[];
  };
};

// Add structure response types
interface StructureResponse {
  data: {
    dataStructures: Array<{
      dataStructureComponents: {
        dimensionList?: {
          dimensions: Array<{
            id: string;
            name?: string;
            position: number;
            conceptIdentity?: {
              id: string;
              name?: string;
            };
            representation?: {
              enumeration?: string[];
            };
          }>;
        };
        timeDimensions?: Array<{
          id: string;
          name?: string;
          position: number;
          conceptIdentity?: {
            id: string;
            name?: string;
          };
          representation?: {
            enumeration?: string[];
          };
        }>;
      };
    }>;
  };
}

// API Client Class
class ABSApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    url: string,
    acceptHeader?: string,
    params: Record<string, string | undefined> = {}
  ): Promise<T> {
    try {
      const queryParams = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null).map(([k, v]) => [k, v as string])
      );
      const fullUrl = `${url}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      log('\n=== API Request ===');
      log('URL:', fullUrl);
      log('Accept:', acceptHeader);

      const headers: Record<string, string> = {};
      if (acceptHeader) {
        headers['Accept'] = acceptHeader;
      }

      const response = await fetch(fullUrl, { headers });

      log('\n=== API Response ===');
      log('Status:', response.status, response.statusText);
      log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${response.statusText}\n${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('csv')) {
        return response.text() as T;
      }

      const text = await response.text();
      return contentType?.includes('json') ? JSON.parse(text) : text as T;
    } catch (error) {
      log('\n=== Request Error ===');
      log("Error making request:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // Data Endpoints
  async getData(
    dataflowIdentifier: string,
    dataKey: string = "all",
    options: {
      startPeriod?: string;
      endPeriod?: string;
      format?: ResponseFormat;
      detail?: "full" | "dataonly" | "serieskeysonly" | "nodata";
      dimensionAtObservation?: string;
    } = {}
  ) {
    const acceptHeaders = {
      jsondata: 'application/vnd.sdmx.data+json',
      genericdata: 'application/vnd.sdmx.genericdata+xml',
      structurespecificdata: 'application/vnd.sdmx.structurespecificdata+xml',
      csvfile: 'application/vnd.sdmx.data+csv',
      csvfilewithlabels: 'application/vnd.sdmx.data+csv;labels=both'
    };

    const url = `${this.baseUrl}/data/${dataflowIdentifier}/${dataKey}`;
    const format = options.format || 'csvfile';

    return this.makeRequest(
      url,
      acceptHeaders[format],
      {
        startPeriod: options.startPeriod,
        endPeriod: options.endPeriod,
        format: options.format,
        detail: options.detail,
        dimensionAtObservation: options.dimensionAtObservation
      }
    );
  }

  // Metadata Endpoints
  async getStructures(
    structureType: StructureType,
    agencyId: string = API_CONFIG.defaultAgency,
    options: {
      detail?: DetailLevel;
      references?: ReferenceType;
    } = {}
  ) {
    const url = `${this.baseUrl}/${structureType}/${agencyId}`;
    return this.makeRequest(
      url,
      'application/vnd.sdmx.structure+json',
      {
        detail: options.detail,
        references: options.references
      }
    );
  }

  async getStructure(
    structureType: StructureType,
    agencyId: string = API_CONFIG.defaultAgency,
    structureId: string,
    version?: string,
    options: {
      detail?: DetailLevel;
      references?: ReferenceType;
    } = {}
  ) {
    const url = `${this.baseUrl}/${structureType}/${agencyId}/${structureId}${version ? '/' + version : ''}`;
    return this.makeRequest(
      url,
      'application/vnd.sdmx.structure+json',
      {
        detail: options.detail,
        references: options.references
      }
    );
  }

  async getDimensionList(dataflowId: string): Promise<{
    dimensions: Dimension[];
    timeDimensions: Dimension[];
  }> {
    try {
      // Get the datastructure for the given dataflow
      const structure = await this.getStructure(
        'datastructure',
        API_CONFIG.defaultAgency,
        dataflowId,
        undefined,
        {
          detail: 'full',
          references: 'none'
        }
      ) as StructureResponse;

      if (!structure?.data?.dataStructures?.[0]?.dataStructureComponents) {
        throw new Error('Invalid datastructure response');
      }

      const components = structure.data.dataStructures[0].dataStructureComponents;

      // Extract regular dimensions
      const dimensions: Dimension[] = (components.dimensionList?.dimensions || [])
        .map(dim => ({
          id: dim.id,
          name: dim.name || dim.id,
          position: dim.position,
          type: 'Dimension' as const,
          conceptIdentity: dim.conceptIdentity,
          representation: dim.representation
        }));

      // Extract time dimensions
      const timeDimensions: Dimension[] = (components.timeDimensions || [])
        .map(dim => ({
          id: dim.id,
          name: dim.name || dim.id,
          position: dim.position,
          type: 'TimeDimension' as const,
          conceptIdentity: dim.conceptIdentity,
          representation: dim.representation
        }));

      log('\n=== Dimension List Retrieved ===');
      log('Dimensions:', dimensions.length);
      log('Time Dimensions:', timeDimensions.length);

      return {
        dimensions: dimensions.sort((a, b) => a.position - b.position),
        timeDimensions: timeDimensions.sort((a, b) => a.position - b.position)
      };
    } catch (error) {
      log('\n=== getDimensionList Error ===');
      log("Error getting dimension list:", error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }
}

// Initialize API client
const apiClient = new ABSApiClient();

// Server setup
const server = new Server(
  {
    name: API_CONFIG.name,
    version: API_CONFIG.version,
    defaults: {
      get_data: {
        startPeriod: "2021",
        endPeriod: "2024",
        responseFormat: "csvfile"
      }
    }
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool Schemas
const GetDataSchema = z.object({
  dataflowIdentifier: z.string(),
  dataKey: z.string().optional(),
  startPeriod: z.string().optional(),
  endPeriod: z.string().optional(),
  format: z.enum(['csvfilewithlabels', 'csvfile', 'jsondata', 'genericdata', 'structurespecificdata']).optional(),
  detail: z.enum(['full', 'dataonly', 'serieskeysonly', 'nodata']).optional(),
  dimensionAtObservation: z.string().optional()
});

const GetStructureSchema = z.object({
  structureType: z.enum([
    'dataflow', 'datastructure', 'codelist', 'conceptscheme', 'categoryscheme',
    'contentconstraint', 'actualconstraint', 'agencyscheme', 'categorisation',
    'hierarchicalcodelist'
  ]),
  agencyId: z.string().optional(),
  structureId: z.string().optional(),
  version: z.string().optional(),
  detail: z.enum([
    'full', 'allstubs', 'referencestubs', 'referencepartial',
    'allcompletestubs', 'referencecompletestubs'
  ]).optional(),
  references: z.enum([
    'none', 'parents', 'parentsandsiblings', 'children',
    'descendants', 'all', 'datastructure', 'dataflow', 'codelist',
    'conceptscheme', 'categoryscheme', 'contentconstraint',
    'actualconstraint', 'agencyscheme', 'categorisation',
    'hierarchicalcodelist'
  ]).optional()
});

const GetMetadataSchema = z.object({
  dataflowId: z.string(),
  metadataType: z.enum(['actualconstraint']) as z.ZodEnum<['actualconstraint']>,
  detail: z.enum([
    'full', 'allstubs', 'referencestubs', 'referencepartial',
    'allcompletestubs', 'referencecompletestubs'
  ]).optional(),
  references: z.enum([
    'none', 'parents', 'parentsandsiblings', 'children',
    'descendants', 'all'
  ]).optional()
});

// Add new schema
const GetDimensionListSchema = z.object({
  dataflowId: z.string()
});

// Tool definitions
const tools: Tool[] = [
  {
    name: "api_specification",
    description: "ALWAYS DO THIS FIRST. Returns the raw OpenAPI/Swagger specification for the ABS Data API.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "get_data",
    description: `Get data from the ABS API in various formats (CSV, JSON, XML).
      Returns filtered data based on provided parameters.
      Always use {format: 'csvfile'} to reduce the size of the response.
      IMPORTANT: Must do get_metadata request 'actualconstraint' prior to constructing a datakey for a get_data request.
      `,
    inputSchema: {
      type: "object",
      properties: {
        dataflowIdentifier: {
          type: "string",
          description: "The dataflow identifier (e.g., 'ABS_ANNUAL_ERP_ASGS2016')"
        },
        dataKey: {
          type: "string",
          description: "Filter key using dimension values separated by dots (e.g., '1.AUS')"
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
          enum: ["csvfilewithlabels", "csvfile", "jsondata", "genericdata", "structurespecificdata"],
          description: "Response format type"
        },
        detail: {
          type: "string",
          enum: ["full", "dataonly", "serieskeysonly", "nodata"],
          description: "Level of detail in the response"
        },
        dimensionAtObservation: {
          type: "string",
          description: "Dimension to use at observation level"
        }
      },
      required: ["dataflowIdentifier"]
    }
  },
  {
    name: "get_structure",
    description: "Get metadata structures from the ABS API including dataflows, codelists, and concepts.",
    inputSchema: {
      type: "object",
      properties: {
        structureType: {
          type: "string",
          enum: [
            "dataflow", "datastructure", "codelist", "conceptscheme",
            "categoryscheme", "contentconstraint", "actualconstraint",
            "agencyscheme", "categorisation", "hierarchicalcodelist"
          ],
          description: "Type of structure to retrieve"
        },
        agencyId: {
          type: "string",
          description: "Agency ID (defaults to ABS)"
        },
        structureId: {
          type: "string",
          description: "Structure ID"
        },
        version: {
          type: "string",
          description: "Version of the structure"
        },
        detail: {
          type: "string",
          enum: [
            "full", "allstubs", "referencestubs", "referencepartial",
            "allcompletestubs", "referencecompletestubs"
          ],
          description: "Level of detail in the response"
        },
        references: {
          type: "string",
          enum: [
            "none", "parents", "parentsandsiblings", "children",
            "descendants", "all"
          ],
          description: "References to include in the response"
        }
      },
      required: ["structureType"]
    }
  },
  {
    name: "get_metadata",
    description: "Get actualconstraint metadata for a given dataflow.",
    inputSchema: {
      type: "object",
      properties: {
        dataflowId: {
          type: "string",
          description: "The dataflow ID to get metadata for (e.g., 'ABORIGINAL_POP_PROJ'). 'CR_A_' will be automatically prepended."
        },
        metadataType: {
          type: "string",
          enum: ["actualconstraint"],
          description: "Type of metadata to retrieve. Currently only supports actualconstraint."
        },
        detail: {
          type: "string",
          enum: [
            "full", "allstubs", "referencestubs", "referencepartial",
            "allcompletestubs", "referencecompletestubs"
          ],
          description: "Level of detail in the response"
        },
        references: {
          type: "string",
          enum: [
            "none", "parents", "parentsandsiblings", "children",
            "descendants", "all"
          ],
          description: "References to include in the response"
        }
      },
      required: ["dataflowId", "metadataType"]
    }
  },
  {
    name: "get_dimension_list",
    description: "Get the list of dimensions and time dimensions for a given dataflow. MUST do this before constructing the dataKey for get_data.",
    inputSchema: {
      type: "object",
      properties: {
        dataflowId: {
          type: "string",
          description: "The dataflow ID to get dimensions for (e.g., 'ABS_ANNUAL_ERP_ASGS2021')"
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
    switch (request.params.name) {
      case "api_specification": {
        try {
          const specPath = 'C:\\projects\\servers\\src\\abs\\DataAPI.openapi.yaml.txt';
          const rawData = readFileSync(specPath, 'utf8');
          return { toolResult: rawData };
        } catch (error) {
          throw new Error(`Failed to read API specification: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      case "get_data": {
        const args = GetDataSchema.parse(request.params.arguments);
        const data = await apiClient.getData(
          args.dataflowIdentifier,
          args.dataKey,
          {
            startPeriod: args.startPeriod,
            endPeriod: args.endPeriod,
            // format: args.format,
            format: 'csvfile',
            detail: args.detail,
            dimensionAtObservation: args.dimensionAtObservation
          }
        );
        return { toolResult: data };
      }

      case "get_structure": {
        const args = GetStructureSchema.parse(request.params.arguments);
        if (args.structureId) {
          const structure = await apiClient.getStructure(
            args.structureType,
            args.agencyId,
            args.structureId,
            args.version,
            {
              detail: args.detail,
              references: args.references
            }
          );
          return { toolResult: structure };
        } else {
          const structures = await apiClient.getStructures(
            args.structureType,
            args.agencyId,
            {
              detail: args.detail,
              references: args.references
            }
          );
          return { toolResult: structures };
        }
      }

      case "get_metadata": {
        const args = GetMetadataSchema.parse(request.params.arguments);

        // Prepend CR_A_ to the dataflowId
        const structureId = `CR_A_${args.dataflowId}`;

        const structure = await apiClient.getStructure(
          args.metadataType as StructureType,
          API_CONFIG.defaultAgency,
          structureId,
          undefined,
          {
            detail: args.detail,
            references: args.references
          }
        );

        console.log(structure);
        if (structure === "Could not find requested structures") {
          return { toolResult: "No data exists" };
        }
        return { toolResult: structure };
      }

      case "get_dimension_list": {
        const args = GetDimensionListSchema.parse(request.params.arguments);
        const dimensionList = await apiClient.getDimensionList(args.dataflowId);
        return { toolResult: dimensionList };
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