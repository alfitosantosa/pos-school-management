/**
 * Konfigurasi Swagger untuk dokumentasi API
 * File ini mendefinisikan informasi dasar tentang API dan rute-rute yang tersedia
 */

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "SMK Fajar Sentosa API Documentation",
    version: "1.0.0",
    description: "Dokumentasi lengkap untuk API backend sistem manajemen sekolah SMK Fajar Sentosa",
    contact: {
      name: "Tim Pengembang",
      email: "dev@rahmaniyah.id",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Server development lokal",
    },
    {
      url: "https://api.rahmaniyah.id/api",
      description: "Server produksi",
    },
  ],
  tags: [
    {
      name: "Auth",
      description: "Operasi otentikasi dan otorisasi",
    },
    {
      name: "Users",
      description: "Operasi pengguna dan profil",
    },
    {
      name: "Students",
      description: "Operasi data siswa",
    },
    {
      name: "Teachers",
      description: "Operasi data guru",
    },
    {
      name: "Payments",
      description: "Operasi pembayaran dan transaksi",
    },
    {
      name: "Attendance",
      description: "Operasi kehadiran dan absensi",
    },
    {
      name: "Academic",
      description: "Operasi akademik dan kurikulum",
    },
    {
      name: "Admin",
      description: "Operasi administrasi sistem",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      apiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Pesan error yang deskriptif",
          },
          code: {
            type: "string",
            description: "Kode error untuk referensi",
          },
          details: {
            type: "object",
            description: "Detail tambahan error",
          },
        },
      },
      User: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID unik pengguna",
          },
          email: {
            type: "string",
            format: "email",
            description: "Email pengguna",
          },
          name: {
            type: "string",
            description: "Nama lengkap pengguna",
          },
          role: {
            type: "string",
            enum: ["admin", "teacher", "student", "parent"],
            description: "Role pengguna dalam sistem",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Tanggal pembuatan akun",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Tanggal terakhir update",
          },
        },
      },
      Student: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID unik siswa",
          },
          nis: {
            type: "string",
            description: "Nomor Induk Siswa",
          },
          name: {
            type: "string",
            description: "Nama lengkap siswa",
          },
          class: {
            type: "string",
            description: "Kelas siswa",
          },
          major: {
            type: "string",
            description: "Jurusan siswa",
          },
          birthDate: {
            type: "string",
            format: "date",
            description: "Tanggal lahir",
          },
          address: {
            type: "string",
            description: "Alamat siswa",
          },
          phone: {
            type: "string",
            description: "Nomor telepon",
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: "Token akses tidak valid atau tidak ada",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Unauthorized: Token tidak valid",
              code: "UNAUTHORIZED",
            },
          },
        },
      },
      ForbiddenError: {
        description: "Akses ditolak, pengguna tidak memiliki izin",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Forbidden: Anda tidak memiliki izin untuk mengakses sumber daya ini",
              code: "FORBIDDEN",
            },
          },
        },
      },
      NotFoundError: {
        description: "Sumber daya tidak ditemukan",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Sumber daya tidak ditemukan",
              code: "NOT_FOUND",
            },
          },
        },
      },
      ValidationError: {
        description: "Validasi input gagal",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Validasi gagal",
              code: "VALIDATION_ERROR",
              details: {
                email: "Email tidak valid",
                password: "Password minimal 8 karakter",
              },
            },
          },
        },
      },
      ServerError: {
        description: "Kesalahan server internal",
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/Error",
            },
            example: {
              message: "Kesalahan server internal",
              code: "INTERNAL_SERVER_ERROR",
            },
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Opsi untuk swagger-jsdoc
const options = {
  swaggerDefinition,
  apis: ["./app/(backend)/api/**/*.ts", "./app/(backend)/api/**/*.js", "./lib/**/*.ts", "./lib/**/*.js"],
};

module.exports = options;
