import { z } from "zod";
export interface DataflowInfo {
    id: string;
    name: string;
    version: string;
}
export declare const GetDataSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
    dataKey: z.ZodOptional<z.ZodString>;
    startPeriod: z.ZodOptional<z.ZodString>;
    endPeriod: z.ZodOptional<z.ZodString>;
    responseFormat: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
    responseFormat: string;
    dataKey?: string | undefined;
    startPeriod?: string | undefined;
    endPeriod?: string | undefined;
}, {
    dataflowIdentifier: string;
    dataKey?: string | undefined;
    startPeriod?: string | undefined;
    endPeriod?: string | undefined;
    responseFormat?: string | undefined;
}>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
