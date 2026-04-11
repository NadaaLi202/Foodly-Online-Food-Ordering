import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, Receipt, Tag, CheckSquare } from 'lucide-react';

const TemplatesMainPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const cards = [
        {
            title: t('General Templates', 'القوالب العامة'),
            desc: t('Design general templates for invoices and reports', 'تصميم قوالب عامة للفواتير والتقارير'),
            icon: FileText,
            to: '/dashboard/templates/general',
            color: 'text-blue-600 bg-blue-50',
        },
        {
            title: t('Invoice Templates', 'قوالب الفواتير'),
            desc: t('Design templates specifically for tax invoices', 'تصميم قوالب خاصة بالفواتير الضريبية'),
            icon: Receipt,
            to: '/dashboard/templates/invoices',
            color: 'text-emerald-600 bg-emerald-50',
        },
        {
            title: t('Product Labels', 'ملصقات المنتجات'),
            desc: t('Design barcode and price labels', 'تصميم ملصقات الباركود والأسعار'),
            icon: Tag,
            to: '/dashboard/templates/product-labels',
            color: 'text-purple-600 bg-purple-50',
        },
        {
            title: t('Invoice QA Tool', 'أداة اختبار الفواتير'),
            desc: t('Test invoice templates before sending', 'اختبر قوالب الفواتير قبل الإرسال'),
            icon: CheckSquare,
            to: '/dashboard/templates/invoice-qa',
            color: 'text-orange-600 bg-orange-50',
        },
    ];

    return (
        <div className="min-h-screen bg-[#f5f7f9] p-6" dir={isRtl ? 'rtl' : 'ltr'}>


            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.to}
                            to={card.to}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all group"
                        >
                            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
                                <Icon size={24} />
                            </div>
                            <h3 className="text-base font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                                {card.title}
                            </h3>
                            <p className="text-sm text-gray-500">{card.desc}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default TemplatesMainPage;
