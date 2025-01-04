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
export declare const GetDataSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
    dataKey: z.ZodOptional<z.ZodString>;
    startPeriod: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    endPeriod: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    responseFormat: z.ZodDefault<z.ZodEnum<["csvfile", "csvfilewithlabels"]>>;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
    startPeriod: string;
    endPeriod: string;
    responseFormat: "csvfile" | "csvfilewithlabels";
    dataKey?: string | undefined;
}, {
    dataflowIdentifier: string;
    dataKey?: string | undefined;
    startPeriod?: string | undefined;
    endPeriod?: string | undefined;
    responseFormat?: "csvfile" | "csvfilewithlabels" | undefined;
}>;
export declare const GetStructureSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
}, {
    dataflowIdentifier: string;
}>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;
