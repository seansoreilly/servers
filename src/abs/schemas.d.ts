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
export declare const GetDataSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
    dataKey: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startPeriod: z.ZodOptional<z.ZodString>;
    endPeriod: z.ZodOptional<z.ZodString>;
    responseFormat: z.ZodDefault<z.ZodEnum<["csvfile", "csvfilewithlabels"]>>;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
    dataKey: string;
    responseFormat: "csvfile" | "csvfilewithlabels";
    startPeriod?: string | undefined;
    endPeriod?: string | undefined;
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
