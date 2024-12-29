import { z } from "zod";
export declare const DataflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    agency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    agency: string;
}, {
    id: string;
    name: string;
    version: string;
    agency: string;
}>;
export declare const StructureSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    agency: z.ZodString;
    type: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    agency: string;
    type: string;
}, {
    id: string;
    name: string;
    version: string;
    agency: string;
    type: string;
}>;
export declare const GetDataSchema: z.ZodObject<{
    dataflowIdentifier: z.ZodString;
    dataKey: z.ZodString;
    format: z.ZodDefault<z.ZodOptional<z.ZodEnum<["xml", "json", "csv"]>>>;
}, "strip", z.ZodTypeAny, {
    dataflowIdentifier: string;
    dataKey: string;
    format: "xml" | "json" | "csv";
}, {
    dataflowIdentifier: string;
    dataKey: string;
    format?: "xml" | "json" | "csv" | undefined;
}>;
export declare const GetStructureListSchema: z.ZodObject<{
    structureType: z.ZodString;
    agencyId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    structureType: string;
    agencyId: string;
}, {
    structureType: string;
    agencyId: string;
}>;
export declare const GetStructureSchema: z.ZodObject<{
    structureType: z.ZodString;
    agencyId: z.ZodString;
    structureId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    structureType: string;
    agencyId: string;
    structureId: string;
}, {
    structureType: string;
    agencyId: string;
    structureId: string;
}>;
export declare const GetStructureVersionSchema: z.ZodObject<z.objectUtil.extendShape<{
    structureType: z.ZodString;
    agencyId: z.ZodString;
    structureId: z.ZodString;
}, {
    structureVersion: z.ZodString;
}>, "strip", z.ZodTypeAny, {
    structureType: string;
    agencyId: string;
    structureId: string;
    structureVersion: string;
}, {
    structureType: string;
    agencyId: string;
    structureId: string;
    structureVersion: string;
}>;
export declare const DataResponseSchema: z.ZodObject<{
    header: z.ZodObject<{
        id: z.ZodString;
        test: z.ZodBoolean;
        prepared: z.ZodString;
        sender: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
        }, {
            id: string;
            name: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        test: boolean;
        prepared: string;
        sender: {
            id: string;
            name: string;
        };
    }, {
        id: string;
        test: boolean;
        prepared: string;
        sender: {
            id: string;
            name: string;
        };
    }>;
    dataSets: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
    error: z.ZodOptional<z.ZodString>;
    format: z.ZodOptional<z.ZodEnum<["json", "xml", "raw"]>>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    header: {
        id: string;
        test: boolean;
        prepared: string;
        sender: {
            id: string;
            name: string;
        };
    };
    dataSets: Record<string, unknown>[];
    format?: "xml" | "json" | "raw" | undefined;
    error?: string | undefined;
    content?: string | undefined;
}, {
    header: {
        id: string;
        test: boolean;
        prepared: string;
        sender: {
            id: string;
            name: string;
        };
    };
    dataSets: Record<string, unknown>[];
    format?: "xml" | "json" | "raw" | undefined;
    error?: string | undefined;
    content?: string | undefined;
}>;
export declare const StructureListResponseSchema: z.ZodObject<{
    structures: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        version: z.ZodString;
        agency: z.ZodString;
        type: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        version: string;
        agency: string;
        type: string;
    }, {
        id: string;
        name: string;
        version: string;
        agency: string;
        type: string;
    }>, "many">;
    format: z.ZodOptional<z.ZodEnum<["json", "xml", "raw"]>>;
    content: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    structures: {
        id: string;
        name: string;
        version: string;
        agency: string;
        type: string;
    }[];
    format?: "xml" | "json" | "raw" | undefined;
    content?: string | undefined;
}, {
    structures: {
        id: string;
        name: string;
        version: string;
        agency: string;
        type: string;
    }[];
    format?: "xml" | "json" | "raw" | undefined;
    content?: string | undefined;
}>;
export declare const StructureResponseSchema: z.ZodObject<z.objectUtil.extendShape<{
    id: z.ZodString;
    name: z.ZodString;
    version: z.ZodString;
    agency: z.ZodString;
    type: z.ZodString;
}, {
    content: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    format: z.ZodOptional<z.ZodEnum<["json", "xml", "raw"]>>;
}>, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    version: string;
    agency: string;
    type: string;
    content: Record<string, unknown>;
    format?: "xml" | "json" | "raw" | undefined;
}, {
    id: string;
    name: string;
    version: string;
    agency: string;
    type: string;
    content: Record<string, unknown>;
    format?: "xml" | "json" | "raw" | undefined;
}>;
export type Dataflow = z.infer<typeof DataflowSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type GetDataParams = z.infer<typeof GetDataSchema>;
export type GetStructureListParams = z.infer<typeof GetStructureListSchema>;
export type GetStructureParams = z.infer<typeof GetStructureSchema>;
export type GetStructureVersionParams = z.infer<typeof GetStructureVersionSchema>;
export type DataResponse = z.infer<typeof DataResponseSchema>;
export type StructureListResponse = z.infer<typeof StructureListResponseSchema>;
export type StructureResponse = z.infer<typeof StructureResponseSchema>;
export declare const DataflowListSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const DataflowDetailsSchema: z.ZodObject<{
    dataflowId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dataflowId: string;
}, {
    dataflowId: string;
}>;
export type DataflowInfo = {
    id: string;
    name: string;
    description?: string;
    agency: string;
    version: string;
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
    attributes: any[];
};
