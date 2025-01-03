import { z } from "zod";
export interface DataflowInfo {
    id: string;
    name: string;
}
export declare const GetDataSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
    dataKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
    dataKey?: string | undefined;
}, {
    dataflowIdentifier: string;
    dataKey?: string | undefined;
}>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
