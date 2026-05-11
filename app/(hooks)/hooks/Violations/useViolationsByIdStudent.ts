"use client";

// app/api/violations/student/[id]/route.ts

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetViolationsByIdStudent = (id: string) => {
  return useQuery({
    queryKey: ["violations", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/violations/student/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
