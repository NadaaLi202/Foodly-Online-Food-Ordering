import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ChevronRight } from 'lucide-react';

/**
 * TemplateEditor — 3-column editor shell matching the reference site exactly.
 *
 * LAYOUT (inside app's existing Layout sidebar):
 *   Column 1 (~120px): Vertical tab list (Design, Page, Logo, etc.)
 *   Column 2 (~40%):   Tab content (form fields)
 *   Column 3 (~45%):   PDF/document preview with optional header controls
 *
 * Props:
 *   breadcrumbs     [{ label, to? }]
 *   tabs            [{ id, label }]
 *   activeTab       string
 *   onTabChange     (id) => void
 *   tabContent      ReactNode — form content for active tab
 *   previewContent  ReactNode — rendered document preview
 *   previewHeader   ReactNode — optional controls above preview (selectors, Preview btn)
 *   onSave          () => void
 *   saving          boolean
 *   backUrl         string
 */
const TemplateEditor = ({
    breadcrumbs = [],
    tabs = [],
    activeTab,
    onTabChange,
    tabContent,
    previewContent,
    previewHeader,
    onSave,
    saving = false,
    backUrl = '/dashboard/templates',
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col h-full min-h-0">
            {/* ── Breadcrumb ── */}


            {/* ── Main 3-column area ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Column 1: Tab names */}
                <div className="w-[140px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors border-b border-gray-50 ${activeTab === tab.id
                                ? 'text-indigo-600 font-bold bg-white'
                                : 'text-gray-600 hover:bg-gray-50 font-medium'
                                }`}
                        >
                            <span>{tab.label}</span>
                            <ChevronRight size={14} className={activeTab === tab.id ? 'text-indigo-400' : 'text-gray-300'} />
                        </button>
                    ))}
                </div>

                {/* Column 2: Tab content (form) */}
                <div className="flex-1 min-w-[280px] max-w-[480px] border-r border-gray-200 bg-white overflow-y-auto p-5">
                    {tabContent}
                </div>

                {/* Column 3: Preview */}
                <div className="flex-1 bg-gray-100 flex flex-col min-w-0 overflow-hidden">
                    {/* Preview header controls */}
                    {previewHeader && (
                        <div className="border-b border-gray-200 bg-white">
                            {previewHeader}
                        </div>
                    )}

                    {/* Document preview */}
                    <div className="flex-1 overflow-hidden p-3 flex min-h-screen">
                        {previewContent}
                    </div>

                    {/* Action buttons at bottom of preview */}
                    <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3 shrink-0">
                        <Link
                            to={backUrl}
                            className="px-6 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors"
                        >
                            {t('Cancel', 'إلغاء')}
                        </Link>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="px-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2 rounded text-sm font-bold transition-colors"
                        >
                            {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save', 'حفظ')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;
