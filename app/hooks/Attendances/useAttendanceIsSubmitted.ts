"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

type AttendanceParams = {
    date: string;
    scheduleId: string;
}

export const useAttendanceIsSubmitted = ({date, scheduleId}: AttendanceParams) => {
    return useQuery<boolean>({
        queryKey: ["attendance-is-submitted", date, scheduleId],
        queryFn: async () => await apiGet<{data: boolean}>("/api/attendance/issubmited?date=" + date + "&scheduleId=" + scheduleId).then((res) => res.data.data ? true : false) ,
    });
};
