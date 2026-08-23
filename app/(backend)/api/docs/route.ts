import { swaggerPaths } from '@/lib/swaggerPath';
import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';

/**
 * API endpoint untuk menghasilkan OpenAPI specification
 * Endpoint ini akan di-generate secara dinamis dari konfigurasi swagger
 */
export async function GET() {
  try {
    const swaggerOptions = {
      definition: {
        openapi: '3.0.0',
        info: {
          title: 'SMK Fajar Sentosa POS API',
          version: '1.0.0',
          description: 'Dokumentasi lengkap untuk API backend sistem Point of Sale SMK Fajar Sentosa',
          contact: {
            name: 'Tim Pengembang',
            email: 'dev@rahmaniyah.id'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: 'http://localhost:3000/api',
            description: 'Server development lokal'
          },
          {
            url: 'https://api.rahmaniyah.id/api',
            description: 'Server produksi'
          }
        ],
        tags: [
          { name: 'Health', description: 'Health check dan monitoring sistem' },
          { name: 'Auth', description: 'Operasi otentikasi dan otorisasi' },
          { name: 'Students', description: 'Operasi data siswa' },
          { name: 'Teachers', description: 'Operasi data guru' },
          { name: 'Payments', description: 'Operasi pembayaran dan transaksi' },
          { name: 'Attendance', description: 'Operasi kehadiran siswa' },
          { name: 'TeacherAttendance', description: 'Operasi kehadiran guru' },
          { name: 'Academic', description: 'Operasi tahun akademik' },
          { name: 'Class', description: 'Operasi kelas' },
          { name: 'Major', description: 'Operasi jurusan' },
          { name: 'Subjects', description: 'Operasi mata pelajaran' },
          { name: 'Schedules', description: 'Operasi jadwal pelajaran' },
          { name: 'Violations', description: 'Operasi pelanggaran siswa' },
          { name: 'Tahfidz', description: 'Operasi program tahfidz' },
          { name: 'Admin', description: 'Operasi administrasi sistem' }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Masukkan token JWT yang didapat dari endpoint login'
            },
            apiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
              description: 'API Key untuk akses eksternal'
            }
          },
          schemas: {
            Error: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Pesan error yang deskriptif',
                  example: 'Failed to fetch data'
                }
              }
            },
            HealthResponse: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['healthy', 'unhealthy'],
                  example: 'healthy'
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: '2026-06-08T08:23:45.419Z'
                },
                uptime: {
                  type: 'number',
                  description: 'Waktu uptime server dalam detik',
                  example: 3600.5
                },
                environment: {
                  type: 'string',
                  example: 'production'
                },
                version: {
                  type: 'string',
                  example: '1.0.0'
                }
              }
            },
            Student: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123abc' },
                name: { type: 'string', example: 'Ahmad Fauzi' },
                nisn: { type: 'string', example: '0012345678' },
                email: { type: 'string', format: 'email', example: 'ahmad.fauzi@student.com' },
                nik: { type: 'string', example: '3201012345670001' },
                birthPlace: { type: 'string', example: 'Jakarta' },
                birthDate: { type: 'string', format: 'date-time' },
                gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
                address: { type: 'string', example: 'Jl. Raya No. 123' },
                parentPhone: { type: 'string', example: '081234567890' },
                status: { type: 'string', enum: ['active', 'inactive', 'graduated'], example: 'active' },
                classId: { type: 'string', example: 'clxxx123class' },
                majorId: { type: 'string', example: 'clxxx123major' },
                academicYearId: { type: 'string', example: 'clxxx123year' },
                roleId: { type: 'string', example: 'clxxx123role' },
                enrollmentDate: { type: 'string', format: 'date-time' },
                graduationDate: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
                role: { $ref: '#/components/schemas/Role' },
                class: { $ref: '#/components/schemas/Class' },
                major: { $ref: '#/components/schemas/Major' },
                academicYear: { $ref: '#/components/schemas/AcademicYear' }
              }
            },
            Payment: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123pay' },
                studentId: { type: 'string', example: 'clxxx123student' },
                amount: { type: 'number', format: 'decimal', example: 500000 },
                paymentDate: { type: 'string', format: 'date-time' },
                dueDate: { type: 'string', format: 'date-time', nullable: true },
                status: { type: 'string', enum: ['pending', 'paid', 'overdue'], example: 'paid' },
                receiptNumber: { type: 'string', example: 'PAY-2026-001234' },
                accountBankId: { type: 'string', example: 'clxxx123bank' },
                bankRef: { type: 'string', nullable: true, example: 'REF123456' },
                majorId: { type: 'string', example: 'clxxx123major' },
                month: { type: 'string', example: '2026-01' },
                bendaharaId: { type: 'string', example: 'clxxx123bendahara' },
                notes: { type: 'string', nullable: true, example: 'Pembayaran SPP Januari' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            Role: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123role' },
                name: { type: 'string', example: 'Student' },
                description: { type: 'string', nullable: true }
              }
            },
            Class: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123class' },
                name: { type: 'string', example: 'X RPL 1' },
                majorId: { type: 'string', example: 'clxxx123major' },
                academicYearId: { type: 'string', example: 'clxxx123year' }
              }
            },
            Major: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123major' },
                name: { type: 'string', example: 'Rekayasa Perangkat Lunak' },
                code: { type: 'string', example: 'RPL' }
              }
            },
            AcademicYear: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'clxxx123year' },
                name: { type: 'string', example: '2025/2026' },
                startDate: { type: 'string', format: 'date-time' },
                endDate: { type: 'string', format: 'date-time' },
                isActive: { type: 'boolean', example: true }
              }
            }
          },
          responses: {
            UnauthorizedError: {
              description: 'Token akses tidak valid atau tidak ada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'Unauthorized: Token tidak valid' }
                }
              }
            },
            ForbiddenError: {
              description: 'Akses ditolak, pengguna tidak memiliki izin',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'Forbidden: Anda tidak memiliki izin' }
                }
              }
            },
            NotFoundError: {
              description: 'Sumber daya tidak ditemukan',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'Sumber daya tidak ditemukan' }
                }
              }
            },
            ValidationError: {
              description: 'Validasi input gagal',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'Validation failed: Name is required' }
                }
              }
            },
            ServerError: {
              description: 'Kesalahan server internal',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                  example: { error: 'Internal server error' }
                }
              }
            }
          }
        },
        security: [{ bearerAuth: [] }]
      },
      apis: [
        './app/(backend)/api/**/*.ts',
        './app/(backend)/api/**/*.js'
      ]
    };

    const openapiSpec = swaggerJsdoc(swaggerOptions) as Record<string, unknown>;

    // Merge manual paths dengan paths yang di-generate dari JSDoc
    openapiSpec.paths = {
      ...(openapiSpec.paths as Record<string, unknown>),
      ...swaggerPaths
    };

    return NextResponse.json(openapiSpec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
