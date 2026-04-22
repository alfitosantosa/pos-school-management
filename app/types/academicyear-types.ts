// model AcademicYear {
//   id             String          @id @default(cuid())
//   year           String          @unique
//   startDate      DateTime
//   endDate        DateTime
//   isActive       Boolean         @default(false)
//   createdAt      DateTime        @default(now())
//   updatedAt      DateTime        @updatedAt
//   calendarEvents CalendarEvent[]
//   classes        Class[]
//   schedules      Schedule[]
//   students       Student[]
//   violationTypes ViolationType[]

//   @@map("academic_years")
// }

import { z } from "zod";

// Type definitions
// export type AcademicYearData = {
//   id: string;
//   year: string;
//   startDate: string;
//   endDate: string;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   _count: {
//     students: number;
//     schedules: number;
//     calendarEvents: number;
//     classes: number;
//   };
// };

const academicYearDataTypes = z.object({
  id: z.string().uuid(),
  year: z.string().min(1, "Tahun ajaran wajib diisi"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
  isActive: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  _count: z.object({
    students: z.number().min(0),
    schedules: z.number().min(0),
    calendarEvents: z.number().min(0),
    classes: z.number().min(0),
  }),
});

export type AcademicYearDataTypes = z.infer<typeof academicYearDataTypes>;

// Form schema
export const academicYearSchema = z
  .object({
    year: z.string().min(1, "Tahun ajaran wajib diisi"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: "Tanggal selesai harus setelah tanggal mulai",
      path: ["endDate"],
    },
  );

export type AcademicYearForm = z.infer<typeof academicYearSchema>;
