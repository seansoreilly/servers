import { z } from "zod";

export interface DataflowInfo {
  id: string;
  name: string;
}

export const GetDataSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow"),
  dataKey: z.string().optional().describe("Optional key parameters"),
  startPeriod: z.string().optional().describe("Start period (e.g., '2023')"),
  endPeriod: z.string().optional().describe("End period (e.g., '2024')"),
  responseFormat: z.string().optional().default("csvfile").describe("requested response data format")
});

export type GetDataParams = z.infer<typeof GetDataSchema>;