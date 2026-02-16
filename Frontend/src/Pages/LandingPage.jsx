import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    ArrowRight,
    BarChart3,
    ShieldCheck,
    Globe2,
    Zap,
    Menu,
    X,
    TrendingUp,
    Lock,
    Cpu,
    FileCheck,
    Users,
    Settings,
    LogOut,
    Bell
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [hoveredFeature, setHoveredFeature] = React.useState(null);
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);

    const closeMenu = () => setIsMenuOpen(false);

    const handleSignout = () => {
        // محاكاة تسجيل الخروج
        setIsLoggedIn(false);
        setIsProfileOpen(false);
        localStorage.removeItem('user');
        navigate('/');
        window.location.reload();
    };

    const handleLogin = () => {
        // محاكاة تسجيل الدخول
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify({ name: 'Ahmed', email: 'ahmed@example.com' }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans text-gray-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden">

            {/* Animated Background - Blobs */}
            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .underline-animated {
                    position: relative;
                }
                
                .underline-animated::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 0;
                    height: 2px;
                    background: linear-gradient(to right, #4f46e5, #7c3aed);
                    transition: width 0.3s ease;
                }
                
                .underline-animated:hover::after {
                    width: 100%;
                }
            `}</style>

            <div className="fixed inset-0 z-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl animate-blob opacity-20"></div>
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000 opacity-20"></div>
                <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000 opacity-20"></div>
            </div>

            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-gray-800" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to="/" className={`flex items-center gap-3 group ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:shadow-indigo-500/100 transition-all duration-300">
                                <BarChart3 className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 tracking-tight hover:from-indigo-300 hover:to-violet-300 transition-all duration-300">
                                {t('app_name', 'Dafater')}
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className={`hidden md:flex items-center gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                {t('landing.nav.features')}
                            </a>
                            <a href="#benefits" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                {t('landing.nav.why_us')}
                            </a>
                            <a href="#pricing" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                {t('landing.nav.pricing')}
                            </a>
                            <div className="h-6 w-px bg-gray-700"></div>

                            {isLoggedIn ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                                            A
                                        </div>
                                        <span className="text-sm font-semibold text-gray-300">Ahmed</span>
                                    </button>

                                    {isProfileOpen && (
                                        <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-48 bg-slate-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden`}>
                                            <div className="p-4 border-b border-gray-700">
                                                <p className={`text-sm font-semibold text-white ${isRtl ? 'text-right' : 'text-left'}`}>Ahmed</p>
                                                <p className={`text-xs text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>ahmed@example.com</p>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300 text-sm ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                                    <Settings className="w-4 h-4" />
                                                    {t('landing.nav.settings')}
                                                </button>
                                                <button className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300 text-sm ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                                    <Bell className="w-4 h-4" />
                                                    {t('landing.nav.notifications')}
                                                </button>
                                                <button
                                                    onClick={handleSignout}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium border-t border-gray-700 mt-2 pt-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    {t('landing.nav.sign_out')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors">
                                        {t('landing.nav.log_in')}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-gray-300 hover:text-indigo-400 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-slate-900/90 backdrop-blur-xl border-t border-gray-800 absolute w-full px-4 py-6 shadow-2xl">
                        <div className="flex flex-col gap-4">
                            <a href="#features" onClick={closeMenu} className={`text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>{t('landing.nav.features')}</a>
                            <a href="#benefits" onClick={closeMenu} className={`text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>{t('landing.nav.why_us')}</a>
                            <a href="#pricing" onClick={closeMenu} className={`text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>{t('landing.nav.pricing')}</a>
                            <hr className="border-gray-700 my-2" />

                            {isLoggedIn ? (
                                <>
                                    <div className={`px-4 py-3 bg-gray-800/50 rounded-lg ${isRtl ? 'text-right' : 'text-left'}`}>
                                        <p className="text-sm font-semibold text-white">Ahmed</p>
                                        <p className="text-xs text-gray-400">ahmed@example.com</p>
                                    </div>
                                    <button className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 text-sm ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                                        <Settings className="w-4 h-4" />
                                        {t('landing.nav.settings')}
                                    </button>
                                    <button
                                        onClick={handleSignout}
                                        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium border-t border-gray-700 mt-2 pt-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('landing.nav.sign_out')}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={closeMenu} className={`text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>{t('landing.nav.log_in')}</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-24 lg:pt-48 lg:pb-32 relative z-10" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`text-center mb-12 ${isRtl ? 'text-right' : 'text-center'}`}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                            </span>
                            {t('landing.hero.ai_powered')}
                        </div>

                        <h1 className={`text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards ${isRtl ? 'text-right' : 'text-center'}`}>
                            {t('landing.hero.accounting')}
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
                                {t('landing.hero.made_simple')}
                            </span>
                        </h1>

                        <p className={`max-w-2xl mx-auto text-xl text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-backwards ${isRtl ? 'text-right' : 'text-center'}`}>
                            {t('landing.hero.description')}
                        </p>

                        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-16 duration-700 fill-mode-backwards ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => navigate('/login')}
                                className={`w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 duration-300 flex items-center justify-center gap-2 group ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                {t('landing.hero.get_started')}
                                <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                            </button>
                            <a
                                href="#features"
                                className="w-full sm:w-auto px-8 py-4 bg-gray-800/50 border border-gray-700 hover:border-indigo-500/50 text-gray-100 text-lg font-bold rounded-xl hover:bg-gray-800/80 transition-all flex items-center justify-center gap-2"
                            >
                                {t('landing.hero.watch_demo')}
                            </a>
                        </div>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="mt-20 relative group animate-in fade-in duration-1000 fill-mode-backwards">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 border border-gray-700 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
                            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden aspect-[16/9]">
                                <div className="w-full h-full flex flex-col p-6 md:p-8">
                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-700">
                                        <div className="space-y-2">
                                            <div className="h-6 w-40 bg-gradient-to-r from-indigo-500 to-violet-500 rounded opacity-20"></div>
                                            <div className="h-4 w-60 bg-gray-600 rounded opacity-30"></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors cursor-pointer"></div>
                                            <div className="h-10 w-10 rounded-full bg-violet-500/20 border border-violet-500/30 hover:bg-violet-500/30 transition-colors cursor-pointer"></div>
                                        </div>
                                    </div>

                                    {/* Stats Cards */}
                                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {[
                                            { label: t('landing.stats.revenue'), value: '$124K', icon: '📈' },
                                            { label: t('landing.stats.invoices'), value: '1,234', icon: '📄' },
                                            { label: t('landing.stats.growth'), value: '+32%', icon: '⚡' }
                                        ].map((stat, i) => (
                                            <div key={i} className={`bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 rounded-lg p-4 backdrop-blur hover:border-gray-600/60 transition-all duration-300 cursor-pointer ${isRtl ? 'text-right' : 'text-left'}`}>
                                                <div className="text-2xl mb-2">{stat.icon}</div>
                                                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart Area */}
                                    <div className={`flex-1 bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/20 rounded-lg flex items-end justify-around px-4 py-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {[65, 78, 90, 72, 85, 95, 88].map((h, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                                <div className="w-8 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300 shadow-lg shadow-indigo-500/30" style={{ height: `${h * 2}px` }}></div>
                                                <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{isRtl ? `أسبوع ${i + 1}` : `W${i + 1}`}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <div className={`absolute ${isRtl ? '-left-6' : '-right-6'} top-1/4 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-gray-700 hidden lg:block hover:shadow-3xl transition-shadow duration-300`} style={{ animation: 'bounce 3s infinite' }}>
                            <div className={`flex items-center gap-3 w-max ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                                    <CheckCircle className="text-green-400 w-5 h-5" />
                                </div>
                                <div className={isRtl ? 'text-right' : 'text-left'}>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">{t('landing.demo.invoice_paid')}</p>
                                    <p className="text-sm font-bold text-white">$1,250</p>
                                </div>
                            </div>
                        </div>
                        <div className={`absolute ${isRtl ? '-right-6' : '-left-6'} bottom-1/3 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-gray-700 hidden lg:block hover:shadow-3xl transition-shadow duration-300`} style={{ animation: 'bounce 4s infinite' }}>
                            <div className={`flex items-center gap-3 w-max ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                                    <TrendingUp className="text-indigo-400 w-5 h-5" />
                                </div>
                                <div className={isRtl ? 'text-right' : 'text-left'}>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">{t('landing.demo.growth')}</p>
                                    <p className="text-sm font-bold text-white">{t('landing.demo.growth_boost')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10" dir={isRtl ? 'rtl' : 'ltr'} >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                            {t('landing.features.title')}
                        </div>
                        <h2 className={`text-4xl md:text-5xl font-black text-white mb-6 tracking-tight ${isRtl ? 'text-right' : 'text-center'}`}>
                            {t('landing.features.header')}
                        </h2>
                        <p className={`text-xl text-gray-400 ${isRtl ? 'text-right' : 'text-center'}`}>
                            {t('landing.features.subheader')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Globe2 className="w-8 h-8" />,
                                title: t('landing.features.cloud.title'),
                                desc: t('landing.features.cloud.desc'),
                                color: "from-indigo-500 to-indigo-600"
                            },
                            {
                                icon: <Lock className="w-8 h-8" />,
                                title: t('landing.features.security.title'),
                                desc: t('landing.features.security.desc'),
                                color: "from-violet-500 to-violet-600"
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8" />,
                                title: t('landing.features.analytics.title'),
                                desc: t('landing.features.analytics.desc'),
                                color: "from-pink-500 to-pink-600"
                            },
                            {
                                icon: <Cpu className="w-8 h-8" />,
                                title: t('landing.features.ai.title'),
                                desc: t('landing.features.ai.desc'),
                                color: "from-cyan-500 to-cyan-600"
                            },
                            {
                                icon: <Users className="w-8 h-8" />,
                                title: t('landing.features.collaboration.title'),
                                desc: t('landing.features.collaboration.desc'),
                                color: "from-emerald-500 to-emerald-600"
                            },
                            {
                                icon: <FileCheck className="w-8 h-8" />,
                                title: t('landing.features.reporting.title'),
                                desc: t('landing.features.reporting.desc'),
                                color: "from-orange-500 to-orange-600"
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredFeature(i)}
                                onMouseLeave={() => setHoveredFeature(null)}
                                className={`group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer hover:-translate-y-2 ${isRtl ? 'text-right' : 'text-left'}`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/20 ${isRtl ? 'mr-0' : 'ml-0'}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 relative z-10" dir={isRtl ? 'rtl' : 'ltr'} >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                            <div className="inline-block px-4 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
                                {t('landing.benefits.tag')}
                            </div>
                            <h2 className="text-4xl font-black text-white mb-6">
                                {t('landing.benefits.title')}
                            </h2>
                            <p className="text-xl text-gray-400 mb-8">
                                {t('landing.benefits.desc')}
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    t('landing.benefits.automated_tasks'),
                                    t('landing.benefits.faster_insights'),
                                    t('landing.benefits.scale_without_limits'),
                                    t('landing.benefits.integrate_seamlessly')
                                ].map((item, i) => (
                                    <li key={i} className={`flex items-start gap-3 group ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                                        <span className={`text-lg text-gray-300 group-hover:text-gray-100 transition-colors ${isRtl ? 'text-right' : 'text-left'}`}>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => navigate('/login')}
                                className={`px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 duration-300 flex items-center gap-2 group ${isRtl ? 'flex-row-reverse' : ''}`}
                            >
                                {t('landing.hero.get_started')}
                                <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-3xl opacity-20"></div>
                            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
                                <div className="space-y-6">
                                    {[
                                        { number: '10K+', label: t('landing.stats.active_users') },
                                        { number: '$2B+', label: t('landing.stats.processed_annually') },
                                        { number: '99.9%', label: t('landing.stats.uptime') },
                                        { number: '24/7', label: t('landing.stats.support') }
                                    ].map((stat, i) => (
                                        <div key={i} className={`p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-700 transition-all duration-300 cursor-pointer hover:bg-gray-800/70 ${isRtl ? 'text-right' : 'text-left'}`}>
                                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 mb-1">
                                                {stat.number}
                                            </p>
                                            <p className="text-gray-400 font-medium">{stat.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 relative z-10" dir={isRtl ? 'rtl' : 'ltr'} >
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`text-center max-w-3xl mx-auto mb-20 ${isRtl ? 'text-right' : 'text-center'}`}>
                        <div className="inline-block px-4 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
                            {t('landing.pricing.tag')}
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                            {t('landing.pricing.title')}
                        </h2>
                        <p className="text-xl text-gray-400">
                            {t('landing.pricing.desc')}
                        </p>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {[
                            {
                                name: t('landing.pricing.plans.starter.name'),
                                price: t('landing.pricing.plans.starter.price'),
                                description: t('landing.pricing.plans.starter.desc'),
                                features: t('landing.pricing.features_starter', { returnObjects: true }),
                                highlight: false
                            },
                            {
                                name: t('landing.pricing.plans.professional.name'),
                                price: t('landing.pricing.plans.professional.price'),
                                description: t('landing.pricing.plans.professional.desc'),
                                features: t('landing.pricing.features_professional', { returnObjects: true }),
                                highlight: true
                            },
                            {
                                name: t('landing.pricing.plans.enterprise.name'),
                                price: t('landing.pricing.plans.enterprise.price'),
                                description: t('landing.pricing.plans.enterprise.desc'),
                                features: t('landing.pricing.features_enterprise', { returnObjects: true }),
                                highlight: false
                            }
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`relative rounded-2xl p-8 border transition-all duration-300 ${plan.highlight
                                    ? 'bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 md:scale-105'
                                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-600 hover:shadow-xl hover:shadow-gray-800/30'
                                    } ${isRtl ? 'text-right' : 'text-left'}`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full">
                                        {t('landing.pricing.most_popular')}
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                                <div className={`mb-8 ${isRtl ? 'flex flex-row-reverse justify-end items-baseline gap-1' : ''}`}>
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                        {plan.price}
                                    </span>
                                    {plan.price !== "Custom" && plan.price !== "اتصل بنا" && (
                                        <span className="text-gray-400 text-sm">{t('landing.pricing.month')}</span>
                                    )}
                                </div>

                                <button
                                    onClick={() => navigate('/login')}
                                    className={`w-full py-3 rounded-lg font-bold transition-all duration-300 mb-8 ${plan.highlight
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30'
                                        : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800'
                                        }`}
                                >
                                    {t('landing.pricing.get_started')}
                                </button>

                                <ul className="space-y-3">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className={`flex items-center gap-3 text-gray-300 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                            <span className={`text-sm ${isRtl ? 'text-right' : 'text-left'}`}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10" dir={isRtl ? 'rtl' : 'ltr'} >
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300">
                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                                {t('landing.cta.title')}
                            </h2>
                            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                                {t('landing.cta.desc')}
                            </p>
                            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <button
                                    onClick={() => navigate('/login')}
                                    className={`px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-300 flex items-center gap-2 group ${isRtl ? 'flex-row-reverse' : ''}`}
                                >
                                    {t('landing.cta.get_started')}
                                    <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
                                </button>
                                <a
                                    href="#features"
                                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300"
                                >
                                    {t('landing.cta.schedule_demo')}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 bg-slate-950 border-t border-gray-900 relative z-10" dir={isRtl ? 'rtl' : 'ltr'} >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                        <div className="col-span-2 lg:col-span-2">
                            <Link to="/" className={`flex items-center gap-3 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                    <BarChart3 className="text-white w-6 h-6" />
                                </div>
                                <span className="text-2xl font-black text-white tracking-tight">{t('app_name', 'Dafater')}</span>
                            </Link>
                            <p className={`text-gray-400 max-w-xs leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('landing.footer.slogan')}
                            </p>
                        </div>

                        <div className={isRtl ? 'text-right' : 'text-left'}>
                            <h4 className="text-white font-bold mb-6 italic">{t('landing.footer.product')}</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#features" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.nav.features')}</a></li>
                                <li><a href="#pricing" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.nav.pricing')}</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.about')}</a></li>
                            </ul>
                        </div>

                        <div className={isRtl ? 'text-right' : 'text-left'}>
                            <h4 className="text-white font-bold mb-6 italic">{t('landing.footer.company')}</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.blog')}</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.careers')}</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.contact')}</a></li>
                            </ul>
                        </div>

                        <div className={isRtl ? 'text-right' : 'text-left'}>
                            <h4 className="text-white font-bold mb-6 italic">{t('landing.footer.legal')}</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.privacy')}</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors uppercase text-sm font-black tracking-widest">{t('landing.footer.terms')}</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-500 text-sm font-medium">
                            © {new Date().getFullYear()} {t('app_name', 'Dafater')} Inc. {t('landing.footer.rights')}
                        </p>
                        <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-all font-black text-xs uppercase tracking-tighter">Twitter</a>
                            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-all font-black text-xs uppercase tracking-tighter">LinkedIn</a>
                            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-all font-black text-xs uppercase tracking-tighter">GitHub</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
