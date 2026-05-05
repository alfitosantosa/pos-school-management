"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetAttendanceByIdStudent = (id: string) => {
  return useQuery({
    queryKey: ["attendance", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/attendance/student/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    enabled: !!id,
  });
};
