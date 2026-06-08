import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health Check Endpoint
 *     description: Memeriksa kesehatan sistem dan koneksi database. Endpoint ini digunakan untuk monitoring dan Docker health checks.
 *     responses:
 *       200:
 *         description: Sistem sehat dan siap melayani
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                   description: Status kesehatan sistem
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-06-08T08:28:42.016Z"
 *                   description: Waktu check dilakukan
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                   description: Waktu uptime server dalam detik
 *                 environment:
 *                   type: string
 *                   example: production
 *                   description: Environment yang sedang berjalan
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                   description: Versi API
 *       500:
 *         description: Sistem tidak sehat atau database tidak dapat diakses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: unhealthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   example: "Connection refused"
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

