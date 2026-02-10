import React, { useState } from 'react';
import { useLocation, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import SearchFilterPopup from './SearchFilterPopup';

const Breadcrumbs = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Split pathname into segments, filter out empty strings
    const pathSegments = location.pathname.split('/').filter(segment => segment !== '');

    // Function to translate segments
    const getTranslatedName = (segment) => {
        // Try common keys
        const sidebarKey = `sidebar.${segment}`;
        const dashboardKey = `dashboard.${segment}`;

        // Check if translation exists (simplified check, i18next usually returns key if missing)
        // Ideally we assume the key exists in sidebar as seen in en.json
        // Special case mappings if needed
        if (segment === 'dashboard') return t('sidebar.dashboard');

        // Try to translate using sidebar namespace first as most routes match sidebar keys
        const translated = t(sidebarKey);

        // If translation returns the key itself, it might not exist (depending on i18n config), 
        // but for now we trust existing keys. 
        // Fallback to capitalizing if it looks like a key
        if (translated === sidebarKey) {
            return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }

        return translated;
    };

    const handleRefresh = () => {
        navigate(0); // Refreshes the current page
    };

    const handleClearFilters = () => {
        setSearchParams({});
    };

    const hasFilters = Array.from(searchParams.keys()).length > 0;
    const showActions = location.pathname !== '/' && !location.pathname.endsWith('/add');
    const addPath = `${location.pathname}/add`;

    return (
        <div className="flex items-center mx-auto max-w-7xl py-4 px-4 sm:px-6 lg:px-8">
            <nav className="flex" aria-label="Breadcrumb">
                <ol role="list" className="flex items-center gap-x-1 md:gap-x-4 rounded-md bg-white px-4 py-2 md:px-6 shadow border border-gray-100">
                    <li className="flex">
                        <div className="flex items-center">
                            <Link
                                to="/"
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5 flex-shrink-0">
                                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clipRule="evenodd" />
                                </svg>
                                <span className="sr-only">Home</span>
                            </Link>
                        </div>
                    </li>

                    {pathSegments.map((segment, index) => {
                        const routeTo = `/${pathSegments.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathSegments.length - 1;

                        return (
                            <li key={routeTo} className="flex">
                                <div className="flex items-center">
                                    <svg
                                        className="h-full w-6 flex-shrink-0 text-gray-200 rtl:rotate-180"
                                        viewBox="0 0 24 44"
                                        preserveAspectRatio="none"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                        aria-hidden="true"
                                    >
                                        <path d="M.293 0l22 22-22 22h1.414l22-22-22-22H.293z" />
                                    </svg>

                                    {isLast ? (
                                        <span className="ms-2 md:ms-4 text-sm font-medium text-gray-700 cursor-default flex items-center gap-2">
                                            {getTranslatedName(segment)}
                                            {hasFilters && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
                                                    {t('sales.common.filtered', 'Filtered')}
                                                </span>
                                            )}
                                        </span>
                                    ) : (
                                        <Link
                                            to={routeTo}
                                            className="ms-2 md:ms-4 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                            {getTranslatedName(segment)}
                                        </Link>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            <button
                type="button"
                onClick={handleRefresh}
                className="ms-1 p-1 text-gray-500 hover:text-gray-700 transition-all"
                title={t('sales.common.refresh')}
            >
                <RefreshCw size={20} />
            </button>

            {showActions && (
                <div className="ms-auto flex gap-3">
                    {hasFilters ? (
                        <div className="isolate inline-flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(true)}
                                className="rounded-s-md inline-flex items-center justify-center bg-indigo-100 py-2.5 px-3.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                                </svg>
                                <div className="ms-1 hidden sm:block">{t('sales.common.search_filter')}</div>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="inline-flex items-center justify-center rounded-e-md bg-red-100 py-2.5 px-3.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <div className="isolate inline-flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(true)}
                                className="rounded-md inline-flex items-center justify-center bg-white border border-gray-300 py-2.5 px-3.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5 text-gray-400">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                                </svg>
                                <div className="ms-1 hidden sm:block">{t('sales.common.search_filter')}</div>
                            </button>
                        </div>
                    )}
                    <div className="isolate inline-flex rounded-md shadow-sm">
                        <Link to={addPath} className="inline-flex">
                            <div className="rounded-md inline-flex items-center justify-center cursor-pointer border border-transparent bg-indigo-600 py-2 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:z-10 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                </svg>
                                <div className="ms-1 hidden sm:block">{t('sales.common.add')}</div>
                            </div>
                        </Link>
                    </div>
                </div>
            )}

            <SearchFilterPopup
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
};

export default Breadcrumbs;
