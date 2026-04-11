import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Info, RefreshCw, FileText } from 'lucide-react';

const PermissionsFinance = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const isNewPage = location.pathname.endsWith('/new');

    const handleAddClick = (e) => {
        // Stop bubbling and defaults at both stages to be absolutely safe
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        navigate('/dashboard/finance/requisitions/new');
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header section — hide on /new page to prevent overlap with AddMenu */}
            {!isNewPage && (
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onClick={handleAddClick}
                            className="flex items-center gap-1.5 bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm hover:shadow-md relative z-[60]"
                        >
                            <Plus size={18} />
                            <span>{i18n.language === 'ar' ? 'إضافة أذونة' : 'Add Requisition'}</span>
                        </button>
                        
                        {/* Placeholder search to match layout */}
                        <div className="hidden md:flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white flex-1 max-w-xs opacity-50 cursor-not-allowed">
                            <RefreshCw size={16} className="text-gray-400" />
                            <span className="ms-2 text-xs text-gray-400 italic">...</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-gray-600">
                        <FileText size={18} />
                        <span className="font-bold text-sm">{i18n.language === 'ar' ? 'الأذونات المالية' : 'Financial Requisitions'}</span>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="p-6">
                <div className="bg-blue-50 border-l-4 rtl:border-r-4 rtl:border-l-0 border-blue-400 p-6 rounded-xl shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className="h-6 w-6 text-blue-500" aria-hidden="true" />
                        </div>
                        <div className="ml-4 rtl:mr-4 rtl:ml-0">
                            <h3 className="text-base font-bold text-blue-900">
                                {t('finance_page.no_requisitions') || 'لا توجد أذونات'}
                            </h3>
                            <div className="mt-2 text-sm text-blue-800 leading-relaxed font-medium">
                                <p>
                                    {t('finance_page.no_requisitions_desc') || 'ابدأ بإضافة أول إذن من خلال الزر في الأعلى.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PermissionsFinance;
