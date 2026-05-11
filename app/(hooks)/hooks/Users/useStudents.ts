"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetStudents = () => {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/students");
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};

export const useGetStudentByIdTahfidzGroup = (id: string) => {
  return useQuery({
    queryKey: ["students-by-tahfidz-group", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/students/tahfidzgroup/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
