import { z } from "zod";

export interface DataflowInfo {
  id: string;
  name: string;
  version: string;
}

export interface StructureInfo {
  id: string;
  name: string;
  description?: string;
  version?: string;
  agencyID?: string;
  isFinal?: boolean;
  dimensions: DimensionInfo[];
}

export interface DimensionInfo {
  id: string;
  name: string;
  description?: string;
  position?: number;
  values: CodeInfo[];
}

export interface CodeInfo {
  id: string;
  name: string;
  description?: string;
  parent?: string;
  annotations?: Array<{
    title: string;
    text: string;
  }>;
}

export const GetDataSchema = z.object({
  dataflowIdentifier: z.string().min(1).describe("The identifier of the dataflow"),
  dataKey: z.string().optional().default('all').describe("Optional key parameters"),
  startPeriod: z.string().optional().describe("Start period (e.g., '2023')"),
  endPeriod: z.string().optional().describe("End period (e.g., '2024')"),
  responseFormat: z.enum(["csvfile", "csvfilewithlabels"]).default("csvfilewithlabels").describe("CSV format type (csvfilewithlabels for codes and labels, csvfile for codes only)")
});

export const GetStructureSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow")
});

export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;