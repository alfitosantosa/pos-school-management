import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@/prisma/generated/client";
import { admin } from "better-auth/plugins";
import { PrismaPg } from "@prisma/adapter-pg";
import { openAPI } from "better-auth/plugins";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 30 * 60,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  plugins: [
    nextCookies(),
    openAPI(),
    admin({
      // Optional: configure admin settings
      defaultRole: "user",
      adminRole: "admin",
      teacherRole: "teacher",
      studentRole: "student",
      parentRole: "parent",
    }),
  ],
});
