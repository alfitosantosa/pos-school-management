// model TahfidzGroup {
//   id                  String               @id @default(cuid())
//   name                String
//   grade               Int
//   capacity            Int                  @default(40)
//   isActive            Boolean              @default(true)
//   schedules           Schedule[]           @relation("TahfidzGroupSchedule")
//   students            UserData[]           @relation("UserTahfidzGroup")

import { ScheduleTypes } from "./schedule-types";
import { UserDataTypes } from "./userData";

//   @@unique([name])
//   @@index([grade])
//   @@map("tahfidz_groups")
// }

export interface tahfidzGroupTypes {
  id: string;
  name: string;
  grade: number;
  capacity: number;
  isActive: boolean;
  schedules: ScheduleTypes[];
  students: UserDataTypes[];
}
