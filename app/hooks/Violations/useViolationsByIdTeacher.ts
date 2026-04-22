"use client";

// app/api/violations/student/[id]/route.ts

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetViolationsByIdTeacher = (id: string) => {
  return useQuery({
    queryKey: ["violations", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/violations/teacher/${id}`);
        return res.data;
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || "Failed to fetch violations");
      }
    },
  });
};
