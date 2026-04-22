"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetScheduleById = (id: string) => {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/schedules/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    enabled: !!id,
  });
};

export const useGetScheduleByIdTeacher = (id: string) => {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/schedules/teacher/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    enabled: !!id,
  });
};

export const useGetScheduleByIdAcademicYearActive = (id: string) => {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/schedules/active/teacher/${id}`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
    enabled: !!id,
  });
};


