import { LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getErrorMessage } from '../../services/api';

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    try {
      const user = await login(values);
      toast.success(t('messages.welcome'));
      navigate(user.role === 'admin' ? '/admin' : (location.state?.from?.pathname || '/menu'), { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, t('messages.loginFailed')));
    }
  };

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black text-stone-950">{t('auth.loginTitle')}</h1>
        <p className="mt-2 text-stone-500">{t('auth.loginSubtitle')}</p>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.email')}
            <input type="email" className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('email', { required: t('validation.required') })} />
            {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
          </label>
          <label className="grid gap-2 text-sm font-semibold text-stone-700">
            {t('forms.password')}
            <input type="password" className="h-11 rounded-lg border border-stone-200 px-3 outline-none focus:border-orange-500" {...register('password', { required: t('validation.required') })} />
            {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
          </label>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 font-bold text-white hover:bg-orange-700 disabled:bg-stone-300">
            <LogIn className="h-5 w-5" />
            {isSubmitting ? t('states.saving') : t('nav.login')}
          </button>
        </div>
        <p className="mt-5 text-center text-sm text-stone-500">
          {t('auth.noAccount')}{' '}
          <Link className="font-bold text-orange-700 hover:text-orange-800" to="/register">{t('nav.register')}</Link>
        </p>
      </form>
    </section>
  );
};

export default LoginPage;
