import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { orderStatuses } from '../../utils/format';

const StatusTimeline = ({ status }) => {
  const { t } = useTranslation();
  const currentIndex = orderStatuses.indexOf(status);

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      {orderStatuses.map((item, index) => {
        const active = index <= currentIndex;

        return (
          <div key={item} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${active ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-400'}`}>
              <Check className="h-4 w-4" />
            </span>
            <span className={`text-sm font-semibold ${active ? 'text-stone-950' : 'text-stone-500'}`}>
              {t(`statuses.${item}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StatusTimeline;
