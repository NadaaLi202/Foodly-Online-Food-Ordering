import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    BarChart3,
    Menu,
    X,
    TrendingUp,
    Lock,
    Cpu,
    FileCheck,
    Users,
    Settings,
    LogOut,
    Bell,
    Globe2,
    ChevronLeft,
    Phone,
    Monitor,
    Smartphone,
    Play,
    Pause,
    RotateCcw,
    MousePointer2,
    FileText,
    Wallet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AnimatedDemo from '../components/AnimatedDemo';


const LandingPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar' || true; // Force RTL based on prompt
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [hoveredFeature, setHoveredFeature] = React.useState(null);
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const demoImages = [
        '/screenshots/demo5.png', // Main Sales Dashboard
        '/screenshots/demo4.png', // Add Invoice
        '/screenshots/demo1.png', // Add Category
        '/screenshots/demo2.png', // Add Safe
        '/screenshots/demo3.png', // Add Permission
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % demoImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // CSS Animations for the Hero Mockup
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInLeft {
                from { opacity: 0; transform: translateX(40px); }
                to { opacity: 1; transform: translateX(0); }
            }
            @keyframes heroFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes heroFloatOpposite {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(10px); }
            }
            .hero-mockup-wrapper {
                animation: fadeInLeft 1s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }
            .hero-float-anim {
                animation: heroFloat 4s ease-in-out infinite;
            }
            .hero-parallax-1 {
                animation: heroFloat 4s ease-in-out infinite;
                animation-delay: 0.5s;
            }
            .hero-parallax-2 {
                animation: heroFloatOpposite 4s ease-in-out infinite;
                animation-delay: 1.5s;
            }
        `;
        document.head.appendChild(style);
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleSignout = () => {
        setIsLoggedIn(false);
        setIsProfileOpen(false);
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-[#00BCD4] selection:text-white overflow-x-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white border-b border-gray-100 shadow-sm transition-all h-20 flex items-center">
                <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center w-full">
                        {/* Logo - Right side in RTL */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <div className="w-4 h-4 rounded-full bg-white relative">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-gray-800 tracking-tight">
                                دفتر المحاسب
                            </span>
                        </Link>

                        {/* Navigation links - Middle */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-base font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                                المميزات
                            </a>
                            <a href="#pricing" className="text-base font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                                الأسعار
                            </a>
                            <a href="#contact" className="text-base font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                                اتصل بنا
                            </a>
                        </div>

                        {/* Login/Signup - Left side in RTL */}
                        <div className="hidden md:flex items-center gap-4">
                            {isLoggedIn ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                            A
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700">Ahmed</span>
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                                            <div className="p-4 border-b border-gray-50">
                                                <p className="text-sm font-semibold text-gray-800 text-right">Ahmed</p>
                                                <p className="text-xs text-gray-500 text-right">ahmed@example.com</p>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm text-right">
                                                    <Settings className="w-4 h-4 ml-2" />
                                                    الإعدادات
                                                </button>
                                                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 text-sm text-right">
                                                    <Bell className="w-4 h-4 ml-2" />
                                                    الإشعارات
                                                </button>
                                                <button
                                                    onClick={handleSignout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 text-sm font-medium border-t border-gray-50 mt-2 pt-3 text-right"
                                                >
                                                    <LogOut className="w-4 h-4 ml-2" />
                                                    تسجيل الخروج
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="px-6 py-2 border-2 border-[#00BCD4] text-[#00BCD4] hover:bg-[#00BCD4] hover:text-white text-base font-bold rounded-full transition-all">
                                        تسجيل الدخول
                                    </Link>
                                    <Link to="/signup" className="px-6 py-2.5 bg-[#00BCD4] text-white text-base font-bold rounded-full hover:bg-cyan-500 transition-all shadow-md shadow-cyan-500/20">
                                        ابدأ الآن
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 absolute top-20 w-full px-4 py-6 shadow-xl z-50">
                        <div className="flex flex-col gap-4">
                            <a href="#features" onClick={toggleMenu} className="text-base font-semibold text-gray-700 py-2 hover:text-indigo-600 text-right">المميزات</a>
                            <a href="#pricing" onClick={toggleMenu} className="text-base font-semibold text-gray-700 py-2 hover:text-indigo-600 text-right">الأسعار</a>
                            <a href="#contact" onClick={toggleMenu} className="text-base font-semibold text-gray-700 py-2 hover:text-indigo-600 text-right">اتصل بنا</a>
                            <hr className="border-gray-100 my-2" />
                            {isLoggedIn ? (
                                <>
                                    <button onClick={handleSignout} className="w-full text-right text-red-600 font-bold py-2">تسجيل الخروج</button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={toggleMenu} className="text-base font-bold text-[#00BCD4] border-2 border-[#00BCD4] py-2 px-4 rounded-xl text-center hover:bg-cyan-50 transition-colors">تسجيل الدخول</Link>
                                    <Link to="/signup" onClick={toggleMenu} className="text-base font-bold text-white bg-[#00BCD4] py-3 px-4 rounded-xl text-center mt-2 hover:bg-cyan-500 shadow-md">ابدأ الآن</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative z-10 bg-white overflow-hidden">
                {/* Background Blob for Hero */}
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -translate-x-1/2 pointer-events-none z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                        {/* Right Column (Text) */}
                        <div className="w-full flex flex-col items-center lg:items-start text-center lg:text-right order-1">
                            <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-[54px] font-black text-[#1a1a2e] leading-[1.2] mb-4">
                                البرنامج المحاسبي <span className="text-[#00BCD4] relative inline-block">الأمثل
                                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#00BCD4]/20" viewBox="0 0 100 20" preserveAspectRatio="none">
                                        <path d="M0,10 Q50,20 100,10" stroke="currentColor" strokeWidth="8" fill="none" />
                                    </svg>
                                </span> لإدارة أعمالك باحترافية
                            </h1>

                            <h2 className="text-xl md:text-2xl font-bold text-[#00BCD4] mb-8">
                                الأفضل سعراً .. والأسهل استخداماً
                            </h2>

                            {/* Trust Badge Box */}
                            <div className="w-full flex flex-col sm:flex-row items-center justify-between bg-[#F8F9FA] rounded-2xl p-5 mb-8 border border-gray-100">
                                <div className="flex flex-col gap-2 w-full sm:w-1/2 items-center sm:items-start mb-4 sm:mb-0">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                                        <span className="text-sm font-bold text-gray-700">الفاتورة الإلكترونية</span>
                                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">المرحلة الأولى <span className="text-green-500">✅</span> المرحلة الثانية <span className="text-green-500">✅</span></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500 fill-green-50" />
                                        <span className="text-sm font-bold text-gray-700">الإقرار الضريبي</span>
                                    </div>
                                </div>
                                <div className="w-full sm:w-1/2 flex justify-end items-center border-t sm:border-t-0 sm:border-r border-gray-200 pt-4 sm:pt-0 sm:pr-4">
                                    <div className="flex flex-col items-center pl-2">
                                        <span className="text-xs font-bold text-white bg-green-500 px-3 py-0.5 rounded-full mb-2">معتمد من</span>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-gray-700 m-0 leading-tight">هيئة الزكاة والضريبة والجمارك</p>
                                                <p className="text-[10px] text-gray-500 m-0">Zakat, Tax and Customs Authority</p>
                                            </div>
                                            <div className="w-8 h-8 opacity-80">
                                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L3 6v6.5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl">
                                ابدأ الآن لإدارة مبيعاتك ومنتجاتك وعملائك وتتبع إيراداتك ومصروفاتك وكافة أعمالك المحاسبية مع برنامج دفتر المحاسب السحابي المحمي بالكامل.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4 w-full lg:justify-start justify-center">
                                <button
                                    onClick={() => navigate('/signup')}
                                    className="w-full sm:w-auto px-8 py-3.5 bg-[#4F46E5] hover:bg-[#3B3B98] text-white text-base font-bold rounded-full transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    ابدأ الاستخدام مجاناً
                                </button>

                                <button className="w-full sm:w-auto px-6 py-3.5 bg-green-50 border border-green-200 text-green-600 text-base font-bold rounded-full hover:bg-green-100 transition-all flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                    </svg>
                                    واتساب
                                </button>

                                <button className="w-full sm:w-auto px-6 py-3.5 bg-white border border-gray-200 text-gray-700 text-base font-bold rounded-full hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    الجوال
                                </button>
                            </div>

                            <p className="text-green-600 font-semibold text-sm mr-2">
                                • ابدأ في أقل من دقيقة واحدة!
                            </p>
                        </div>

                        {/* Left Column (Mockup) */}
                        <div className="w-full relative hero-mockup-wrapper order-2 hidden md:block">
                            {/* Static Dashboard Mockup Container */}
                            <div className="max-w-[520px] mx-auto relative hero-float-anim">
                                {/* ZATCA Badge */}
                                <div className="absolute -top-6 -left-6 z-30 bg-white rounded-lg shadow-xl px-4 py-2 border border-gray-100 flex items-center gap-2 hero-parallax-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[11px] font-bold text-gray-800">ZATCA معتمد ✅</span>
                                </div>

                                {/* Growth Badge */}
                                <div className="absolute -bottom-4 -right-6 z-30 bg-white rounded-lg shadow-xl px-4 py-2 border border-gray-100 hero-parallax-2">
                                    <span className="text-green-600 font-black text-sm">📈 +٢٤٪ هذا الشهر</span>
                                </div>

                                {/* Browser Frame */}
                                <div className="rounded-[14px] overflow-hidden shadow-[0_25px_70px_rgba(79,70,229,0.3)] border border-white/10 bg-white flex flex-col h-[380px]">
                                    {/* Browser Top Bar */}
                                    <div className="h-[34px] bg-[#1e1e2e] flex items-center justify-between px-3 shrink-0 relative z-20">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                                            <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
                                        </div>
                                        <div className="bg-[#2a2a3e] rounded-full px-4 py-1 flex items-center gap-2">
                                            <Lock size={10} className="text-gray-500" />
                                            <span className="text-[9px] text-gray-400 font-medium" dir="ltr">app.daftar-almohaseb.com</span>
                                        </div>
                                        <div className="w-[40px]"></div>
                                    </div>

                                    {/* App Layout */}
                                    <div className="flex-1 flex overflow-hidden">
                                        {/* App Sidebar (Right in RTL) */}
                                        <div className="w-[140px] bg-[#0f172a] text-white flex flex-col shrink-0">
                                            <div className="p-3 border-b border-white/5 flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] font-bold">د</div>
                                                <span className="text-[10px] font-black tracking-tight">دفتر المحاسب</span>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <div className="text-[11px] text-gray-400 p-1.5 flex items-center gap-2">🏠 الرئيسية</div>
                                                <div className="text-[11px] text-white bg-[#4F46E5] p-1.5 rounded-md flex items-center gap-2 font-bold shadow-sm">📄 الفواتير</div>
                                                <div className="text-[11px] text-gray-400 p-1.5 flex items-center gap-2">👥 العملاء</div>
                                                <div className="text-[11px] text-gray-400 p-1.5 flex items-center gap-2">📦 المنتجات</div>
                                                <div className="text-[11px] text-gray-400 p-1.5 flex items-center gap-2">⚙️ الإعدادات</div>
                                            </div>
                                            <div className="mt-auto p-3 border-t border-white/5 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-600 border border-white/20 shrink-0"></div>
                                                <div className="overflow-hidden">
                                                    <p className="text-[9px] font-bold truncate">أحمد محمد</p>
                                                    <p className="text-[8px] text-gray-500 truncate">مدير النظام</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Area */}
                                        <div className="flex-1 bg-[#f8fafc] flex flex-col overflow-hidden">
                                            {/* Internal Navbar */}
                                            <div className="h-[40px] bg-white border-b border-gray-100 flex items-center justify-between px-4 shrink-0">
                                                <h4 className="text-xs font-black text-gray-800">الفواتير</h4>
                                                <div className="flex items-center gap-2">
                                                    <Bell size={12} className="text-gray-400" />
                                                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white font-bold">أ</div>
                                                </div>
                                            </div>

                                            {/* Page Content */}
                                            <div className="p-4 space-y-4 overflow-hidden">
                                                {/* Stats */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="bg-white p-2 rounded-lg border-r-2 border-blue-500 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[8px] text-gray-400 font-bold uppercase">الفواتير</span>
                                                        <span className="text-xs font-black text-gray-800">١٢٤</span>
                                                    </div>
                                                    <div className="bg-white p-2 rounded-lg border-r-2 border-green-500 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[8px] text-gray-400 font-bold uppercase">الإيرادات</span>
                                                        <span className="text-[10px] font-black text-gray-800">٤٨,٢٠٠</span>
                                                    </div>
                                                    <div className="bg-white p-2 rounded-lg border-r-2 border-orange-500 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[8px] text-gray-400 font-bold uppercase">العملاء</span>
                                                        <span className="text-xs font-black text-gray-800">٣٨</span>
                                                    </div>
                                                </div>

                                                {/* Table */}
                                                <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden text-[10px]">
                                                    <div className="bg-gray-50 p-2 grid grid-cols-4 gap-1 font-bold text-gray-500 border-b border-gray-100">
                                                        <div>#</div><div>العميل</div><div>المبلغ</div><div>الحالة</div>
                                                    </div>
                                                    <div className="divide-y divide-gray-50">
                                                        {[
                                                            { id: '001', name: 'محمد الزهراني', amount: '1,500', status: 'مدفوعة', color: 'green' },
                                                            { id: '002', name: 'شركة الرياض', amount: '3,200', status: 'معلقة', color: 'orange' },
                                                            { id: '003', name: 'أحمد علي', amount: '850', status: 'مدفوعة', color: 'green' },
                                                        ].map((row, i) => (
                                                            <div key={i} className={`grid grid-cols-4 gap-1 p-2 items-center ${i % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}`}>
                                                                <div className="font-bold text-indigo-700">INV-{row.id}</div>
                                                                <div className="truncate font-medium">{row.name}</div>
                                                                <div className="font-bold tabular-nums">{row.amount}</div>
                                                                <div>
                                                                    <span className={`bg-${row.color}-100 text-${row.color}-700 px-1.5 py-0.5 rounded-full text-[8px] font-black whitespace-nowrap`}>
                                                                        {row.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <AnimatedDemo />

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10 bg-gray-50 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-gray-50">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-block px-4 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-widest mb-6">
                            {t('landing.features.title', 'مميزاتنا')}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 tracking-tight">
                            {t('landing.features.header', 'كل ما تحتاجه لإدارة أعمالك')}
                        </h2>
                        <p className="text-lg text-gray-600">
                            {t('landing.features.subheader', 'أدوات متكاملة صُممت خصيصاً لتسهيل العملية المحاسبية لك')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Globe2 className="w-8 h-8" />,
                                title: t('landing.features.cloud.title', 'سحابي 100%'),
                                desc: t('landing.features.cloud.desc', 'الوصول إلى بياناتك من أي مكان وفي أي وقت بأمان تام.'),
                                color: "from-indigo-500 to-indigo-600"
                            },
                            {
                                icon: <Lock className="w-8 h-8" />,
                                title: t('landing.features.security.title', 'أمان عالي'),
                                desc: t('landing.features.security.desc', 'حماية متقدمة لبياناتك المحاسبية بأحدث تقنيات التشفير.'),
                                color: "from-violet-500 to-violet-600"
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8" />,
                                title: t('landing.features.analytics.title', 'تقارير ذكية'),
                                desc: t('landing.features.analytics.desc', 'رسوم بيانية وتحليلات دقيقة لمساعدتك في اتخاذ قرارات أفضل.'),
                                color: "from-pink-500 to-pink-600"
                            },
                            {
                                icon: <Cpu className="w-8 h-8" />,
                                title: t('landing.features.ai.title', 'تحليل ذكي'),
                                desc: t('landing.features.ai.desc', 'تحليل النفقات والمصروفات بشكل آلي لتقليل الأخطاء البشرية.'),
                                color: "from-cyan-500 to-cyan-600"
                            },
                            {
                                icon: <Users className="w-8 h-8" />,
                                title: t('landing.features.collaboration.title', 'تعدد المستخدمين'),
                                desc: t('landing.features.collaboration.desc', 'أضف فريق عملك مع صلاحيات مختلفة لكل مستخدم بسهولة.'),
                                color: "from-teal-500 to-teal-600"
                            },
                            {
                                icon: <FileCheck className="w-8 h-8" />,
                                title: t('landing.features.reporting.title', 'فواتير معتمدة'),
                                desc: t('landing.features.reporting.desc', 'فواتير إلكترونية متوافقة بالكامل مع متطلبات هيئة الزكاة.'),
                                color: "from-blue-500 to-blue-600"
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredFeature(i)}
                                onMouseLeave={() => setHoveredFeature(null)}
                                className="group relative bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-md`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 bg-white border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                                <span className="font-bold text-sm">A</span>
                            </div>
                            <span className="text-lg font-black text-gray-800">دفتر المحاسب</span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                            © {new Date().getFullYear()} دفتر المحاسب. جميع الحقوق محفوظة.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
