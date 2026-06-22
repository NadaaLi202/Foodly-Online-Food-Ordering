import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language?.startsWith('ar');

  const toggleLanguage = () => {
    i18n.changeLanguage(isArabic ? 'en' : 'ar');
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-700"
      title={isArabic ? 'English' : 'Arabic'}
    >
      <Languages className="h-4 w-4" />
      <span>{isArabic ? 'EN' : 'AR'}</span>
    </button>
  );
};

export default LanguageSwitcher;
