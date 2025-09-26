import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, schools } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    // Получаем всех пользователей с информацией о школе
    const allUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        teacherId: users.teacherId,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        school: {
          id: schools.id,
          name: schools.name,
        }
      })
      .from(users)
      .leftJoin(schools, eq(users.schoolId, schools.id));

    // Группируем по ролям для статистики
    const usersByRole = allUsers.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = 0;
      acc[user.role]++;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        users: allUsers,
        totalUsers: allUsers.length,
        usersByRole,
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, teacherId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Обновляем связь ученика с учителем
    await db
      .update(users)
      .set({ teacherId: teacherId || null })
      .where(eq(users.id, userId));

    return NextResponse.json({
      success: true,
      message: 'Student-teacher relationship updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}