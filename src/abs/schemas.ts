import { z } from "zod";

export interface DataflowInfo {
  id: string;
  name: string;
}

export const GetDataSchema = z.object({
  dataflowIdentifier: z.string().describe("The identifier of the dataflow"),
  dataKey: z.string().optional().describe("Optional key parameters"),
});

export type GetDataParams = z.infer<typeof GetDataSchema>;