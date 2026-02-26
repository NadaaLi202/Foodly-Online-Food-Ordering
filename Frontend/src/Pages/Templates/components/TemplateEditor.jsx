import React from 'react';
import { Link } from 'react-router-dom';
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
    return (
        <div className="flex flex-col h-full min-h-0">
            {/* ── Breadcrumb ── */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
                <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">
                    <Home size={18} />
                </Link>
                {breadcrumbs.map((b, i) => (
                    <React.Fragment key={i}>
                        <ChevronRight size={14} className="text-gray-300" />
                        {b.to ? (
                            <Link to={b.to} className="text-sm text-gray-500 hover:text-gray-800">{b.label}</Link>
                        ) : (
                            <span className="text-sm font-semibold text-gray-800">{b.label}</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

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

                    {/* Save button at bottom of tabs */}
                    <div className="p-3 mt-4">
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2 rounded text-sm font-bold transition-colors"
                        >
                            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                        </button>
                        <Link
                            to={backUrl}
                            className="block text-center mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                            إلغاء
                        </Link>
                    </div>
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
                    <div className="flex-1 overflow-auto p-4">
                        {previewContent}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditor;
