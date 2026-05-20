import type { SiteSettings } from './types';
import { consolidatePublicSiteNav, newBlockId, normalizePages } from './siteUtils';

/** Шаблон академического сайта конференции (страницы + блоки). */
export function buildConferenceSiteTemplate(conf: {
  id?: number;
  title: string;
  description?: string;
  location?: string;
  contact_email?: string;
}): SiteSettings {
  const homeId = newBlockId();
  const invitationText = `<p>Приглашаем исследователей представить оригинальные работы на конференцию <strong>${conf.title}</strong>.</p><p>Тематики включают актуальные направления в области компьютерных наук и информационных технологий.</p>`;

  const pages = [
    {
      id: homeId,
      slug: '',
      title: 'Главная',
      show_in_nav: true,
      is_home: true,
      blocks: [
        { id: newBlockId(), type: 'image', title: 'О конференции', content: '' },
        { id: newBlockId(), type: 'deadlines', title: 'Ключевые даты' },
        { id: newBlockId(), type: 'text', title: 'Приглашение', content: invitationText },
        { id: newBlockId(), type: 'topics', title: 'Тематики' },
        {
          id: newBlockId(),
          type: 'sponsors',
          title: 'Партнёры и спонсоры',
          content: 'МГУ\nРФФИ\nТехнопарк',
        },
        {
          id: newBlockId(),
          type: 'contact',
          title: 'Контакты',
          content: conf.contact_email
            ? `<p>По вопросам участия: <a href="mailto:${conf.contact_email}">${conf.contact_email}</a></p>`
            : '<p>Контактный email укажите в настройках сайта.</p>',
        },
        {
          id: newBlockId(),
          type: 'cta',
          title: 'Подать статью',
          content: conf.id ? `/submit-paper?conferenceId=${conf.id}` : '',
        },
      ],
    },
    {
      id: newBlockId(),
      slug: 'invitation',
      title: 'Приглашение',
      show_in_nav: false,
      blocks: [
        {
          id: newBlockId(),
          type: 'text',
          title: 'Приглашение к участию',
          content: invitationText,
        },
        { id: newBlockId(), type: 'image', title: 'Фото конференции', content: '' },
        { id: newBlockId(), type: 'topics', title: 'Тематики' },
      ],
    },
    {
      id: newBlockId(),
      slug: 'committee',
      title: 'Комитет',
      show_in_nav: false,
      blocks: [
        {
          id: newBlockId(),
          type: 'committee',
          title: 'Программный комитет',
          content: 'Председатель — проф. Иванов И.И.\nЧлен комитета — д-р Петров П.П.\nЧлен комитета — д-р Сидорова А.А.',
        },
      ],
    },
    {
      id: newBlockId(),
      slug: 'program',
      title: 'Программа',
      show_in_nav: true,
      blocks: [{ id: newBlockId(), type: 'program', title: 'Программа конференции' }],
    },
    {
      id: newBlockId(),
      slug: 'venue',
      title: 'Место проведения',
      show_in_nav: false,
      blocks: [
        { id: newBlockId(), type: 'image', title: 'Фото площадки', content: '' },
        {
          id: newBlockId(),
          type: 'venue',
          title: 'Место проведения',
          content: conf.location
            ? `<p>Конференция пройдёт по адресу: <strong>${conf.location}</strong>.</p>`
            : '<p>Адрес будет объявлен дополнительно.</p>',
          items: [{ url: 'https://yandex.ru/maps/' }],
        },
      ],
    },
    {
      id: newBlockId(),
      slug: 'proceedings',
      title: 'Сборники',
      show_in_nav: true,
      blocks: [
        {
          id: newBlockId(),
          type: 'proceedings',
          title: 'Архив материалов',
          items: [
            { id: newBlockId(), year: 2025, title: 'Материалы ICCS 2025' },
            { id: newBlockId(), year: 2024, title: 'Материалы ICCS 2024' },
          ],
        },
      ],
    },
    {
      id: newBlockId(),
      slug: 'gallery',
      title: 'Галерея',
      show_in_nav: true,
      blocks: [{ id: newBlockId(), type: 'gallery', title: 'Фотогалерея', items: [] }],
    },
    {
      id: newBlockId(),
      slug: 'partners',
      title: 'Партнёры',
      show_in_nav: false,
      blocks: [
        {
          id: newBlockId(),
          type: 'sponsors',
          title: 'Партнёры и спонсоры',
          content: 'МГУ\nРФФИ\nТехнопарк',
        },
      ],
    },
    {
      id: newBlockId(),
      slug: 'contacts',
      title: 'Контакты',
      show_in_nav: false,
      blocks: [
        {
          id: newBlockId(),
          type: 'contact',
          title: 'Контакты',
          content: conf.contact_email
            ? `<p>По вопросам участия: <a href="mailto:${conf.contact_email}">${conf.contact_email}</a></p>`
            : '<p>Контактный email укажите в настройках сайта.</p>',
        },
      ],
    },
  ];

  return consolidatePublicSiteNav(
    normalizePages({
      hero_title: conf.title,
      hero_subtitle: conf.description?.slice(0, 160) || '',
      accent_color: '#2563eb',
      show_program: true,
      show_topics: true,
      show_deadlines: true,
      show_cfp: false,
      contact_email: conf.contact_email,
      pages,
      home_page_id: homeId,
    })
  );
}

/** Демо-данные для seed ICCS 2026 (JSON-совместимый объект). */
export function iccs2026SeedTheme(): Record<string, unknown> {
  const theme = buildConferenceSiteTemplate({
    title: 'ICCS 2026',
    description: 'Международная конференция по компьютерным наукам',
    location: 'Москва, МГУ',
    contact_email: 'organizer@sciconnect.demo',
  });
  return {
    ...theme,
    hero_title: 'ICCS 2026',
    hero_subtitle: 'Международная конференция по компьютерным наукам',
    cfp_text:
      'Принимаются оригинальные статьи на русском и английском языках. Объём — до 8 страниц.',
  };
}
