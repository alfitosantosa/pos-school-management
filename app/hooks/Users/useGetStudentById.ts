"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetStudentById = (id: string) => {
  return useQuery({
    queryKey: ["students", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/students/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    enabled: !!id,
  });
};
