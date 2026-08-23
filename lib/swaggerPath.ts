/**
 * File ini berisi path definitions untuk OpenAPI spec
 * Digunakan untuk mendefinisikan endpoints yang tidak memiliki JSDoc annotations
 */

export const swaggerPaths = {
  '/students': {
    get: {
      tags: ['Students'],
      summary: 'Dapatkan daftar semua siswa',
      description: 'Mengambil daftar lengkap siswa beserta data kelas, jurusan, dan tahun akademik',
      responses: {
        200: {
          description: 'Daftar siswa berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Student' }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    },
    post: {
      tags: ['Students'],
      summary: 'Tambah siswa baru',
      description: 'Membuat data siswa baru dalam sistem',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'roleId'],
              properties: {
                name: { type: 'string', example: 'Ahmad Fauzi' },
                email: { type: 'string', format: 'email', example: 'ahmad@student.com' },
                roleId: { type: 'string', example: 'clxxx123role' },
                nisn: { type: 'string', example: '0012345678' },
                nik: { type: 'string', example: '3201012345670001' },
                birthPlace: { type: 'string', example: 'Jakarta' },
                birthDate: { type: 'string', format: 'date-time' },
                gender: { type: 'string', enum: ['male', 'female'], example: 'male' },
                address: { type: 'string', example: 'Jl. Raya No. 123' },
                classId: { type: 'string', example: 'clxxx123class' },
                majorId: { type: 'string', example: 'clxxx123major' },
                academicYearId: { type: 'string', example: 'clxxx123year' },
                parentPhone: { type: 'string', example: '081234567890' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Siswa berhasil dibuat',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Student' }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    },
    put: {
      tags: ['Students'],
      summary: 'Update data siswa',
      description: 'Memperbarui informasi siswa yang sudah ada',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'name', 'roleId'],
              properties: {
                id: { type: 'string', example: 'clxxx123abc' },
                name: { type: 'string', example: 'Ahmad Fauzi' },
                email: { type: 'string', format: 'email' },
                roleId: { type: 'string' },
                nisn: { type: 'string' },
                classId: { type: 'string' },
                majorId: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Siswa berhasil diupdate',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Student' }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    },
    delete: {
      tags: ['Students'],
      summary: 'Hapus siswa',
      description: 'Menghapus data siswa dari sistem',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { type: 'string', example: 'clxxx123abc' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Siswa berhasil dihapus',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Student' }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        404: {
          $ref: '#/components/responses/NotFoundError'
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/payment': {
    get: {
      tags: ['Payments'],
      summary: 'Dapatkan daftar pembayaran',
      description: 'Mengambil daftar lengkap pembayaran beserta data siswa, jurusan, dan bank',
      responses: {
        200: {
          description: 'Daftar pembayaran berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Payment' }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    },
    post: {
      tags: ['Payments'],
      summary: 'Buat pembayaran baru',
      description: 'Membuat transaksi pembayaran baru',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['studentId', 'amount', 'paymentDate', 'receiptNumber', 'accountBankId', 'majorId', 'month', 'bendaharaId'],
              properties: {
                studentId: { type: 'string', example: 'clxxx123student' },
                amount: { type: 'number', example: 500000 },
                paymentDate: { type: 'string', format: 'date-time' },
                dueDate: { type: 'string', format: 'date-time', nullable: true },
                status: { type: 'string', enum: ['pending', 'paid', 'overdue'], example: 'paid' },
                receiptNumber: { type: 'string', example: 'PAY-2026-001234' },
                accountBankId: { type: 'string', example: 'clxxx123bank' },
                bankRef: { type: 'string', nullable: true, example: 'REF123456' },
                majorId: { type: 'string', example: 'clxxx123major' },
                month: { type: 'string', example: '2026-01' },
                bendaharaId: { type: 'string', example: 'clxxx123bendahara' },
                notes: { type: 'string', nullable: true, example: 'Pembayaran SPP Januari' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Pembayaran berhasil dibuat',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Payment' }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/attendance': {
    get: {
      tags: ['Attendance'],
      summary: 'Dapatkan data kehadiran siswa',
      description: 'Mengambil daftar kehadiran siswa',
      responses: {
        200: {
          description: 'Data kehadiran berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    studentId: { type: 'string' },
                    date: { type: 'string', format: 'date-time' },
                    status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
                    notes: { type: 'string', nullable: true }
                  }
                }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/academicyear': {
    get: {
      tags: ['Academic'],
      summary: 'Dapatkan daftar tahun akademik',
      description: 'Mengambil daftar tahun akademik yang tersedia',
      responses: {
        200: {
          description: 'Daftar tahun akademik berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/AcademicYear' }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/class': {
    get: {
      tags: ['Class'],
      summary: 'Dapatkan daftar kelas',
      description: 'Mengambil daftar kelas yang tersedia',
      responses: {
        200: {
          description: 'Daftar kelas berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Class' }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/major': {
    get: {
      tags: ['Major'],
      summary: 'Dapatkan daftar jurusan',
      description: 'Mengambil daftar jurusan yang tersedia',
      responses: {
        200: {
          description: 'Daftar jurusan berhasil diambil',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: { $ref: '#/components/schemas/Major' }
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  }
};
