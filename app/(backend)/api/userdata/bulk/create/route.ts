import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function replaceUndefinedWithNull<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => replaceUndefinedWithNull(item)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val === undefined) {
        result[key] = null;
      } else if (Array.isArray(val) || (val !== null && typeof val === "object")) {
        result[key] = replaceUndefinedWithNull(val);
      } else {
        result[key] = val;
      }
    }
    return result as unknown as T;
  }
  return (value === undefined ? (null as unknown as T) : value) as T;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { users } = body;

    // Validate input
    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: "Users array is required and must not be empty" }, { status: 400 });
    }

    // Validate each user has required field (name)
    const invalidUsers = users.filter((user) => !user.name);
    if (invalidUsers.length > 0) {
      return NextResponse.json(
        {
          error: "All users must have a name",
          invalidCount: invalidUsers.length,
        },
        { status: 400 },
      );
    }

    // Process and clean data
    const cleanedUsers = users.map((user) => {
      // Create base user object
      const userData: any = {
        name: user.name,
        email: user.email || null,
        nik: user.nik || null,
        nisn: user.nisn || null,
        roleId: user.roleId || null,
        gender: user.gender || null,
        birthPlace: user.birthPlace || null,
        birthDate: user.birthDate || null,
        address: user.address || null,
        parentPhone: user.parentPhone || null,
        academicYearId: user.academicYearId || null,
        classId: user.classId || null,
        tahfidzGroupId: user.tahfidzGroupId || null,
        majorId: user.majorId || null,
        enrollmentDate: user.enrollmentDate || null,
        graduationDate: user.graduationDate || null,
        employeeId: user.employeeId || null,
        position: user.position || null,
        startDate: user.startDate || null,
        endDate: user.endDate || null,
        status: user.status || "active",
        isActive: user.isActive || true,
        relation: user.relation || null,
        avatarUrl: user.avatarUrl || null,
        studentIds: user.studentIds || [],
      };

      return replaceUndefinedWithNull(userData);
    });

    // Validate foreign keys exist before bulk create
    const roleIds = cleanedUsers.map((u) => u.roleId).filter((id): id is string => id !== null);

    const academicYearIds = cleanedUsers.map((u) => u.academicYearId).filter((id): id is string => id !== null);

    const classIds = cleanedUsers.map((u) => u.classId).filter((id): id is string => id !== null);

    const tahfidzGroupIds = cleanedUsers.map((u) => u.tahfidzGroupId).filter((id): id is string => id !== null);

    const majorIds = cleanedUsers.map((u) => u.majorId).filter((id): id is string => id !== null);

    // Check if referenced records exist
    const [roles, academicYears, classes, majors, tahfidzGroups] = await Promise.all([
      roleIds.length > 0
        ? prisma.role.findMany({
            where: { id: { in: roleIds } },
            select: { id: true },
          })
        : [],
      academicYearIds.length > 0
        ? prisma.academicYear.findMany({
            where: { id: { in: academicYearIds } },
            select: { id: true },
          })
        : [],
      classIds.length > 0
        ? prisma.class.findMany({
            where: { id: { in: classIds } },
            select: { id: true },
          })
        : [],
      tahfidzGroupIds.length > 0
        ? prisma.tahfidzGroup.findMany({
            where: { id: { in: tahfidzGroupIds } },
            select: { id: true },
          })
        : [],
      majorIds.length > 0
        ? prisma.major.findMany({
            where: { id: { in: majorIds } },
            select: { id: true },
          })
        : [],
    ]);

    // Check for invalid references
    const foundRoleIds = new Set(roles.map((r) => r.id));
    const foundAcademicYearIds = new Set(academicYears.map((a) => a.id));
    const foundClassIds = new Set(classes.map((c) => c.id));
    const foundTahfidzGroupIds = new Set(tahfidzGroups.map((t) => t.id));
    const foundMajorIds = new Set(majors.map((m) => m.id));

    const invalidRoles = roleIds.filter((id) => !foundRoleIds.has(id));
    const invalidAcademicYears = academicYearIds.filter((id) => !foundAcademicYearIds.has(id));
    const invalidClasses = classIds.filter((id) => !foundClassIds.has(id));
    const invalidTahfidzGroups = tahfidzGroupIds.filter((id) => !foundTahfidzGroupIds.has(id));
    const invalidMajors = majorIds.filter((id) => !foundMajorIds.has(id));

    if (invalidRoles.length > 0 || invalidAcademicYears.length > 0 || invalidClasses.length > 0 || invalidTahfidzGroups.length > 0 || invalidMajors.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid foreign key references found",
          details: {
            invalidRoles: invalidRoles.length > 0 ? invalidRoles : undefined,
            invalidAcademicYears: invalidAcademicYears.length > 0 ? invalidAcademicYears : undefined,
            invalidClasses: invalidClasses.length > 0 ? invalidClasses : undefined,
            invalidTahfidzGroups: invalidTahfidzGroups.length > 0 ? invalidTahfidzGroups : undefined,
            invalidMajors: invalidMajors.length > 0 ? invalidMajors : undefined,
          },
        },
        { status: 400 },
      );
    }

    // Bulk create users
    const result = await prisma.userData.createMany({
      data: cleanedUsers,
      skipDuplicates: false, // Set to true if you want to skip duplicates
    });

    return NextResponse.json(
      {
        message: "Users created successfully",
        count: result.count,
        total: users.length,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating users:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          error: "Duplicate entry found",
          details: "Some users may already exist with the same unique fields (email, NIK, NISN, etc.)",
          field: error.meta?.target,
        },
        { status: 409 },
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error: "Foreign key constraint failed",
          details: "Invalid reference to role, class, major, or academic year",
          field: error.meta?.field_name,
        },
        { status: 400 },
      );
    }

    if (error.code === "P2000") {
      return NextResponse.json(
        {
          error: "Value too long for column",
          details: error.meta?.column_name,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create users",
        details: error.message,
        code: error.code,
      },
      { status: 500 },
    );
  }
}
