import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { schools, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    // Получаем все школы с информацией об админе
    const schoolsWithAdmin = await db
      .select({
        id: schools.id,
        name: schools.name,
        description: schools.description,
        address: schools.address,
        isActive: schools.isActive,
        createdAt: schools.createdAt,
        admin: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(schools)
      .leftJoin(users, eq(schools.adminId, users.id));

    // Для каждой школы получаем количество учителей и учеников
    const schoolsWithCounts = await Promise.all(
      schoolsWithAdmin.map(async (school) => {
        const teachersCount = await db
          .select({ count: users.id })
          .from(users)
          .where(and(
            eq(users.schoolId, school.id),
            eq(users.role, 'teacher')
          ));

        const studentsCount = await db
          .select({ count: users.id })
          .from(users)
          .where(and(
            eq(users.schoolId, school.id),
            eq(users.role, 'student')
          ));

        return {
          ...school,
          teachersCount: teachersCount.length,
          studentsCount: studentsCount.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: schoolsWithCounts
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}