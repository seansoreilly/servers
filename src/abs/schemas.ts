import { z } from "zod";

export interface DataflowInfo {
  id: string;
  name: string;
  version: string;
}

export interface StructureInfo {
  id: string;
  name: string;
  dimensions: DimensionInfo[];
}

export interface DimensionInfo {
  id: string;
  name: string;
  values: CodeInfo[];
}

export interface CodeInfo {
  id: string;
  name: string;
}

export const GetDataSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow"),
  dataKey: z.string().optional().describe("Optional key parameters"),
  startPeriod: z.string().optional().default("2021").describe("Start period (e.g., '2023')"),
  endPeriod: z.string().optional().default("2024").describe("End period (e.g., '2024')"),
  responseFormat: z.enum(["csvfile", "csvfilewithlabels"]).default("csvfilewithlabels").describe("CSV format type (csvfilewithlabels for codes and labels, csvfile for codes only)")
});

export const GetStructureSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow")
});

export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;