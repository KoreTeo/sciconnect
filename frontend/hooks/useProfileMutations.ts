'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/ui/Toast';
import { applyApiValidationErrors } from '@/lib/errors';
import { useChangePassword, useUpdateProfile } from '@/lib/queries/users';
import {
  passwordSchema,
  profileSchema,
  type PasswordFormValues,
  type ProfileFormValues,
} from '@/lib/validation';

export function useProfileMutations() {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: '', affiliation: '', orcid: '', phone: '', position: '', country: '' },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '' },
  });

  const saveProfile = async (values: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync(values);
      await refreshUser();
      toast.success('Профиль обновлён');
    } catch (err) {
      applyApiValidationErrors(err, profileForm.setError, 'Не удалось обновить профиль');
    }
  };

  const changePassword = async (values: PasswordFormValues) => {
    try {
      await changePasswordMutation.mutateAsync(values);
      passwordForm.reset();
      toast.success('Пароль изменён');
    } catch (err) {
      applyApiValidationErrors(err, passwordForm.setError, 'Не удалось изменить пароль');
    }
  };

  return {
    profileForm,
    passwordForm,
    saveProfile,
    changePassword,
  };
}
