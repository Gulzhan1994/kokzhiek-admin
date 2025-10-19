import { useState, useEffect } from 'react';

// Translation dictionary
const translations = {
  // Books page translations
  'books.title': {
    kk: 'Кітаптарды өзгерту тарихы',
    ru: 'История изменений книг'
  },
  'books.subtitle': {
    kk: 'Жүйедегі барлық кітаптарды өңдеу тарихымен қарау',
    ru: 'Просмотр всех книг в системе с историей редактирования'
  },
  'books.table.book': {
    kk: 'Кітап',
    ru: 'Книга'
  },
  'books.table.user': {
    kk: 'Пайдаланушы',
    ru: 'Пользователь'
  },
  'books.table.datetime': {
    kk: 'Күн/Уақыт',
    ru: 'Дата/Время'
  },
  'books.table.description': {
    kk: 'Сипаттама',
    ru: 'Описание'
  },
  'books.search': {
    kk: 'Атауы немесе авторы бойынша іздеу...',
    ru: 'Поиск по названию или автору...'
  },
  'books.back': {
    kk: '← Артқа',
    ru: '← Назад'
  },
  'books.loading': {
    kk: 'Жүктелуде...',
    ru: 'Загрузка...'
  },
  'books.noBooks': {
    kk: 'Кітаптар әлі жоқ',
    ru: 'Книг пока нет'
  },
  'books.notFound': {
    kk: 'Кітаптар табылмады',
    ru: 'Книги не найдены'
  },
  'books.totalBooks': {
    kk: 'Барлық кітаптар',
    ru: 'Всего книг'
  },
  'books.currentPage': {
    kk: 'Ағымдағы бет',
    ru: 'Текущая страница'
  },
  'books.shown': {
    kk: 'Көрсетілген',
    ru: 'Показано'
  },
  'books.show': {
    kk: 'Көрсету:',
    ru: 'Показать:'
  },
  'books.searchButton': {
    kk: 'Іздеу',
    ru: 'Поиск'
  },
  'books.reset': {
    kk: 'Тазалау',
    ru: 'Сбросить'
  },
  'books.previous': {
    kk: '← Алдыңғы',
    ru: '← Предыдущая'
  },
  'books.next': {
    kk: 'Келесі →',
    ru: 'Следующая →'
  },
  'books.of': {
    kk: 'ішінен',
    ru: 'из'
  },
  'books.details.title': {
    kk: 'Кітап мәліметтері',
    ru: 'Детали книги'
  },
  'books.details.mainInfo': {
    kk: 'Негізгі ақпарат',
    ru: 'Основная информация'
  },
  'books.details.name': {
    kk: 'Атауы:',
    ru: 'Название:'
  },
  'books.details.author': {
    kk: 'Автор:',
    ru: 'Автор:'
  },
  'books.details.class': {
    kk: 'Сынып:',
    ru: 'Класс:'
  },
  'books.details.chapters': {
    kk: 'Тараулар саны:',
    ru: 'Количество глав:'
  },
  'books.details.user': {
    kk: 'Пайдаланушы',
    ru: 'Пользователь'
  },
  'books.details.userId': {
    kk: 'Пайдаланушы ID:',
    ru: 'ID пользователя:'
  },
  'books.details.userEmail': {
    kk: 'Пайдаланушы email:',
    ru: 'Email пользователя:'
  },
  'books.details.dates': {
    kk: 'Күндер',
    ru: 'Даты'
  },
  'books.details.created': {
    kk: 'Құрылған:',
    ru: 'Создана:'
  },
  'books.details.lastEdit': {
    kk: 'Соңғы өзгерту:',
    ru: 'Последнее изменение:'
  },
  'books.details.editHistory': {
    kk: 'Өңдеу тарихы',
    ru: 'История редактирования'
  },
  'books.details.description': {
    kk: 'Сипаттама:',
    ru: 'Описание:'
  },
  'books.details.editorId': {
    kk: 'Редактор ID:',
    ru: 'ID редактора:'
  },
  'books.details.editorEmail': {
    kk: 'Редактор email:',
    ru: 'Email редактора:'
  },
  'books.details.close': {
    kk: 'Жабу',
    ru: 'Закрыть'
  }
};

/**
 * Hook to get translations based on current language
 */
export function useLanguage() {
  const [language, setLanguage] = useState<'kk' | 'ru'>('ru');

  useEffect(() => {
    // Get language from localStorage or default to 'ru'
    const savedLanguage = localStorage.getItem('language') as 'kk' | 'ru' | null;
    if (savedLanguage && (savedLanguage === 'kk' || savedLanguage === 'ru')) {
      setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('kk')) {
        setLanguage('kk');
      } else {
        setLanguage('ru');
      }
    }
  }, []);

  /**
   * Change language and save to localStorage
   */
  const changeLanguage = (newLanguage: 'kk' | 'ru') => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  /**
   * Get translation for a key with optional parameters
   */
  const t = (key: keyof typeof translations, params?: Record<string, any>): string => {
    const translation = translations[key];
    if (!translation) {
      return key;
    }
    let text = translation[language] || translation.ru || key;

    // Replace template variables like {{name}} with actual values
    if (params) {
      Object.keys(params).forEach(param => {
        const regex = new RegExp(`{{${param}}}`, 'g');
        text = text.replace(regex, String(params[param]));
      });
    }

    return text;
  };

  /**
   * Get current language
   */
  const currentLanguage = language;

  /**
   * Check if current language is Kazakh
   */
  const isKazakh = language === 'kk';

  /**
   * Check if current language is Russian
   */
  const isRussian = language === 'ru';

  return {
    t,
    language: currentLanguage,
    changeLanguage,
    isKazakh,
    isRussian,
    translations
  };
}

export default useLanguage;
