import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Building, Menu, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const TopBar = ({ onToggleSidebar, isMobile }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const { user, isImpersonating, restoreSuperAdmin, updateCompanySettings } = useAuth();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef(null);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        updateCompanySettings({ language: lang });
        setIsLangMenuOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setIsLangMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full print:hidden" dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Left Side (LTR) / Right Side (RTL): Menu + Actions */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button - First item to follow direction */}
                {isMobile && (
                    <button
                        onClick={onToggleSidebar}
                        className="text-gray-600 hover:text-indigo-700 transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                )}

                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <button className={`flex items-center gap-1 text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded-md transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Plus size={18} />
                        <span>{t('topbar.add')}</span>
                    </button>
                    <button className={`flex items-center gap-1 text-indigo-700 font-medium hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Search size={18} />
                        <span>{t('topbar.view')}</span>
                    </button>
                </div>
            </div>

            {/* Right Side (LTR) / Left Side (RTL): Info + Lang + Profile */}
            <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {/* Branch Info */}
                {!isMobile && (
                    <div className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <Building size={16} />
                        <span className="text-sm font-medium">{t('topbar.main_branch')}</span>
                    </div>
                )}

                {/* Language Dropdown */}
                <div className="relative" ref={langMenuRef}>
                    <button
                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                        className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors font-bold text-sm uppercase"
                    >
                        {i18n.language.split('-')[0]}
                    </button>

                    {isLangMenuOpen && (
                        <div className={`absolute top-12 ${isRtl ? 'left-0' : 'right-0'} w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50`}>
                            <button
                                onClick={() => changeLanguage('ar')}
                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                            >
                                <span className="text-xl">🇪🇬</span>
                                <span className="text-sm font-medium text-gray-700">العربية</span>
                            </button>
                            <button
                                onClick={() => changeLanguage('en')}
                                className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                            >
                                <span className="text-xl">🇺🇸</span>
                                <span className="text-sm font-medium text-gray-700">English</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Return to SuperAdmin when impersonating */}
                {isImpersonating() && (
                    <button
                        onClick={restoreSuperAdmin}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-medium text-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                    >
                        <LogOut size={16} className={isRtl ? 'rotate-180' : ''} />
                        <span>{t('topbar.returnToSuperAdmin') || 'Return to SuperAdmin'}</span>
                    </button>
                )}

                {/* User Profile */}
                <div className={`flex items-center gap-3 pl-4 rtl:pl-0 rtl:pr-4 border-l rtl:border-r rtl:border-l-0 border-gray-200 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex flex-col ${isRtl ? 'items-start' : 'items-end'} hidden sm:block`}>
                        <span className="text-sm font-bold text-gray-800">{user?.name}</span>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border border-gray-300 flex items-center justify-center text-white font-bold text-sm">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
