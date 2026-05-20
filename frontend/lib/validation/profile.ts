import { z } from 'zod';
import { orcidField, optionalText, password, required, countryField } from './shared';

export const profileSchema = z.object({
  full_name: required('ФИО'),
  affiliation: optionalText,
  position: optionalText,
  orcid: orcidField,
  phone: optionalText,
  country: countryField,
});

export const passwordSchema = z.object({
  current_password: required('Текущий пароль'),
  new_password: password,
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type PasswordFormValues = z.infer<typeof passwordSchema>;
