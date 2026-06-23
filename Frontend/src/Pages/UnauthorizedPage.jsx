import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UnauthorizedPage = () => {
  const { t } = useTranslation();

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 lg:px-8">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 text-red-700">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-black text-stone-950">{t('auth.unauthorizedTitle')}</h1>
      <p className="mt-3 max-w-xl text-stone-500">{t('auth.unauthorizedText')}</p>
      <Link
        to="/menu"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-stone-950 px-5 font-bold text-white hover:bg-stone-800"
      >
        {t('nav.menu')}
      </Link>
    </section>
  );
};

export default UnauthorizedPage;
