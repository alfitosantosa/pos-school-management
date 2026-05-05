"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client";

export const useGetTeachers = () => {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await apiGet("/api/teachers");
      if (res.status >= 400) throw new Error(res.data?.error || "Failed to fetch teachers");
      return res.data;
    },
  });
};

export const useCreateTeacher = () => {
  return async (data: any) => {
    try {
      const res = await apiPost("/api/teachers", data);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  };
};

export const useUpdateTeacher = () => {
  return async (data: any) => {
    try {
      const res = await apiPut("/api/teachers", data);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  };
};

export const useDeleteTeacher = () => {
  return async (id: string) => {
    try {
      const res = await apiDelete(`/api/teachers?id=${id}`);
      return res.data;
    } catch (error) {
      console.error(error);
    }
  };
};
