import { z } from "zod";

// Base schemas for common SDMX structures
export const DataflowSchema = z.object({
  id: z.string().describe("Dataflow identifier"),
  name: z.string().describe("Dataflow name"),
  version: z.string().describe("Dataflow version"),
  agency: z.string().describe("Agency identifier"),
});

export const StructureSchema = z.object({
  id: z.string().describe("Structure identifier"),
  name: z.string().describe("Structure name"),
  version: z.string().describe("Structure version"),
  agency: z.string().describe("Agency identifier"),
  type: z.string().describe("Type of structure"),
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
});

export const StructureListResponseSchema = z.object({
  structures: z.array(StructureSchema),
});

export const StructureResponseSchema = StructureSchema.extend({
  content: z.record(z.unknown()),
});

// Export types
export type Dataflow = z.infer<typeof DataflowSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureListParams = z.infer<typeof GetStructureListSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;
export type GetStructureVersionParams = z.infer<typeof GetStructureVersionSchema>;
export type DataResponse = z.infer<typeof DataResponseSchema>;
export type StructureListResponse = z.infer<typeof StructureListResponseSchema>;
export type StructureResponse = z.infer<typeof StructureResponseSchema>;
