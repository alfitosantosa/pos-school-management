import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { ElementType } from "react";

// Icon mapping
const iconMap: Record<string, ElementType> = {
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

export const menuGroups: Record<string, MenuGroup[]> = {
  // =====================================================
  // ADMIN
  // =====================================================
  admin: [
    {
      title: "Utama",
      items: [
        // { title: "Home", url: "/", icon: "home" },
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Master Data",
      items: [
        {
          title: "BetterAuth",
          url: "/dashboard/betterauth",
          icon: "settings",
        },
        {
          title: "Roles",
          url: "/dashboard/roles",
          icon: "settings",
        },
        {
          title: "Users",
          url: "/dashboard/users",
          icon: "users",
        },
        {
          title: "Tahun Ajaran",
          url: "/dashboard/academicyear",
          icon: "academic",
        },
        {
          title: "Sekolah",
          url: "/dashboard/majors",
          icon: "academic",
        },
      ],
    },

    {
      title: "Akademik",
      items: [
        {
          title: "Kelas",
          url: "/dashboard/classes",
          icon: "academic",
        },
      ],
    },

    {
      title: "Keuangan",
      items: [
        {
          title: "Jenis Tagihan",
          url: "/dashboard/paymenttypes",
          icon: "payment",
        },
        {
          title: "Tagihan",
          url: "/dashboard/billing",
          icon: "file",
        },
        {
          title: "Transaksi",
          url: "/dashboard/payments",
          icon: "payment",
        },
        {
          title: "Account Bank",
          url: "/dashboard/accountbank",
          icon: "bank",
        },
        {
          title: "Informasi Siswa",
          url: "/dashboard/studentinformation",
          icon: "users",
        },
      ],
    },

    {
      title: "Dashboard",
      items: [
        {
          title: "Dashboard Transaksi",
          url: "/dashboard/payments/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Tagihan",
          url: "/dashboard/billing/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Saldo",
          url: "/dashboard/accountbank/chart",
          icon: "chart",
        },
      ],
    },

    {
      title: "Utilitas",
      items: [
        {
          title: "Upload Users",
          url: "/dashboard/upload/users",
          icon: "upload",
        },
      ],
    },
  ],
  // =====================================================
  // SCHOOL ADMINISTRATOR (TU)
  // Reuses existing admin/bendahara pages with branch filtering
  // =====================================================
  schooladministrator: [
    {
      title: "Utama",
      items: [
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Dashboard",
      items: [
        {
          title: "Dashboard Absensi",
          url: "/dashboard",
          icon: "chart",
        },
        {
          title: "Dashboard Transaksi",
          url: "/dashboard/payments/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Tagihan",
          url: "/dashboard/billing/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Saldo",
          url: "/dashboard/accountbank/chart",
          icon: "chart",
        },
      ],
    },

    {
      title: "Akademik",
      items: [
        {
          title: "Kelas",
          url: "/dashboard/classes",
          icon: "academic",
          items: [
            {
              title: "Kelas",
              url: "/dashboard/classes",
            },
            {
              title: "Grup Tahfidz",
              url: "/dashboard/classes/tahfidz",
            },
          ],
        },
        {
          title: "Absensi",
          url: "/dashboard/attendance",
          icon: "attendance",
          items: [
            {
              title: "Absensi",
              url: "/dashboard/attendance",
            },
            {
              title: "Backup Absensi",
              url: "/dashboard/admin/attendance",
            },
          ],
        },
        {
          title: "Rekap Absensi",
          url: "/dashboard/recapattendance",
          icon: "attendance",
          items: [
            {
              title: "Per Kelas",
              url: "/dashboard/recapattendance/class",
            },
          ],
        },
        {
          title: "Jadwal Khusus",
          url: "/dashboard/admin/academic/specialschedule",
          icon: "calendar",
        },
        {
          title: "Ujian",
          url: "/dashboard/teacher/exam",
          icon: "file",
        },
        {
          title: "Pengembangan Siswa",
          url: "/dashboard/admin/academic/development",
          icon: "academic",
        },
      ],
    },

    {
      title: "Pelanggaran",
      items: [
        {
          title: "Tipe Pelanggaran",
          url: "/dashboard/admin/discipline/typeviolations",
          icon: "violation",
        },
        {
          title: "Data Pelanggaran",
          url: "/dashboard/admin/discipline/violations",
          icon: "violation",
        },
      ],
    },

    {
      title: "Informasi",
      items: [
        {
          title: "Informasi Siswa",
          url: "/dashboard/bendahara/studentinformation",
          icon: "users",
        },
      ],
    },
    {
      title: "Utilitas",
      items: [
        {
          title: "Upload Siswa",
          url: "/dashboard/admin/utility/upload/users",
          icon: "users",
        },
        {
          title: "Upload Schedule",
          url: "/dashboard/admin/utility/upload/schedules",
          icon: "calendar",
        },
      ],
    },
    {
      title: "Pengembangan Siswa",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/teacher/development",
          icon: "academic",
        },
        {
          title: "Buku Catatan Harian",
          url: "/dashboard/teacher/development/logbook",
          icon: "file",
        },
        {
          title: "Kalender Logbook",
          url: "/dashboard/teacher/development/logbook/calendar",
          icon: "calendar",
        },
        {
          title: "Perkembangan Siswa",
          url: "/dashboard/teacher/development/students",
          icon: "chart",
        },
        {
          title: "Penilaian",
          url: "/dashboard/teacher/development/assessments",
          icon: "attendance",
        },
        {
          title: "Tugas & Nilai",
          url: "/dashboard/teacher/development/assignments",
          icon: "file",
        },
        {
          title: "Rapor",
          url: "/dashboard/teacher/development/reports",
          icon: "file",
        },
      ],
    },
  ],
  // =====================================================
  // bendahara
  // =====================================================
  bendahara: [
    {
      title: "Utama",
      items: [
        // { title: "Home", url: "/", icon: "home" },
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Dashboard",
      items: [
        {
          title: "Dashboard Transaksi",
          url: "/dashboard/payments/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Tagihan",
          url: "/dashboard/billing/chart",
          icon: "chart",
        },
        {
          title: "Dashboard Saldo",
          url: "/dashboard/accountbank/chart",
          icon: "chart",
        },
      ],
    },

    {
      title: "Keuangan",
      items: [
        {
          title: "Jenis Tagihan",
          url: "/dashboard/bendahara/paymenttype",
          icon: "payment",
        },
        {
          title: "Data Tagihan Rutin",
          url: "/dashboard/bendahara/billing/routine",
          icon: "file",
        },
        {
          title: "Data Tagihan",
          url: "/dashboard/bendahara/billing",
          icon: "file",
        },
        {
          title: "Data Transaksi",
          url: "/dashboard/bendahara/payment",
          icon: "payment",
        },
        {
          title: "Data Kelas",
          url: "/dashboard/bendahara/class",
          icon: "academic",
        },
        {
          title: "Data Siswa",
          url: "/dashboard/bendahara/users",
          icon: "users",
        },
        {
          title: "Informasi Siswa",
          url: "/dashboard/bendahara/studentinformation",
          icon: "users",
        },
      ],
    },

    {
      title: "Upload Data",
      items: [
        {
          title: "Upload Tagihan",
          url: "/dashboard/bendahara/billing/upload",
          icon: "upload",
        },
        {
          title: "Upload Siswa",
          url: "/dashboard/bendahara/users/upload",
          icon: "upload",
        },
      ],
    },
  ],

  // =====================================================
  // TEACHER
  // =====================================================
  teacher: [
    {
      title: "Utama",
      items: [
        // { title: "Home", url: "/", icon: "home" },
        { title: "Dashboard", url: "/dashboard", icon: "dashboard" },
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Akademik",
      items: [
        {
          title: "Jadwal Saya",
          url: "/dashboard/teacher/schedule",
          icon: "calendar",
        },
        {
          title: "Absensi Kepala Sekolah",
          url: "/dashboard/teacher/attendance",
          icon: "attendance",
        },
        {
          title: "Kalender",
          url: "/dashboard/teacher/calender",
          icon: "calendar",
        },
        {
          title: "Ujian",
          url: "/dashboard/teacher/exam",
          icon: "file",
        },
      ],
    },

    {
      title: "Pelanggaran",
      items: [
        {
          title: "Data Pelanggaran",
          url: "/dashboard/teacher/violations",
          icon: "violation",
        },
      ],
    },
    {
      title: "Pengembangan Siswa",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard/teacher/development",
          icon: "academic",
        },
        {
          title: "Buku Catatan Harian",
          url: "/dashboard/teacher/development/logbook",
          icon: "file",
        },
        {
          title: "Kalender Logbook",
          url: "/dashboard/teacher/development/logbook/calendar",
          icon: "calendar",
        },
        {
          title: "Perkembangan Siswa",
          url: "/dashboard/teacher/development/students",
          icon: "chart",
        },
        {
          title: "Penilaian",
          url: "/dashboard/teacher/development/assessments",
          icon: "attendance",
        },
        {
          title: "Tugas & Nilai",
          url: "/dashboard/teacher/development/assignments",
          icon: "file",
        },
        {
          title: "Rapor",
          url: "/dashboard/teacher/development/reports",
          icon: "file",
        },
      ],
    },
  ],
  // =====================================================
  // STUDENT
  // =====================================================
  student: [
    {
      title: "Utama",
      items: [
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Akademik",
      items: [
        {
          title: "Jadwal",
          url: "/dashboard/student/schedule",
          icon: "calendar",
        },
        {
          title: "Absensi",
          url: "/dashboard/student/attendance",
          icon: "attendance",
        },
        {
          title: "Setoran Tahfidz",
          url: "/dashboard/student/tahfidzrecord",
          icon: "academic",
        },
        {
          title: "Kalender",
          url: "/dashboard/student/calender",
          icon: "calendar",
        },
        {
          title: "Ujian",
          url: "/dashboard/student/exam",
          icon: "file",
        },
      ],
    },

    {
      title: "Keuangan",
      items: [
        {
          title: "Pembayaran",
          url: "/dashboard/student/payment",
          icon: "payment",
        },
      ],
    },

    {
      title: "Pelanggaran",
      items: [
        {
          title: "Data Pelanggaran",
          url: "/dashboard/student/violations",
          icon: "violation",
        },
      ],
    },

    {
      title: "Pengembangan Siswa",
      items: [
        {
          title: "Tugas Saya",
          url: "/dashboard/student/development/assignments",
          icon: "file",
        },
        {
          title: "Perkembangan Saya",
          url: "/dashboard/student/development",
          icon: "chart",
        },
      ],
    },
  ],

  // =====================================================
  // PARENT
  // =====================================================
  parent: [
    {
      title: "Utama",
      items: [
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },

    {
      title: "Informasi Anak",
      items: [
        {
          title: "Portal Orang Tua",
          url: "/dashboard/parent",
          icon: "users",
        },
      ],
    },

    {
      title: "Pengembangan Anak",
      items: [
        {
          title: "Perkembangan Anak",
          url: "/dashboard/parent/development",
          icon: "chart",
        },
        {
          title: "Rapor Anak",
          url: "/dashboard/parent/development/report",
          icon: "file",
        },
      ],
    },
  ],

  // =====================================================
  // NULL
  // =====================================================
  null: [
    {
      title: "Utama",
      items: [
        {
          title: "Profile",
          url: "/dashboard/profile",
          icon: "users",
        },
      ],
    },
  ],
};
