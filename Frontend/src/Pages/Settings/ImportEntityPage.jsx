import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { FileUp, Home, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import importService from '../../services/importService';

const ImportEntityPage = () => {
    const { entity } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ar';

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const getEntityInfo = () => {
        switch (entity) {
            case 'products':
                return {
                    title: t('import_settings.import_products'),
                    breadcrumb: t('import_settings.products'),
                    instr2: t('import_settings.instruction_2_products'),
                    importFn: importService.importProducts
                };
            case 'customers':
                return {
                    title: t('import_settings.import_clients'),
                    breadcrumb: t('import_settings.clients'),
                    instr2: t('import_settings.instruction_2_clients'),
                    importFn: importService.importCustomers
                };
            case 'suppliers':
                return {
                    title: t('import_settings.import_suppliers'),
                    breadcrumb: t('import_settings.suppliers'),
                    instr2: t('import_settings.instruction_2_suppliers'),
                    importFn: importService.importSuppliers
                };
            default:
                return {};
        }
    };

    const info = getEntityInfo();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            toast.error(t('sales.common.choose_file', 'Please choose a file'));
            return;
        }

        setLoading(true);
        try {
            await info.importFn(file);
            toast.success(t('import_settings.import_success'));
            navigate('/settings/import');
        } catch (err) {
            toast.error(err.response?.data?.message || t('sales.common.error_message'));
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
                            <span className="text-gray-400">{t('import_settings.title')}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-700 font-bold">{info.breadcrumb}</span>
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

            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                {/* Instructions Box */}
                <div className="mb-8">
                    <p className="text-gray-800 font-medium mb-1">{t('import_settings.instruction_1')}</p>
                    <p className="text-gray-800 font-medium">
                        {info.instr2}{' '}
                        <a href="#" className="text-indigo-600 hover:underline">{t('import_settings.download_here')}</a>
                    </p>
                </div>

                {/* Drop Zone */}
                <div
                    className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center transition-colors cursor-pointer ${file ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-200 hover:border-indigo-400'}`}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept=".csv, .xlsx, .xls"
                        onChange={handleFileChange}
                    />

                    {file ? (
                        <div className="flex flex-col items-center">
                            <div className="bg-indigo-600 text-white p-3 rounded-full mb-4">
                                <FileUp size={32} />
                            </div>
                            <span className="text-indigo-600 font-bold text-lg mb-2">{file.name}</span>
                            <span className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="mt-4 text-red-500 hover:text-red-700 flex items-center gap-1 font-bold"
                            >
                                <X size={16} />
                                {t('sales.common.cancel')}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="bg-gray-100 p-4 rounded-full mb-6 text-gray-400">
                                <FileUp size={48} />
                            </div>
                            <p className="text-indigo-600 font-bold text-lg mb-2">{t('import_settings.upload_area_title')}</p>
                            <p className="text-gray-400 font-medium">{t('import_settings.upload_area_subtitle')}</p>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="mt-12 flex justify-end">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !file}
                        className={`px-10 py-2.5 bg-[#10B981] text-white font-bold rounded-md hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2`}
                    >
                        {loading ? t('sales.common.loading') : t('import_settings.next')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportEntityPage;
