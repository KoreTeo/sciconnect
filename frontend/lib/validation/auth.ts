import { z } from 'zod';
import { emptyToUndefined, optionalText, orcidField, password, required, countryField, strongPassword } from './shared';

export const loginSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
  password: required('Пароль'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Введите корректный email'),
});

export const resetPasswordSchema = z.object({
  password: strongPassword,
});

export const registerSchema = z.object({
  full_name: required('ФИО'),
  email: z.string().trim().email('Введите корректный email'),
  password,
  affiliation: required('Организация'),
  position: optionalText,
  orcid: orcidField,
  phone: optionalText,
  country: countryField,
});

export const organizerRegisterSchema = z.object({
  full_name: required('ФИО контактного лица'),
  email: z.string().trim().email('Введите корректный email'),
  password: strongPassword,
  organization: required('Организация'),
  phone: required('Телефон'),
  position: optionalText,
  website: optionalText.refine((value) => !value || /^https?:\/\//i.test(value), {
    message: 'Укажите URL с http:// или https://',
  }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type OrganizerRegisterFormValues = z.infer<typeof organizerRegisterSchema>;

export function toRegisterPayload(values: RegisterFormValues) {
  return {
    email: values.email,
    password: values.password,
    full_name: values.full_name,
    affiliation: values.affiliation,
    orcid: emptyToUndefined(values.orcid),
    phone: emptyToUndefined(values.phone),
    position: emptyToUndefined(values.position),
    country: values.country ? values.country.toUpperCase() : undefined,
  };
}

export function toOrganizerRegisterPayload(values: OrganizerRegisterFormValues) {
  return {
    email: values.email,
    password: values.password,
    full_name: values.full_name,
    organization: values.organization,
    phone: values.phone,
    website: emptyToUndefined(values.website),
    position: emptyToUndefined(values.position),
  };
}
