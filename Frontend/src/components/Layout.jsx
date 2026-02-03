import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumbs from './Breadcrumbs';
import { useTranslation } from 'react-i18next';

const Layout = () => {
    const { i18n } = useTranslation();
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1020;
            setIsMobile(mobile);
            if (!mobile) setIsSidebarOpen(false);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    useEffect(() => {
        document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans text-slate-800">
            <Sidebar isMobile={isMobile} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Mobile Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <TopBar onToggleSidebar={toggleSidebar} isMobile={isMobile} />
                <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50">
                    <Breadcrumbs />
                    <main className="w-full">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Layout;
