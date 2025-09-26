'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ApiService from '@/lib/api';

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  teacherId: string | null;
  createdAt: string;
  isActive: boolean;
}

interface Teacher extends User {
  students: User[];
}

interface SchoolData {
  teachers: Teacher[];
  studentsWithoutTeacher: User[];
  totalTeachers: number;
  totalStudents: number;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const schoolId = params.id as string;
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTeachers, setExpandedTeachers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (schoolId) {
      fetchSchoolUsers();
    }
  }, [schoolId]);

  const fetchSchoolUsers = async () => {
    try {
      const result = await ApiService.getSchoolUsers(schoolId);
      if (result.success) {
        // Преобразуем плоский список пользователей в структуру с учителями и студентами
        const users = result.data;
        const teachers = users.filter((user: User) => user.role === 'teacher');
        const students = users.filter((user: User) => user.role === 'student');

        const teachersWithStudents = teachers.map((teacher: User) => ({
          ...teacher,
          students: students.filter((student: User) => student.teacherId === teacher.id),
        }));

        const studentsWithoutTeacher = students.filter((student: User) => !student.teacherId);

        setSchoolData({
          teachers: teachersWithStudents,
          studentsWithoutTeacher,
          totalTeachers: teachers.length,
          totalStudents: students.length,
        });
      } else {
        console.error('Error fetching school users:', result.error);
      }
    } catch (error) {
      console.error('Error fetching school users:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignStudentToTeacher = async (studentId: string, teacherId: string) => {
    try {
      const result = await ApiService.assignStudent(studentId, teacherId);
      if (result.success) {
        fetchSchoolUsers(); // Перезагружаем данные
      } else {
        alert('Ошибка при назначении ученика: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning student:', error);
      alert('Ошибка при назначении ученика');
    }
  };

  const unassignStudent = async (studentId: string) => {
    await assignStudentToTeacher(studentId, '');
  };

  const getUserName = (user: User) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const getUserStatusBadge = (user: User) => {
    if (!user.isActive) {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 ml-2">
          Неактивный
        </span>
      );
    }
    return null;
  };

  const toggleTeacherExpanded = (teacherId: string) => {
    const newExpanded = new Set(expandedTeachers);
    if (newExpanded.has(teacherId)) {
      newExpanded.delete(teacherId);
    } else {
      newExpanded.add(teacherId);
    }
    setExpandedTeachers(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!schoolData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-red-600">Данные школы не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Участники школы
            </h1>
            <p className="text-gray-600">
              Управление учителями и учениками школы
            </p>
          </div>
          <Link
            href="/schools"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            ← Назад к школам
          </Link>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Всего учителей</h3>
            <p className="text-3xl font-bold text-green-600">{schoolData.totalTeachers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Всего учеников</h3>
            <p className="text-3xl font-bold text-blue-600">{schoolData.totalStudents}</p>
          </div>
        </div>

        {/* Учителя и их ученики */}
        <div className="space-y-6">
          {schoolData.teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-lg shadow">
              <div
                className="px-6 py-4 border-b border-gray-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => toggleTeacherExpanded(teacher.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-500">
                      {expandedTeachers.has(teacher.id) ? (
                        <svg className="w-5 h-5 transform transition-transform" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 transform transition-transform" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        👨‍🏫 {getUserName(teacher)}
                        {getUserStatusBadge(teacher)}
                      </h3>
                      <p className="text-sm text-gray-600">{teacher.email}</p>
                      <p className="text-xs text-gray-500">
                        Зарегистрирован: {formatDate(teacher.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      Учеников: <span className="font-semibold">{teacher.students.length}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {expandedTeachers.has(teacher.id) ? 'Скрыть' : 'Показать'} список
                    </p>
                  </div>
                </div>
              </div>

              {/* Ученики учителя */}
              {expandedTeachers.has(teacher.id) && teacher.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ученик
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата регистрации
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teacher.students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              👨‍🎓 {getUserName(student)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.isActive ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Активный
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Неактивный
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(student.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => unassignStudent(student.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Отвязать от учителя"
                            >
                              Отвязать
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : expandedTeachers.has(teacher.id) ? (
                <div className="p-6 text-center text-gray-500">
                  У этого учителя пока нет учеников
                </div>
              ) : null}
            </div>
          ))}

          {/* Ученики без учителя */}
          {schoolData.studentsWithoutTeacher.length > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  📚 Ученики без назначенного учителя ({schoolData.studentsWithoutTeacher.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ученик
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата регистрации
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Назначить учителю
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {schoolData.studentsWithoutTeacher.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            👨‍🎓 {getUserName(student)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {student.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {student.isActive ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Активный
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Неактивный
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(student.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {schoolData.teachers.length > 0 ? (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  assignStudentToTeacher(student.id, e.target.value);
                                }
                              }}
                              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-blue-500 focus:border-blue-500"
                              defaultValue=""
                            >
                              <option value="">Выберите учителя</option>
                              {schoolData.teachers.map((teacher) => (
                                <option key={teacher.id} value={teacher.id}>
                                  {getUserName(teacher)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-400">Нет учителей</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Пустое состояние */}
          {schoolData.teachers.length === 0 && schoolData.studentsWithoutTeacher.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <p className="text-lg">В этой школе пока нет участников</p>
              <p className="text-sm mt-2">
                Участники появятся после регистрации по ключам для ролей &quot;teacher&quot; и &quot;student&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}