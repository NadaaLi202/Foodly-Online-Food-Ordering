import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';

export default function CostCenters() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    return (
        <div className="min-h-screen bg-white font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Content Area */}
            <div className="p-8">
                <div className="bg-[#EBF5FF] border border-[#DEEDFF] rounded-lg p-5 flex gap-3 shadow-sm">
                    <div className="flex-shrink-0 mt-0.5">
                        <div className="bg-[#2563EB] text-white rounded-full p-0.5 flex items-center justify-center">
                            <Info size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-[#2563EB]">
                        <span className="font-bold text-sm">{t('accounting.cost_centers.info')}</span>
                        <div className="text-[#3B82F6] text-sm font-bold">
                            {t('accounting.cost_centers.disabled_message')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
