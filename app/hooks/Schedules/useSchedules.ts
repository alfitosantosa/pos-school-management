"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetSchedules = () => {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const response = await apiGet("/api/schedules");
      return response.data;
    },
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiPost("/api/schedules", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiPut(`/api/schedules/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
};

export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiDelete("/api/schedules", {
        body: JSON.stringify({ id }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
};

export const useGetSchedulesByTeacher = (teacherId: string) => {
  return useQuery({
    queryKey: ["schedules", teacherId],
    queryFn: async () => {
      const response = await apiGet(`/api/schedules/teacher/${teacherId}`);
      return response.data;
    },
    enabled: !!teacherId, // Only run the query if teacherId is provided
  });
};

export const useGetSchedulesByStudent = (studentId: string) => {
  return useQuery({
    queryKey: ["schedules", studentId],
    queryFn: async () => {
      const response = await apiGet(`/api/schedules/student/${studentId}`);
      return response.data;
    },
    enabled: !!studentId, // Only run the query if studentId is provided
  });
};

export const useGetScheduleAcademicYearActive = () => {
  return useQuery({
    queryKey: ["schedules-with-academic-year-active"],
    queryFn: async () => {
      try {
        const res = await apiGet(`/api/schedules/active`);
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
