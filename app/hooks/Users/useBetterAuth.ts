"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetBetterAuth = () => {
  return useQuery({
    queryKey: ["betterauth", "users"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/betterauth/users");
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
