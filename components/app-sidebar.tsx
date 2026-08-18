"use client";

import * as React from "react";
import { Home, LayoutDashboard, Users, GraduationCap, Calendar, ClipboardCheck, AlertTriangle, CreditCard, Upload, MessageSquare, BarChart3, Building2, FileText, Settings, ChevronRight, LogOut, User as UserIcon } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/Logo.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useSession, signOut } from "@/lib/auth-client";
import { useGetUserByIdBetterAuth } from "@/app/(hooks)/hooks/Users/useUsersByIdBetterAuth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  home: Home,
  dashboard: LayoutDashboard,
  users: Users,
  academic: GraduationCap,
  calendar: Calendar,
  attendance: ClipboardCheck,
  violation: AlertTriangle,
  payment: CreditCard,
  upload: Upload,
  bot: MessageSquare,
  chart: BarChart3,
  bank: Building2,
  file: FileText,
  settings: Settings,
};

// Menu structure with grouping
type MenuItem = {
  title: string;
  url: string;
  icon?: keyof typeof iconMap;
  items?: MenuItem[];
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

// Define menu groups
const menuGroups: Record<string, MenuGroup[]> = {
  // Admin menu
  admin: [
    {
      title: "Utama",
      items: [
        { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Master Data",
      items: [
        { title: "BetterAuth", url: "/dashboard/betterauth", icon: "settings" },
        { title: "Roles", url: "/dashboard/roles", icon: "settings" },
        { title: "Users", url: "/dashboard/users", icon: "users" },
        { title: "Tahun Ajaran", url: "/dashboard/academicyear", icon: "academic" },
        { title: "Branch", url: "/dashboard/majors", icon: "academic" },
        { title: "Kelas", url: "/dashboard/classes", icon: "academic" },
        { title: "Mata Pelajaran", url: "/dashboard/subjects", icon: "academic" },
        { title: "Tahfidz Group", url: "/dashboard/classes/tahfidz", icon: "academic" },
      ],
    },
    {
      title: "Akademik",
      items: [
        { title: "Jadwal", url: "/dashboard/schedules", icon: "calendar" },
        { title: "Jadwal Khusus", url: "/dashboard/specialschedule", icon: "calendar" },
        { title: "Absensi", url: "/dashboard/attendance", icon: "attendance" },
        { title: "Setoran Tahfidz", url: "/dashboard/tahfidzrecord", icon: "academic" },
        {
          title: "Kalender",
          url: "/dashboard/calender",
          icon: "calendar",
          items: [
            { title: "Guru", url: "/dashboard/calender/teacher" },
            { title: "Siswa", url: "/dashboard/calender/student" },
            { title: "List Guru", url: "/dashboard/calender/list/teacher" },
            { title: "List Siswa", url: "/dashboard/calender/list/student" },
          ],
        },
        {
          title: "Rekap Absensi",
          url: "/dashboard/recapattendance",
          icon: "attendance",
          items: [{ title: "Per Kelas", url: "/dashboard/recapattendance/class" }],
        },
      ],
    },
    {
      title: "Pelanggaran",
      items: [
        { title: "Jenis Pelanggaran", url: "/dashboard/typeviolations", icon: "violation" },
        { title: "Data Pelanggaran", url: "/dashboard/violations", icon: "violation" },
      ],
    },
    {
      title: "Keuangan",
      items: [
        { title: "Jenis Tagihan", url: "/dashboard/paymenttypes", icon: "payment" },
        { title: "Tagihan", url: "/dashboard/billing", icon: "file" },
        { title: "Transaksi", url: "/dashboard/payments", icon: "payment" },
        { title: "Account Bank", url: "/dashboard/accountbank", icon: "bank" },
        { title: "Informasi Siswa", url: "/dashboard/studentinformation", icon: "users" },
      ],
    },
    {
      title: "Dashboard",
      items: [
        { title: "Dashboard Transaksi", url: "/dashboard/payments/chart", icon: "chart" },
        { title: "Dashboard Tagihan", url: "/dashboard/billing/chart", icon: "chart" },
        { title: "Dashboard Saldo", url: "/dashboard/accountbank/chart", icon: "chart" },
      ],
    },
    {
      title: "Utilitas",
      items: [
        { title: "Upload Users", url: "/dashboard/upload/users", icon: "upload" },
        { title: "Upload Jadwal", url: "/dashboard/upload/schedules", icon: "upload" },
        { title: "Botwa", url: "/dashboard/botwa", icon: "bot" },
      ],
    },
  ],
  // Bendahara menu
  bendahara: [
    {
      title: "Utama",
      items: [
        { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Dashboard",
      items: [
        { title: "Dashboard Transaksi", url: "/dashboard/payments/chart", icon: "chart" },
        { title: "Dashboard Tagihan", url: "/dashboard/billing/chart", icon: "chart" },
        { title: "Dashboard Saldo", url: "/dashboard/accountbank/chart", icon: "chart" },
      ],
    },
    {
      title: "Keuangan",
      items: [
        { title: "Data Transaksi", url: "/dashboard/bendahara/payment", icon: "payment" },
        { title: "Data Tagihan", url: "/dashboard/bendahara/billing", icon: "file" },
        { title: "Jenis Tagihan", url: "/dashboard/bendahara/paymenttype", icon: "payment" },
        { title: "Data Siswa", url: "/dashboard/bendahara/users", icon: "users" },
        { title: "Data Kelas", url: "/dashboard/bendahara/class", icon: "academic" },
        { title: "Informasi Siswa", url: "/dashboard/bendahara/studentinformation", icon: "users" },
      ],
    },
    {
      title: "Upload Data",
      items: [
        { title: "Upload Tagihan", url: "/dashboard/bendahara/billing/upload", icon: "upload" },
        { title: "Upload Siswa", url: "/dashboard/bendahara/users/upload", icon: "upload" },
      ],
    },
  ],
  // Teacher menu
  teacher: [
    {
      title: "Utama",
      items: [
        { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Akademik",
      items: [
        { title: "Jadwal Saya", url: "/dashboard/teacher/schedule", icon: "calendar" },
        { title: "Absensi Kepala Sekolah", url: "/dashboard/attendance/teacher", icon: "attendance" },
        {
          title: "Kalender",
          url: "/dashboard/calender/teacher",
          icon: "calendar",
          items: [{ title: "List Kalender", url: "/dashboard/calender/list/teacher" }],
        },
      ],
    },
    {
      title: "Pelanggaran",
      items: [{ title: "Data Pelanggaran", url: "/dashboard/violations/teacher", icon: "violation" }],
    },
  ],
  // Student menu
  student: [
    {
      title: "Utama",
      items: [
        { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Akademik",
      items: [
        { title: "Jadwal", url: "/dashboard/student/schedule", icon: "calendar" },
        { title: "Absensi", url: "/dashboard/student/attendance", icon: "attendance" },
        { title: "Setoran Tahfidz", url: "/dashboard/student/tahfidzrecord", icon: "academic" },
        {
          title: "Kalender",
          url: "/dashboard/calender/student",
          icon: "calendar",
          items: [{ title: "List Kalender", url: "/dashboard/calender/list/student" }],
        },
      ],
    },
    {
      title: "Keuangan",
      items: [{ title: "Pembayaran", url: "/dashboard/student/payment", icon: "payment" }],
    },
    {
      title: "Pelanggaran",
      items: [{ title: "Data Pelanggaran", url: "/dashboard/violations/student", icon: "violation" }],
    },
  ],
  // Parent menu
  parent: [
    {
      title: "Utama",
      items: [
        { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
      ],
    },
    {
      title: "Informasi Anak",
      items: [{ title: "Portal Orang Tua", url: "/dashboard/parent", icon: "users" }],
    },
  ],
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const { data: userData } = useGetUserByIdBetterAuth(session?.user?.id ?? "");

  const userRole = userData?.role?.name?.toLowerCase() || "student";
  const permissions = userData?.role?.permissions || [];

  // Get menu groups based on role
  const currentMenuGroups = menuGroups[userRole] || menuGroups.student;

  // Filter menu items based on permissions
  const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter((item) => {
        // If item has sub-items, filter them recursively
        if (item.items) {
          const filteredSub = filterMenuByPermissions(item.items);
          return filteredSub.length > 0;
        }
        // Check if user has permission
        return permissions.includes(item.url);
      })
      .map((item) => {
        if (item.items) {
          return {
            ...item,
            items: filterMenuByPermissions(item.items),
          };
        }
        return item;
      });
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/sign-in");
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Image src={Logo} alt="Logo" className="h-10 w-10" loading="eager" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Rahmaniyah</span>
            <span className="text-xs text-muted-foreground">Sistem Informasi</span>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="px-3 py-4">
        {currentMenuGroups.map((group, groupIndex) => {
          const filteredItems = filterMenuByPermissions(group.items);
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={groupIndex} className="mb-4">
              <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const Icon = item.icon ? iconMap[item.icon] : null;
                    const isActive = pathname === item.url;
                    const hasSubItems = item.items && item.items.length > 0;

                    if (hasSubItems) {
                      return (
                        <Collapsible key={item.url} defaultOpen={item.items?.some((sub) => pathname === sub.url)}>
                          <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                              <SidebarMenuButton className="w-full">
                                {Icon && <Icon className="h-4 w-4" />}
                                <span>{item.title}</span>
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                              </SidebarMenuButton>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <SidebarMenuSub className="ml-4 mt-1">
                                {item.items?.map((subItem) => {
                                  const isSubActive = pathname === subItem.url;
                                  return (
                                    <SidebarMenuSubItem key={subItem.url}>
                                      <SidebarMenuSubButton asChild isActive={isSubActive} onClick={() => router.push(subItem.url)}>
                                        <span>{subItem.title}</span>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          </SidebarMenuItem>
                        </Collapsible>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.url}>
                        <SidebarMenuButton asChild isActive={isActive} onClick={() => router.push(item.url)}>
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors">
              <Avatar className="h-9 w-9">
                {userData?.avatarUrl && <Image width={36} height={36} src={userData.avatarUrl} alt={userData.name || "User"} className="rounded-full" />}
                <AvatarFallback className="text-xs">{getUserInitials(userData?.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-medium truncate w-full">{userData?.name || "User"}</span>
                <span className="text-xs text-muted-foreground truncate w-full">{userData?.role?.name || "Role"}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
