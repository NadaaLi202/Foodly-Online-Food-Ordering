import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Building, Clock, X, Menu, Info } from 'lucide-react';

const TopBar = ({ onToggleSidebar, isMobile }) => {
    const { t, i18n } = useTranslation();
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const langMenuRef = useRef(null);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
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
        <div className="flex flex-col w-full z-10">
            {/* Orange Banner */}
            <div className="bg-orange-600 text-white px-6 py-2 flex justify-between items-center text-sm shadow-sm relative z-20">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                        <Clock size={16} className="text-white" />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white">
                        <span className="font-semibold">{t('topbar.trial_message', { days: 12 }).split(' ')[0]} 12 days left</span>
                        <span className="text-white/90">until your free trial ends.</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-orange-700 shadow-sm hover:bg-orange-50 active:scale-[0.99] transition">
                        {t('topbar.subscribe_now')}
                    </button>
                    <button className="text-white/90 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">
                        {t('topbar.trial_message', { days: 8 })}
                    </span>
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20">
                        <Info size={14} />
                    </span>
                </div>
            </div>

            {/* Main White Header */}
            <div className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between shadow-sm sticky top-0 z-10">

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

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded-md transition-colors">
                            <Plus size={18} />
                            <span>{t('topbar.add')}</span>
                        </button>
                        <button className="flex items-center gap-1 text-indigo-700 font-medium hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors">
                            <Search size={18} />
                            <span>{t('topbar.view')}</span>
                        </button>
                    </div>
                </div>

                {/* Right Side (LTR) / Left Side (RTL): Info + Lang + Profile */}
                <div className="flex items-center gap-6">
                    {/* Branch Info */}
                    {!isMobile && (
                        <div className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                            <Building size={16} />
                            <span className="text-sm font-medium">{t('topbar.main_branch')}</span>
                        </div>
                    )}

                    {/* Language Dropdown */}
                    <div className="relative" ref={langMenuRef}>
                        <button
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-md text-gray-700 hover:bg-gray-200 transition-colors font-bold text-sm"
                        >
                            {i18n.language.toUpperCase().split('-')[0]}
                        </button>

                        {isLangMenuOpen && (
                            <div className="absolute top-12 ltr:right-0 rtl:left-0 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                                <button
                                    onClick={() => changeLanguage('ar')}
                                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-right"
                                >
                                    <span className="text-xl">🇪🇬</span>
                                    <span className="text-sm font-medium text-gray-700">العربية</span>
                                </button>
                                <button
                                    onClick={() => changeLanguage('en')}
                                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                                >
                                    <span className="text-xl">🇺🇸</span>
                                    <span className="text-sm font-medium text-gray-700">English</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center gap-3 pl-4 rtl:pl-0 rtl:pr-4 border-l rtl:border-r rtl:border-l-0 border-gray-200">
                        <div className="flex flex-col items-end rtl:items-start hidden sm:block">
                            <span className="text-sm font-bold text-gray-800"></span>
                        </div>
                        <div className="w-9 h-9 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                            <img
                                src=""
                                alt="User"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
