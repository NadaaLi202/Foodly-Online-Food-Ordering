import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LoadingState = ({ label }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-stone-600">
      <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
      <span>{label || t('states.loading')}</span>
    </div>
  );
};

export default LoadingState;
