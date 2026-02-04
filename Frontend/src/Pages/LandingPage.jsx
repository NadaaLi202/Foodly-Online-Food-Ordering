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

const LandingPage = () => {
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
            <nav className="fixed w-full z-50 bg-slate-950/70 backdrop-blur-xl border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50 group-hover:shadow-indigo-500/100 transition-all duration-300">
                                <BarChart3 className="text-white w-6 h-6" />
                            </div>
                            <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400 tracking-tight hover:from-indigo-300 hover:to-violet-300 transition-all duration-300">
                                Dafater
                            </span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                Features
                            </a>
                            <a href="#benefits" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                Why Us
                            </a>
                            <a href="#pricing" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors underline-animated">
                                Pricing
                            </a>
                            <div className="h-6 w-px bg-gray-700"></div>

                            {isLoggedIn ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-all"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                                            A
                                        </div>
                                        <span className="text-sm font-semibold text-gray-300">Ahmed</span>
                                    </button>

                                    {isProfileOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                                            <div className="p-4 border-b border-gray-700">
                                                <p className="text-sm font-semibold text-white">Ahmed</p>
                                                <p className="text-xs text-gray-400">ahmed@example.com</p>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300 text-sm">
                                                    <Settings className="w-4 h-4" />
                                                    Settings
                                                </button>
                                                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-300 text-sm">
                                                    <Bell className="w-4 h-4" />
                                                    Notifications
                                                </button>
                                                <button
                                                    onClick={handleSignout}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium border-t border-gray-700 mt-2 pt-3"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-indigo-400 transition-colors">
                                        Log in
                                    </Link>
                                    <button
                                        onClick={handleLogin}
                                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 duration-300"
                                    >
                                        Sign up free
                                    </button>
                                </>
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
                            <a href="#features" onClick={closeMenu} className="text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors">Features</a>
                            <a href="#benefits" onClick={closeMenu} className="text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors">Why Us</a>
                            <a href="#pricing" onClick={closeMenu} className="text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors">Pricing</a>
                            <hr className="border-gray-700 my-2" />

                            {isLoggedIn ? (
                                <>
                                    <div className="px-4 py-3 bg-gray-800/50 rounded-lg">
                                        <p className="text-sm font-semibold text-white">Ahmed</p>
                                        <p className="text-xs text-gray-400">ahmed@example.com</p>
                                    </div>
                                    <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 text-sm">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </button>
                                    <button
                                        onClick={handleSignout}
                                        className="w-full flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium border-t border-gray-700 mt-2 pt-3"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={closeMenu} className="text-base font-semibold text-gray-300 py-2 hover:text-indigo-400 transition-colors">Log in</Link>
                                    <button
                                        onClick={() => {
                                            handleLogin();
                                            closeMenu();
                                        }}
                                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all"
                                    >
                                        Sign up free
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-24 lg:pt-48 lg:pb-32 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
                            </span>
                            ✨ AI-Powered Analytics Platform
                        </div>

                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards">
                            Accounting
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
                                Made Simple
                            </span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-xl text-gray-300 leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-backwards">
                            Manage invoices, track inventory, and analyze your business finances—all in one intelligent platform built for modern businesses.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 animate-in fade-in slide-in-from-bottom-16 duration-700 fill-mode-backwards">
                            <button
                                onClick={handleLogin}
                                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-lg font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 duration-300 flex items-center justify-center gap-2 group"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a
                                href="#features"
                                className="w-full sm:w-auto px-8 py-4 bg-gray-800/50 border border-gray-700 hover:border-indigo-500/50 text-gray-100 text-lg font-bold rounded-xl hover:bg-gray-800/80 transition-all flex items-center justify-center gap-2"
                            >
                                Watch Demo
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        {[
                                            { label: 'Revenue', value: '$124K', icon: '📈' },
                                            { label: 'Invoices', value: '1,234', icon: '📄' },
                                            { label: 'Growth', value: '+32%', icon: '⚡' }
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-600/30 rounded-lg p-4 backdrop-blur hover:border-gray-600/60 transition-all duration-300 cursor-pointer">
                                                <div className="text-2xl mb-2">{stat.icon}</div>
                                                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                                <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Chart Area */}
                                    <div className="flex-1 bg-gradient-to-br from-gray-700/20 to-gray-800/20 border border-gray-600/20 rounded-lg flex items-end justify-around px-4 py-6">
                                        {[65, 78, 90, 72, 85, 95, 88].map((h, i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                                                <div className="w-8 bg-gradient-to-t from-indigo-500 to-violet-500 rounded-t group-hover:from-indigo-400 group-hover:to-violet-400 transition-all duration-300 shadow-lg shadow-indigo-500/30" style={{ height: `${h * 2}px` }}></div>
                                                <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">W{i + 1}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Cards */}
                        <div className="absolute -right-6 top-1/4 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-gray-700 hidden lg:block hover:shadow-3xl transition-shadow duration-300" style={{ animation: 'bounce 3s infinite' }}>
                            <div className="flex items-center gap-3 w-max">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                                    <CheckCircle className="text-green-400 w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Invoice Paid</p>
                                    <p className="text-sm font-bold text-white">$1,250</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -left-6 bottom-1/3 p-4 bg-slate-800 rounded-2xl shadow-2xl border border-gray-700 hidden lg:block hover:shadow-3xl transition-shadow duration-300" style={{ animation: 'bounce 4s infinite' }}>
                            <div className="flex items-center gap-3 w-max">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                                    <TrendingUp className="text-indigo-400 w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Growth</p>
                                    <p className="text-sm font-bold text-white">+124% Boost</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-block px-4 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                            Features
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
                            Everything you need to grow
                        </h2>
                        <p className="text-xl text-gray-400">
                            Powerful tools designed specifically for modern accounting needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: <Globe2 className="w-8 h-8" />,
                                title: "Cloud-Based Platform",
                                desc: "Access your accounts anywhere, anytime with enterprise-grade cloud infrastructure.",
                                color: "from-indigo-500 to-indigo-600"
                            },
                            {
                                icon: <Lock className="w-8 h-8" />,
                                title: "Bank-Grade Security",
                                desc: "Military-grade encryption with compliance certifications for total peace of mind.",
                                color: "from-violet-500 to-violet-600"
                            },
                            {
                                icon: <TrendingUp className="w-8 h-8" />,
                                title: "Real-time Analytics",
                                desc: "Powerful dashboards with instant insights into your business performance.",
                                color: "from-pink-500 to-pink-600"
                            },
                            {
                                icon: <Cpu className="w-8 h-8" />,
                                title: "AI-Powered Insights",
                                desc: "Smart recommendations and automation to save time on routine tasks.",
                                color: "from-cyan-500 to-cyan-600"
                            },
                            {
                                icon: <Users className="w-8 h-8" />,
                                title: "Team Collaboration",
                                desc: "Work together seamlessly with role-based access and real-time updates.",
                                color: "from-emerald-500 to-emerald-600"
                            },
                            {
                                icon: <FileCheck className="w-8 h-8" />,
                                title: "Smart Reporting",
                                desc: "Generate professional reports automatically with customizable formats.",
                                color: "from-orange-500 to-orange-600"
                            }
                        ].map((feature, i) => (
                            <div
                                key={i}
                                onMouseEnter={() => setHoveredFeature(i)}
                                onMouseLeave={() => setHoveredFeature(null)}
                                className="group relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 rounded-xl border border-gray-700/50 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer hover:-translate-y-2"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-xl opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-indigo-500/20`}>
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
            <section id="benefits" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block px-4 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
                                Why Dafater
                            </div>
                            <h2 className="text-4xl font-black text-white mb-6">
                                Built for the future of business
                            </h2>
                            <p className="text-xl text-gray-400 mb-8">
                                Join thousands of businesses that have transformed their operations with Dafater's intelligent accounting solution.
                            </p>

                            <ul className="space-y-4 mb-8">
                                {[
                                    "Automate repetitive tasks and focus on growth",
                                    "Get insights faster with AI-powered analytics",
                                    "Scale without limits—from startup to enterprise",
                                    "Integrate with your favorite tools seamlessly"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 group">
                                        <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300" />
                                        <span className="text-lg text-gray-300 group-hover:text-gray-100 transition-colors">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={handleLogin}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 duration-300 flex items-center gap-2 group"
                            >
                                Get Started Now
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur-3xl opacity-20"></div>
                            <div className="relative bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700">
                                <div className="space-y-6">
                                    {[
                                        { number: '10K+', label: 'Active Users' },
                                        { number: '$2B+', label: 'Processed Annually' },
                                        { number: '99.9%', label: 'Uptime' },
                                        { number: '24/7', label: 'Support' }
                                    ].map((stat, i) => (
                                        <div key={i} className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-700 transition-all duration-300 cursor-pointer hover:bg-gray-800/70">
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
            <section id="pricing" className="py-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-block px-4 py-1 bg-violet-500/10 border border-violet-500/30 rounded-full text-violet-300 text-xs font-bold uppercase tracking-widest mb-6">
                            Pricing
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-xl text-gray-400">
                            Choose the perfect plan for your business needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Starter",
                                price: "$29",
                                description: "Perfect for small businesses",
                                features: ["Up to 100 invoices/month", "Basic analytics", "Email support", "Cloud storage 10GB"],
                                highlight: false
                            },
                            {
                                name: "Professional",
                                price: "$79",
                                description: "For growing businesses",
                                features: ["Unlimited invoices", "Advanced analytics", "Priority support", "Cloud storage 100GB", "Team collaboration", "API access"],
                                highlight: true
                            },
                            {
                                name: "Enterprise",
                                price: "Custom",
                                description: "For large organizations",
                                features: ["Everything in Pro", "Custom integrations", "Dedicated support", "Unlimited storage", "Advanced security", "Training included"],
                                highlight: false
                            }
                        ].map((plan, i) => (
                            <div
                                key={i}
                                className={`relative rounded-2xl p-8 border transition-all duration-300 ${plan.highlight
                                    ? 'bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 md:scale-105'
                                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-gray-700/50 hover:border-gray-600 hover:shadow-xl hover:shadow-gray-800/30'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                                <div className="mb-8">
                                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                        {plan.price}
                                    </span>
                                    {plan.price !== "Custom" && (
                                        <span className="text-gray-400 text-sm">/month</span>
                                    )}
                                </div>

                                <button
                                    onClick={handleLogin}
                                    className={`w-full py-3 rounded-lg font-bold transition-all duration-300 mb-8 ${plan.highlight
                                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/30'
                                        : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800'
                                        }`}
                                >
                                    Get Started
                                </button>

                                <ul className="space-y-3">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-3 text-gray-300">
                                            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-12 md:p-16 text-center overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300">
                        <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
                        </div>

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                                Ready to transform your business?
                            </h2>
                            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
                                Join thousands of businesses automating their accounting with Dafater. Free 14-day trial, no credit card required.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={handleLogin}
                                    className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-300 flex items-center gap-2 group"
                                >
                                    Start Free Trial
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <a
                                    href="#features"
                                    className="px-8 py-4 border-2 border-white text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300"
                                >
                                    Schedule Demo
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-gray-800 py-16 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
                                    <BarChart3 className="text-white w-5 h-5" />
                                </div>
                                <span className="text-xl font-bold text-white">Dafater</span>
                            </div>
                            <p className="text-gray-400">Your accounting, simplified & smarter.</p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Product</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Features</a></li>
                                <li><a href="#pricing" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Pricing</a></li>
                                <li><a href="#benefits" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Security</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Company</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">About</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Blog</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Careers</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Privacy</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Terms</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors underline-animated">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} Dafater Inc. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors hover:scale-110 duration-300">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-7.104 3.749 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                            </a>
                            <a href="#" className="text-gray-400 hover:text-indigo-400 transition-colors hover:scale-110 duration-300">
                                <span className="sr-only">GitHub</span>
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.547 2.914 1.186.092-.923.35-1.547.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.270.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.195 22 16.44 22 12.017 22 6.484 17.523 2 12 2z" clipRule="evenodd" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
