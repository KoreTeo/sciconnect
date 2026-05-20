'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { FormRequiredHint } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ROLE_LABELS } from '@/lib/types';
import { NotificationPreferencesTable } from '@/components/profile/NotificationPreferencesTable';
import { useProfileMutations } from '@/hooks/useProfileMutations';
import { useResendVerification } from '@/hooks/useResendVerification';
import { COUNTRY_SELECT_OPTIONS } from '@/lib/countries';

function ProfileContent() {
  const { user } = useAuth();
  const { profileForm, passwordForm, saveProfile, changePassword } = useProfileMutations();
  const { resend, message: verifyMessage, sending: verifySending } = useResendVerification();

  useEffect(() => {
    if (user) {
      profileForm.reset({
        full_name: user.full_name || '',
        affiliation: user.affiliation || '',
        orcid: user.orcid || '',
        phone: user.phone || '',
        position: user.position || '',
        country: user.country || '',
      });
    }
  }, [user, profileForm]);

  if (!user) return null;

  const orcidUrl = user.orcid ? `https://orcid.org/${user.orcid}` : null;
  const {
    register: profileField,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = profileForm;
  const {
    register: passwordField,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = passwordForm;

  return (
    <>
      <PageHeader title="Профиль" description={user.email} breadcrumbs={[{ label: 'Кабинет', href: '/dashboard' }, { label: 'Профиль' }]} />
      <Card className="mb-6">
        <h2 className="mb-2 font-semibold">Email</h2>
        {user.email_verified ? (
          <p className="text-sm text-green-700">Email подтверждён</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-amber-800">
              Email не подтверждён. Подтвердите почту, чтобы подавать статьи и регистрироваться на конференции.
            </p>
            <Button type="button" variant="secondary" disabled={verifySending} onClick={resend}>
              {verifySending ? 'Отправка...' : 'Отправить письмо снова'}
            </Button>
            {verifyMessage && <p className="text-sm text-slate-600">{verifyMessage}</p>}
          </div>
        )}
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Личные данные</h2>
          <form onSubmit={handleProfileSubmit(saveProfile)} className="space-y-4">
            <FormRequiredHint />
            <FormInput name="full_name" label="ФИО" required register={profileField} errors={profileErrors} />
            <FormInput name="affiliation" label="Организация" register={profileField} errors={profileErrors} />
            <FormSelect name="country" label="Страна" register={profileField} errors={profileErrors}>
              <option value="">Не указана</option>
              {COUNTRY_SELECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
            <FormInput name="position" label="Должность" register={profileField} errors={profileErrors} />
            <FormInput
              name="orcid"
              label="ORCID"
              hint="Формат: 0000-0002-1825-0097"
              register={profileField}
              errors={profileErrors}
            />
            {orcidUrl && (
              <p className="text-sm">
                <a href={orcidUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  Профиль ORCID →
                </a>
              </p>
            )}
            <FormInput name="phone" label="Телефон" register={profileField} errors={profileErrors} />
            {profileErrors.root?.message && <p className="text-sm text-red-600">{profileErrors.root.message}</p>}
            <p className="text-sm text-slate-500">Роль: {ROLE_LABELS[user.role] || user.role}</p>
            <Button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Смена пароля</h2>
          <form onSubmit={handlePasswordSubmit(changePassword)} className="space-y-4">
            <FormInput name="current_password" label="Текущий пароль" type="password" register={passwordField} errors={passwordErrors} />
            <FormInput name="new_password" label="Новый пароль" type="password" register={passwordField} errors={passwordErrors} />
            {passwordErrors.root?.message && <p className="text-sm text-red-600">{passwordErrors.root.message}</p>}
            <Button type="submit" variant="secondary" disabled={passwordSubmitting}>
              {passwordSubmitting ? 'Сохранение...' : 'Изменить пароль'}
            </Button>
          </form>
        </Card>
      </div>
      <NotificationPreferencesTable />
    </>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
