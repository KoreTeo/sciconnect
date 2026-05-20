import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  IconFrame,
  IconOrganizer,
  IconPaperSubmit,
  IconParticipant,
  IconPublish,
  IconRegistration,
  IconReview,
  IconReviewerRole,
  IconSiteProgram,
} from '@/components/home/HomeIcons';

const STEPS = [
  { n: '1', title: 'Регистрация', desc: 'Создайте аккаунт участника или организатора', Icon: IconRegistration },
  { n: '2', title: 'Подача статей', desc: 'Загрузите PDF и отслеживайте статус рецензирования', Icon: IconPaperSubmit },
  { n: '3', title: 'Рецензирование', desc: 'Организатор назначает рецензентов, автор получает отзывы', Icon: IconReview },
  { n: '4', title: 'Публикация', desc: 'Программа и сайт конференции публикуются автоматически', Icon: IconPublish },
] as const;

const FEATURES = [
  {
    title: 'Подача статей',
    desc: 'Загрузка PDF, соавторы, треки и отслеживание статуса рецензирования',
    Icon: IconPaperSubmit,
  },
  {
    title: 'Рецензирование',
    desc: 'Назначение рецензентов, слепое рецензирование и декларации конфликта интересов',
    Icon: IconReview,
  },
  {
    title: 'Сайт и программа',
    desc: 'Публичный сайт конференции, программа мероприятий и сборники материалов',
    Icon: IconSiteProgram,
  },
] as const;

const AUDIENCES = [
  { title: 'Участникам', desc: 'Поиск конференций, подача работ, просмотр рецензий', href: '/register', Icon: IconParticipant },
  { title: 'Организаторам', desc: 'Создание мероприятия, назначение рецензентов, программа и сайт', href: '/login', Icon: IconOrganizer },
  { title: 'Рецензентам', desc: 'Список назначений, оценка статей по критериям', href: '/login', Icon: IconReviewerRole },
] as const;

export default function Home() {
  return (
    <>
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-white shadow-lg">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="mb-4 text-4xl font-bold">SciConnect</h1>
            <p className="mb-8 max-w-2xl text-lg text-brand-100">
              Единая платформа для организации научных конференций: подача статей, рецензирование,
              программа мероприятия и публикация сайта конференции.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/conferences">
                <Button className="!bg-white !text-brand-700 hover:!bg-brand-50">Каталог конференций</Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20">
                  Зарегистрироваться
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-xl">
            <Image
              src="/home/hero-illustration.png"
              alt="Платформа SciConnect: подача статей, рецензирование и программа конференции"
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Как это работает</h2>
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="section-card">
              <IconFrame className="mb-4 max-h-28">
                <s.Icon />
              </IconFrame>
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {s.n}
              </span>
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">Возможности платформы</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="section-card flex flex-col">
              <IconFrame className="mb-4">
                <f.Icon />
              </IconFrame>
              <h3 className="mb-2 font-semibold text-brand-700">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        {AUDIENCES.map((f) => (
          <article key={f.title} className="section-card flex flex-col">
            <IconFrame className="mb-4">
              <f.Icon />
            </IconFrame>
            <h3 className="mb-2 font-semibold text-brand-700">{f.title}</h3>
            <p className="mb-4 flex-1 text-sm text-slate-600">{f.desc}</p>
            <Link href={f.href} className="text-sm font-medium text-brand-600 hover:underline">
              Начать →
            </Link>
          </article>
        ))}
      </section>
    </>
  );
}
