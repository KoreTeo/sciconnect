import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form';
import { Input, Select, Textarea } from './Input';

type Options = { label: string; value: string };

function fieldError<T extends FieldValues>(errors: FieldErrors<T>, name: Path<T>): string | undefined {
  const error = errors[name];
  return typeof error?.message === 'string' ? error.message : undefined;
}

type FormInputProps<T extends FieldValues> = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & {
  name: Path<T>;
  label?: string;
  hint?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
};

export function FormInput<T extends FieldValues>({
  name,
  label,
  hint,
  register,
  errors,
  ...props
}: FormInputProps<T>) {
  return <Input label={label} hint={hint} error={fieldError(errors, name)} {...props} {...register(name)} />;
}

type FormTextareaProps<T extends FieldValues> = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> & {
  name: Path<T>;
  label?: string;
  hint?: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
};

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  hint,
  register,
  errors,
  ...props
}: FormTextareaProps<T>) {
  return <Textarea label={label} hint={hint} error={fieldError(errors, name)} {...props} {...register(name)} />;
}

type FormSelectProps<T extends FieldValues> = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> & {
  name: Path<T>;
  label?: string;
  hint?: string;
  options?: Options[];
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
};

export function FormSelect<T extends FieldValues>({
  name,
  label,
  hint,
  options,
  children,
  register,
  errors,
  ...props
}: FormSelectProps<T>) {
  return (
    <Select label={label} hint={hint} error={fieldError(errors, name)} {...props} {...register(name)}>
      {options?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
      {children}
    </Select>
  );
}
