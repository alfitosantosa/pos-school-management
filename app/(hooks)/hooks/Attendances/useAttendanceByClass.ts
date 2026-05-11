"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetAttendanceByClass = (classId?: string, startDate?: string, endDate?: string) => {
  const params = new URLSearchParams();
  if (classId) params.append("classId", classId);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  return useQuery({
    queryKey: ["attendanceByClass", classId, startDate, endDate],
    queryFn: async () => {
      const response = await apiGet(`/api/attendance/class${params.toString() ? `?${params}` : ""}`);
      return response.data?.data;
    },
    enabled: !!classId && !!startDate && !!endDate,
  });
};
