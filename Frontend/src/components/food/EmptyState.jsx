import { Utensils } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ title, description }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
      <Utensils className="mb-3 h-8 w-8 text-orange-500" />
      <h3 className="text-lg font-semibold text-stone-950">{title || t('states.empty')}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-stone-500">{description}</p>}
    </div>
  );
};

export default EmptyState;
