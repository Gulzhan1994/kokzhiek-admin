import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const schoolId = resolvedParams.id;

    // Получаем всех пользователей школы
    const schoolUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        teacherId: users.teacherId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.schoolId, schoolId));

    // Группируем пользователей по ролям
    const teachers = schoolUsers.filter(user => user.role === 'teacher');
    const students = schoolUsers.filter(user => user.role === 'student');

    // Создаем иерархию: учитель -> его ученики
    const teachersWithStudents = teachers.map(teacher => ({
      ...teacher,
      students: students.filter(student => student.teacherId === teacher.id)
    }));

    // Ученики без назначенного учителя
    const studentsWithoutTeacher = students.filter(student => !student.teacherId);

    return NextResponse.json({
      success: true,
      data: {
        teachers: teachersWithStudents,
        studentsWithoutTeacher,
        totalTeachers: teachers.length,
        totalStudents: students.length,
      }
    });
  } catch (error) {
    console.error('Error fetching school users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch school users' },
      { status: 500 }
    );
  }
}