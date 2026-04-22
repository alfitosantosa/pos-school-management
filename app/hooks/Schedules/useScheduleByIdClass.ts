"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetSchedulesByIdClass = (classId: string) => {
  return useQuery({
    queryKey: ["schedules", classId],
    queryFn: async () => {
      const response = await apiGet(`/api/schedules/class/${classId}`);
      return response.data;
    },
    enabled: !!classId,
  });
};
