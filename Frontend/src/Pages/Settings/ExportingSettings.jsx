import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import exportService from '../../services/exportService';

const ExportingSettings = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [selectedEntity, setSelectedEntity] = useState('products');
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            if (selectedEntity === 'products') {
                await exportService.exportProducts();
            } else if (selectedEntity === 'clients') {
                await exportService.exportCustomers();
            } else if (selectedEntity === 'suppliers') {
                await exportService.exportSuppliers();
            }
            toast.success(t('sales.common.success_export', 'Export successful'));
        } catch (err) {
            toast.error(t('sales.common.error_message'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-[#F8F9FA] min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white border border-gray-200 rounded overflow-hidden h-10 shadow-sm px-2 gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="text-gray-400 hover:text-gray-600 px-1 border-l border-gray-100 last:border-l-0"
                        >
                            <Home size={18} />
                        </button>
                        <div className="flex items-center text-[#4B5563] font-medium text-sm gap-1">
                            <span className="text-gray-400">{t('sidebar.settings')}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-bold">{t('export_settings.title')}</span>
                        </div>
                        <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600 px-1 border-r border-gray-100 first:border-r-0"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Selection Content */}
            <div className="max-w-4xl mx-auto bg-white p-12 rounded-lg shadow-sm border border-gray-100 min-h-[400px] flex flex-col justify-center">
                <div className="space-y-6 flex flex-col items-start px-12">
                    {[
                        { id: 'products', label: t('export_settings.products') },
                        { id: 'clients', label: t('export_settings.clients') },
                        { id: 'suppliers', label: t('export_settings.suppliers') },
                    ].map((entity) => (
                        <label key={entity.id} className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-lg font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                                {entity.label}
                            </span>
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="radio"
                                    name="export_entity"
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-indigo-600 transition-all"
                                    checked={selectedEntity === entity.id}
                                    onChange={() => setSelectedEntity(entity.id)}
                                />
                                <div className="absolute h-2.5 w-2.5 rounded-full bg-indigo-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                        </label>
                    ))}

                    <div className="pt-6">
                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className="bg-[#10B981] text-white px-8 py-2 rounded-md font-bold hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 min-w-[120px]"
                        >
                            {loading ? t('sales.common.loading') : t('export_settings.export_btn')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportingSettings;
