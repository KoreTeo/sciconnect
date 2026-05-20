export interface CountryOption {
  code: string;
  nameRu: string;
  nameEn: string;
}

/** ISO 3166-1 alpha-2 — common countries for conference registration. */
export const COUNTRIES: CountryOption[] = [
  { code: 'RU', nameRu: 'Россия', nameEn: 'Russia' },
  { code: 'BY', nameRu: 'Беларусь', nameEn: 'Belarus' },
  { code: 'KZ', nameRu: 'Казахстан', nameEn: 'Kazakhstan' },
  { code: 'UA', nameRu: 'Украина', nameEn: 'Ukraine' },
  { code: 'UZ', nameRu: 'Узбекистан', nameEn: 'Uzbekistan' },
  { code: 'AM', nameRu: 'Армения', nameEn: 'Armenia' },
  { code: 'AZ', nameRu: 'Азербайджан', nameEn: 'Azerbaijan' },
  { code: 'GE', nameRu: 'Грузия', nameEn: 'Georgia' },
  { code: 'KG', nameRu: 'Киргизия', nameEn: 'Kyrgyzstan' },
  { code: 'MD', nameRu: 'Молдова', nameEn: 'Moldova' },
  { code: 'TJ', nameRu: 'Таджикистан', nameEn: 'Tajikistan' },
  { code: 'TM', nameRu: 'Туркменистан', nameEn: 'Turkmenistan' },
  { code: 'DE', nameRu: 'Германия', nameEn: 'Germany' },
  { code: 'FR', nameRu: 'Франция', nameEn: 'France' },
  { code: 'GB', nameRu: 'Великобритания', nameEn: 'United Kingdom' },
  { code: 'US', nameRu: 'США', nameEn: 'United States' },
  { code: 'CN', nameRu: 'Китай', nameEn: 'China' },
  { code: 'IN', nameRu: 'Индия', nameEn: 'India' },
  { code: 'JP', nameRu: 'Япония', nameEn: 'Japan' },
  { code: 'KR', nameRu: 'Республика Корея', nameEn: 'South Korea' },
  { code: 'IT', nameRu: 'Италия', nameEn: 'Italy' },
  { code: 'ES', nameRu: 'Испания', nameEn: 'Spain' },
  { code: 'PL', nameRu: 'Польша', nameEn: 'Poland' },
  { code: 'CZ', nameRu: 'Чехия', nameEn: 'Czechia' },
  { code: 'AT', nameRu: 'Австрия', nameEn: 'Austria' },
  { code: 'CH', nameRu: 'Швейцария', nameEn: 'Switzerland' },
  { code: 'NL', nameRu: 'Нидерланды', nameEn: 'Netherlands' },
  { code: 'BE', nameRu: 'Бельгия', nameEn: 'Belgium' },
  { code: 'SE', nameRu: 'Швеция', nameEn: 'Sweden' },
  { code: 'NO', nameRu: 'Норвегия', nameEn: 'Norway' },
  { code: 'FI', nameRu: 'Финляндия', nameEn: 'Finland' },
  { code: 'DK', nameRu: 'Дания', nameEn: 'Denmark' },
  { code: 'PT', nameRu: 'Португалия', nameEn: 'Portugal' },
  { code: 'GR', nameRu: 'Греция', nameEn: 'Greece' },
  { code: 'TR', nameRu: 'Турция', nameEn: 'Turkey' },
  { code: 'IL', nameRu: 'Израиль', nameEn: 'Israel' },
  { code: 'AE', nameRu: 'ОАЭ', nameEn: 'United Arab Emirates' },
  { code: 'SA', nameRu: 'Саудовская Аравия', nameEn: 'Saudi Arabia' },
  { code: 'EG', nameRu: 'Египет', nameEn: 'Egypt' },
  { code: 'ZA', nameRu: 'ЮАР', nameEn: 'South Africa' },
  { code: 'BR', nameRu: 'Бразилия', nameEn: 'Brazil' },
  { code: 'AR', nameRu: 'Аргентина', nameEn: 'Argentina' },
  { code: 'MX', nameRu: 'Мексика', nameEn: 'Mexico' },
  { code: 'CA', nameRu: 'Канада', nameEn: 'Canada' },
  { code: 'AU', nameRu: 'Австралия', nameEn: 'Australia' },
  { code: 'NZ', nameRu: 'Новая Зеландия', nameEn: 'New Zealand' },
  { code: 'SG', nameRu: 'Сингапур', nameEn: 'Singapore' },
  { code: 'MY', nameRu: 'Малайзия', nameEn: 'Malaysia' },
  { code: 'TH', nameRu: 'Таиланд', nameEn: 'Thailand' },
  { code: 'VN', nameRu: 'Вьетнам', nameEn: 'Vietnam' },
  { code: 'ID', nameRu: 'Индонезия', nameEn: 'Indonesia' },
  { code: 'PH', nameRu: 'Филиппины', nameEn: 'Philippines' },
];

export const COUNTRY_SELECT_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.nameRu} (${c.code})`,
}));

export function countryLabel(code?: string | null): string | undefined {
  if (!code) return undefined;
  const found = COUNTRIES.find((c) => c.code === code.toUpperCase());
  return found ? found.nameRu : code;
}
