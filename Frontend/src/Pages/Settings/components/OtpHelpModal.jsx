import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, Info } from 'lucide-react';

const OtpHelpModal = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    if (!isOpen) return null;

    const steps = [
        {
            id: 1,
            title: t('zatca.help_step1_title'),
            desc: t('zatca.help_step1_desc'),
            link: 'https://fatoora.zatca.gov.sa'
        },
        {
            id: 2,
            title: t('zatca.help_step2_title'),
            desc: t('zatca.help_step2_desc')
        },
        {
            id: 3,
            title: t('zatca.help_step3_title'),
            desc: t('zatca.help_step3_desc')
        },
        {
            id: 4,
            title: t('zatca.help_step4_title'),
            desc: t('zatca.help_step4_desc')
        },
        {
            id: 5,
            title: t('zatca.help_step5_title'),
            desc: t('zatca.help_step5_desc')
        },
        {
            id: 6,
            title: t('zatca.help_step6_title'),
            desc: t('zatca.help_step6_desc')
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ${isRTL ? 'rtl' : 'ltr'}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Info className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800">
                            {t('zatca.how_to_get_otp')}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {steps.map((step) => (
                        <div key={step.id} className="space-y-4">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {step.id}
                                </span>
                                <div className="space-y-1 pt-1">
                                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {step.desc}
                                    </p>
                                    {step.link && (
                                        <a
                                            href={step.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium pt-1"
                                        >
                                            {step.link}
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Placeholder for Design Screenshots - In a real app we would use image assets */}
                            <div className="mr-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center h-48 text-gray-400 text-xs italic">
                                {t('zatca.visual_guide_placeholder')}
                            </div>
                        </div>
                    ))}

                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800 leading-relaxed">
                            <p className="font-bold mb-1">{t('zatca.otp_difference_title')}</p>
                            <p>{t('zatca.otp_difference_desc')}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors"
                    >
                        {t('zatca.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OtpHelpModal;
