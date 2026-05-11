"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export const useGetBetterAuthWithoutUserData = () => {
  return useQuery({
    queryKey: ["betterauth", "users", "withoutUserData"],
    queryFn: async () => {
      try {
        const res = await apiGet("/api/betterauth/users/withoutuserdata");
        return res.data;
      } catch (error) {
        console.error(error);
      }
    },
  });
};
