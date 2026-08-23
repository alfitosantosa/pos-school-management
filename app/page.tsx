// app/page.tsx
"use client";

import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/authClients";

import { Award, BookOpen, Building2, Calendar, CheckCircle, GraduationCap, Key, Mail, MapPin, Phone, School, Shield, User, Users } from "lucide-react";
import Image from "next/image";
import React from "react";

const NoUserDataComponent = ({ session }: { session?: { id: string; name: string; email: string; image?: string | null } }) => {
  console.log(session);
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Akun Belum Terhubung</CardTitle>
            <CardDescription>Akun Better Auth Anda belum terhubung dengan sistem sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            {session && (
              <Alert>
                <Shield className="h-5 w-5" />
                <AlertTitle>Informasi Akun</AlertTitle>
                <AlertDescription>
                  {session.image && (
                    <div className="mb-4">
                      <Image src={session.image} alt={session.name} width={64} height={64} className="rounded-full" />
                    </div>
                  )}
                  <p>
                    <strong>Nama:</strong> {session.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {session.email}
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const UserProfileSkeleton = () => (
  <div className="min-h-screen py-8 px-4">
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, variant = "default" }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | React.ReactNode; variant?: "default" | "success" | "warning" | "destructive" }) => {
  if (!value || value === "N/A") return null;

  const variantStyles = {
    default: "bg-muted",
    success: "bg-green-50 border-green-200",
    warning: "bg-yellow-50 border-yellow-200",
    destructive: "bg-red-50 border-red-200",
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold mt-1">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) => {
  if (value === null || value === undefined || value === "N/A" || (typeof value === "string" && value.trim() === "")) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const { data: userData, isPending: userLoading } = useGetUserByIdBetterAuth(session?.user?.id ?? "");

  if (userLoading) return <UserProfileSkeleton />;
  if (!userData) return <NoUserDataComponent session={session?.user} />;

  // Extract nested objects
  const { class: classData, major, academicYear, role, user, ...mainData } = userData;

  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/20 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {(user?.image || mainData.avatarUrl) && (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-xl ring-4 ring-primary/20">
                    <Image src={user?.image || mainData.avatarUrl || ""} alt={user?.name || mainData.name || "User Avatar"} width={128} height={128} className="w-full h-full object-cover" priority />
                  </div>
                  {mainData.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-background flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 text-center md:text-left">
                <CardTitle className="text-3xl md:text-4xl mb-2">{user?.name || mainData.name}</CardTitle>
                <CardDescription className="text-lg mb-4">{user?.email || mainData.email}</CardDescription>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {role?.name && (
                    <Badge variant="default" className="text-sm px-3 py-1">
                      <Shield className="h-3 w-3 mr-1" />
                      {role.name}
                    </Badge>
                  )}
                  {mainData.isActive !== undefined && (
                    <Badge variant={mainData.isActive ? "default" : "destructive"} className="text-sm px-3 py-1">
                      {mainData.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={School} label="Class" value={classData?.name} />
          <StatCard icon={BookOpen} label="Major" value={major?.name} />
          <StatCard icon={Calendar} label="Academic Year" value={academicYear?.year} />
          <StatCard icon={Users} label="Role" value={role?.name} />
        </div>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Basic personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoItem icon={Mail} label="Email" value={mainData.email} />
              <InfoItem icon={Phone} label="Parent Phone" value={mainData.parentPhone} />
              <InfoItem icon={MapPin} label="Address" value={mainData.address} />
              <InfoItem icon={Calendar} label="Birth Date" value={mainData.birthDate ? new Date(mainData.birthDate).toLocaleDateString("id-ID") : null} />
              <InfoItem icon={MapPin} label="Birth Place" value={mainData.birthPlace} />
              <InfoItem icon={User} label="Gender" value={mainData.gender} />
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Academic Information
            </CardTitle>
            <CardDescription>Academic details and enrollment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoItem icon={Key} label="NIK" value={mainData.nik} />
              <InfoItem icon={Key} label="NISN" value={mainData.nisn} />
              <InfoItem icon={Calendar} label="Enrollment Date" value={mainData.enrollmentDate ? new Date(mainData.enrollmentDate).toLocaleDateString("id-ID") : null} />
              <InfoItem icon={Calendar} label="Start Date" value={mainData.startDate ? new Date(mainData.startDate).toLocaleDateString("id-ID") : null} />
              <InfoItem icon={Calendar} label="End Date" value={mainData.endDate ? new Date(mainData.endDate).toLocaleDateString("id-ID") : null} />
              <InfoItem icon={Calendar} label="Graduation Date" value={mainData.graduationDate ? new Date(mainData.graduationDate).toLocaleDateString("id-ID") : null} />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        {(mainData.employeeId || mainData.position || mainData.relation) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Professional Information
              </CardTitle>
              <CardDescription>Work-related details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoItem icon={Key} label="Employee ID" value={mainData.employeeId} />
                <InfoItem icon={Award} label="Position" value={mainData.position} />
                <InfoItem icon={Users} label="Relation" value={mainData.relation} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
