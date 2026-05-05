import { z } from "zod";

const MajorSchema = z.object({
    id: z.string().min(1, "id not be null"),
    code: z.string().min(1, "code not be null"),
    name: z.string().min(1, "name not be null"),
    description: z.string(),
    isActive: z.boolean(),
    _count: z.object({
        classes: z.number(),
        students: z.number(),
        subjects: z.number(),
    }),
});

export type MajorDataTypes = z.infer<typeof MajorSchema>;

export const majorSchemaForm = z.object({
    code: z.string().min(1, "Kode jurusan wajib diisi"),
    name: z.string().min(1, "Nama jurusan wajib diisi"),
    description: z.string().min(1, "Deskripsi jurusan wajib diisi"),
    isActive: z.boolean(),
});

export type MajorFormValues = z.infer<typeof majorSchemaForm>;
