// model Role {
//   id          String   @id @default(cuid())
//   name        String   @unique
//   description String
//   permissions String[]
//   isActive    Boolean  @default(true)
//   users       User[]

//   @@map("roles")
// }

import {
  z
} from 'zod';

export type RoleDataTypes = z.infer<typeof RoleSchema>;

const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(255),
  permissions: z.array(z.string().min(2).max(100)),
  isActive: z.boolean().default(true),
});

export type AcademicYearDataTypes = z.infer<typeof AcademicYearSchema>;

const AcademicYearSchema = z.object({
  id: z.string().uuid(),
  year: z.string().min(4).max(4),
  isActive: z.boolean().default(true),
});
