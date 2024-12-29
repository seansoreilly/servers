import { z } from "zod";

// Base schemas for common SDMX structures
export const DataflowSchema = z.object({
  id: z.string().describe("Dataflow identifier"),
  agencyID: z.string().describe("Agency identifier"),
  name: z.string().describe("Dataflow name"),
});

// Request schemas for tools
export const GetDataSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow"),
  dataKey: z.string().describe("The key identifying specific data"),
  format: z.enum(["xml", "json", "csv"]).optional().default("json").describe("Response format"),
});

export const GetStructureListSchema = z.object({
  structureType: z.string().describe("Type of structure to retrieve"),
  agencyId: z.string().describe("The agency identifier"),
});

export const GetStructureSchema = z.object({
  structureType: z.string().describe("Type of structure to retrieve"),
  agencyId: z.string().describe("The agency identifier"),
  structureId: z.string().describe("The structure identifier"),
});

export const GetStructureVersionSchema = GetStructureSchema.extend({
  structureVersion: z.string().describe("Version of the structure"),
});

// Response schemas
export const DataResponseSchema = z.object({
  header: z.object({
    id: z.string(),
    test: z.boolean(),
    prepared: z.string(),
    sender: z.object({
      id: z.string(),
      name: z.string(),
    }),
  }),
  dataSets: z.array(z.record(z.unknown())),
  error: z.string().optional(),
  format: z.enum(['json', 'xml', 'raw']).optional(),
  content: z.string().optional()
});

export const StructureListResponseSchema = z.object({
  structures: z.array(z.record(z.unknown())),
  format: z.enum(['json', 'xml', 'raw']).optional(),
  content: z.string().optional()
});

export const StructureResponseSchema = z.object({
  content: z.record(z.unknown()),
  format: z.enum(['json', 'xml', 'raw']).optional(),
});

// Export types
export type Dataflow = z.infer<typeof DataflowSchema>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureListParams = z.infer<typeof GetStructureListSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;
export type GetStructureVersionParams = z.infer<typeof GetStructureVersionSchema>;
export type DataResponse = z.infer<typeof DataResponseSchema>;
export type StructureListResponse = z.infer<typeof StructureListResponseSchema>;
export type StructureResponse = z.infer<typeof StructureResponseSchema>;

// Add these new schemas and types
export const DataflowListSchema = z.object({});

export const DataflowDetailsSchema = z.object({
  dataflowId: z.string().describe("The identifier of the dataflow")
});

export type DataflowInfo = {
  id: string;
  agencyID: string;
  name: string;
};

export type DimensionValue = {
  id: string;
  name: string;
};

export type Dimension = {
  id: string;
  name: string;
  values: DimensionValue[];
};

export type Measure = {
  id: string;
  name: string;
};

export type DataflowDetails = {
  id: string;
  name: string;
  dimensions: Dimension[];
  measures: Measure[];
  attributes: any[]; // Type can be made more specific based on actual API response
};