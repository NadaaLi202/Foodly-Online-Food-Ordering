import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/api';

const RegisterPage = () => {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (values) => {
    try {
      await registerUser(values);
      toast.success(t('messages.accountCreated'));
      navigate('/menu', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.registerFailed')));
    }
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-stone-950">{t('auth.registerTitle')}</h1>
        <p className="mt-2 text-stone-500">{t('auth.registerSubtitle')}</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.fullName')}
            <input className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('name', { required: t('validation.required') })} />
            {errors.name && <span className="text-xs text-red-600">{errors.name.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.email')}
            <input type="email" className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('email', { required: t('validation.required') })} />
            {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              {t('forms.password')}
              <input type="password" className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('password', { required: t('validation.required'), minLength: { value: 6, message: t('validation.password') } })} />
              {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              {t('forms.confirmPassword')}
              <input
                type="password"
                className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500"
                {...register('confirmPassword', {
                  required: t('validation.required'),
                  validate: (value) => value === password || t('validation.passwordMatch'),
                })}
              />
              {errors.confirmPassword && <span className="text-xs text-red-600">{errors.confirmPassword.message}</span>}
            </label>
          </div>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-bold text-white hover:bg-orange-700 disabled:bg-stone-300">
            <UserPlus className="h-5 w-5" />
            {isSubmitting ? t('states.saving') : t('nav.register')}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-stone-500">
          {t('auth.hasAccount')}{' '}
          <Link className="font-bold text-orange-700 hover:text-orange-800" to="/login">{t('nav.login')}</Link>
        </p>
      </form>
    </section>
  );
};

export default RegisterPage;
