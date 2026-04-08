import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    CheckCircle, BarChart3, Users, Settings, Lock,
    Play, Pause, RotateCcw, MousePointer2, FileText, Wallet, Bell
} from 'lucide-react';

const AnimatedDemo = () => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    // CSS for all animations
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes demoLoop {
                0%, 16.6% { --step: 0; }
                16.6%, 33.3% { --step: 1; }
                33.3%, 58.3% { --step: 2; }
                58.3%, 83.3% { --step: 3; }
                83.3%, 100% { --step: 4; }
            }

            @keyframes moveGrid {
                0% { background-position: 0 0; }
                100% { background-position: 30px 30px; }
            }

            .demo-grid-bg {
                position: absolute;
                inset: 0;
                background-image: 
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                background-size: 30px 30px;
                animation: moveGrid 20s linear infinite;
                z-index: 0;
                pointer-events: none;
            }

            .demo-container {
                animation: ${isPlaying ? 'demoLoop 12s infinite linear' : 'none'};
            }

            .demo-progress-bar {
                animation: ${isPlaying ? 'progressAnim 12s infinite linear' : 'none'};
                /* Fix: fill from Left to Right by setting origin to left */
                transform-origin: left; 
            }

            @keyframes progressAnim {
                0% { transform: scaleX(0); }
                100% { transform: scaleX(1); }
            }

            /* Step 1: Dashboard */
            .demo-dashboard { opacity: 0; transition: opacity 0.3s; pointer-events: none; }
            .demo-container[style*="--step: 0"] .demo-dashboard,
            .demo-container:not([style]) .demo-dashboard { opacity: 1; pointer-events: auto; }

            /* Step 2: Invoice List */
            .demo-invoice-list { transform: translateX(100%); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; }
            .demo-container[style*="--step: 1"] .demo-invoice-list,
            .demo-container[style*="--step: 2"] .demo-invoice-list,
            .demo-container[style*="--step: 3"] .demo-invoice-list,
            .demo-container[style*="--step: 4"] .demo-invoice-list { transform: translateX(0); opacity: 1; z-index: 10; }

            /* Step 3: Create form */
            .demo-create-form { transform: translateY(100%); transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; }
            .demo-container[style*="--step: 2"] .demo-create-form { transform: translateY(0); opacity: 1; z-index: 20; }

            /* Step 4: Preview */
            .demo-preview { transform: scale(0.95); opacity: 0; transition: all 0.5s; pointer-events: none; }
            .demo-container[style*="--step: 3"] .demo-preview,
            .demo-container[style*="--step: 4"] .demo-preview { transform: scale(1); opacity: 1; pointer-events: auto; z-index: 30; }

            /* Step 5: Success */
            /* Fix: Only show at the very end of step 4 (after clicking send in the animation timeline), and fade out right before the loop restarts */
            @keyframes successFlash {
                0%, 85% { opacity: 0; visibility: hidden; }
                88%, 95% { opacity: 1; visibility: visible; }
                100% { opacity: 0; visibility: hidden; }
            }
            .demo-success-overlay { 
                opacity: 0; 
                visibility: hidden;
                pointer-events: none;
                animation: ${isPlaying ? 'successFlash 12s infinite linear' : 'none'};
            }
            .demo-success-check { transform: scale(0); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            /* This syncs the checkmark pop with the overlay visibility */
            @keyframes checkPop {
                0%, 85% { transform: scale(0); }
                88%, 95% { transform: scale(1); }
                100% { transform: scale(0); }
            }
            .demo-success-check {
                animation: ${isPlaying ? 'checkPop 12s infinite linear' : 'none'};
            }

            /* Cursor */
            .demo-cursor {
                position: absolute;
                width: 20px;
                height: 20px;
                z-index: 50;
                transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
            }
            .demo-container[style*="--step: 1"] .demo-cursor { opacity: 1; top: 20%; left: 80%; }
            .demo-container[style*="--step: 2"] .demo-cursor { opacity: 1; top: 25%; left: 30%; transform: scale(0.9); }
            .demo-container[style*="--step: 3"] .demo-cursor { opacity: 1; top: 85%; left: 50%; }
            .demo-container[style*="--step: 4"] .demo-cursor { opacity: 1; top: 90%; left: 50%; transform: scale(0.9); }

            @keyframes typing1 { 0%, 50% { width: 0; border-color: transparent; } 70%, 100% { width: 100%; border-color: #666; } }
            .demo-type-1 { display: inline-block; overflow: hidden; white-space: nowrap; border-left: 2px solid transparent; width: 0; animation: ${isPlaying ? 'typing1 12s infinite linear' : 'none'}; }
            
            @keyframes pulse-btn {
                0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); }
                70% { box-shadow: 0 0 0 15px rgba(79, 70, 229, 0); }
                100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
            }
            .btn-pulse { animation: pulse-btn 2s infinite; }
            
            @keyframes confetti-fall {
                0%, 85% { transform: translateY(-100%) rotate(0deg); opacity: 0; }
                88% { opacity: 1; }
                100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
            }
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                top: -10px;
                animation: ${isPlaying ? 'confetti-fall 12s infinite linear' : 'none'};
                opacity: 0;
            }
        `;
        document.head.appendChild(style);

        const interval = setInterval(() => {
            if (isPlaying) {
                setCurrentStep(prev => (prev + 1) % 5);
            }
        }, 12000 / 5);

        return () => {
            document.head.removeChild(style);
            clearInterval(interval);
        };
    }, [isPlaying]);

    const handleRestart = () => {
        setIsPlaying(false);
        setCurrentStep(0);
        setTimeout(() => setIsPlaying(true), 50);
    };

    // The steps array is now logical: 0=Create, 1=Customer, 2=Product, 3=Preview, 4=Send
    const steps = ['إنشاء فاتورة', 'إضافة عميل', 'إضافة منتج', 'معاينة', 'إرسال'];

    // Generate random confetti
    const confettiElements = Array.from({ length: 40 }).map((_, i) => {
        const left = Math.random() * 100;
        const color = ['#FF5F57', '#FFBD2E', '#28CA41', '#4F46E5', '#00BCD4'][Math.floor(Math.random() * 5)];
        // The animation is now defined in the stylesheet to loop with the timeline
        return (
            <div
                key={i}
                className="confetti"
                style={{
                    left: `${left}%`,
                    backgroundColor: color,
                    animationDelay: `${Math.random() * 0.5}s`
                }}
            />
        );
    });

    return (
        <section className="py-[100px] relative z-10 overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
            dir="rtl">
            <div className="demo-grid-bg"></div>

            <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                {/* Header Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-600/30 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
                    <span className="text-white text-xs font-bold leading-none tracking-wider">🎬 معاينة مباشرة</span>
                </div>

                {/* Main Title */}
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                    شاهد النظام وهو <span className="text-[#00BCD4]">يعمل</span>
                </h2>
                <p className="text-white/70 text-base md:text-lg mb-12 max-w-2xl mx-auto">
                    تجربة تفاعلية حقيقية — من إنشاء الفاتورة حتى الإرسال
                </p>

                {/* Main Demo Frame */}
                {/* Desktop/Tablet animated frame */}
                <div className="hidden md:block w-full relative bg-[#1e1e2e] overflow-hidden rounded-xl mb-8 mx-auto"
                    style={{
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 30px 80px rgba(79,70,229,0.4), 0 0 120px rgba(79,70,229,0.15)'
                    }}>

                    {/* Browser Top Bar */}
                    <div className="h-[40px] bg-[#1e1e2e] flex items-center px-4 relative z-50 rounded-t-xl border-b border-white/5">
                        <div className="flex gap-2 w-1/3">
                            <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
                        </div>
                        <div className="w-1/3 flex justify-center">
                            <div className="bg-[#2a2a3e] rounded-full px-8 py-1.5 text-xs text-gray-400 font-medium flex items-center justify-center gap-2 w-full max-w-[250px]">
                                <Lock size={12} className="text-gray-500" />
                                <span dir="ltr">app.daftar-almohaseb.com</span>
                            </div>
                        </div>
                        <div className="w-1/3"></div>
                    </div>

                    {/* App Content Area */}
                    <div className="relative h-[550px] text-right overflow-hidden demo-container bg-[#f8fafc]" style={{ '--step': currentStep }}>

                        {confettiElements}

                        {/* Fake Cursor */}
                        <div className="demo-cursor drop-shadow-md">
                            <MousePointer2 className="w-6 h-6 fill-white text-gray-800" />
                        </div>

                        {/* Base Dashboard Layout */}
                        <div className="absolute inset-0 flex bg-[#f8fafc]">
                            {/* Sidebar */}
                            <div className="w-[80px] lg:w-[220px] bg-[#0f172a] text-white flex flex-col relative z-20">
                                <div className="p-4 lg:p-6 font-black text-xl flex items-center justify-center lg:justify-start gap-3 border-b border-white/5">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">A</div>
                                    <span className="hidden lg:block text-white/90">دفاتر المحاسب</span>
                                </div>
                                <div className="p-3 lg:p-4 space-y-2 text-sm flex-1">
                                    <div className={`p-3 rounded-xl flex items-center justify-center lg:justify-start gap-3 ${currentStep === 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md font-bold' : 'text-gray-400'}`}>
                                        <BarChart3 size={18} /> <span className="hidden lg:block">الرئيسية</span>
                                    </div>
                                    <div className={`p-3 rounded-xl flex items-center justify-center lg:justify-start gap-3 transition-colors ${currentStep > 0 ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md font-bold text-white' : 'text-gray-400'}`}>
                                        <FileText size={18} /> <span className="hidden lg:block">الفواتير</span>
                                    </div>
                                    <div className="p-3 rounded-xl flex items-center justify-center lg:justify-start gap-3 text-gray-400"><Users size={18} /> <span className="hidden lg:block">العملاء</span></div>
                                    <div className="p-3 rounded-xl flex items-center justify-center lg:justify-start gap-3 text-gray-400"><Settings size={18} /> <span className="hidden lg:block">الإعدادات</span></div>
                                </div>
                                <div className="p-4 border-t border-white/5 flex items-center justify-center lg:justify-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-600 shrink-0 border border-white/20"></div>
                                    <div className="hidden lg:block">
                                        <p className="text-xs font-bold text-white">أحمد محمد</p>
                                        <p className="text-[10px] text-gray-400">مدير النظام</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                                {/* Top Navbar */}
                                <div className="h-[60px] bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10">
                                    <div className="bg-gray-100 rounded-full px-4 py-1.5 text-xs text-gray-400 flex items-center gap-2 w-64">
                                        <span>🔍</span> بحث...
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <div className="relative"><Bell size={18} /><div className="w-2 h-2 rounded-full bg-red-500 absolute -top-1 -right-1"></div></div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 p-6 relative">

                                    {/* Header */}
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-2xl font-black text-slate-800">
                                            {currentStep === 0 ? 'لوحة التحكم' : 'الفواتير'}
                                        </h3>
                                        {currentStep > 0 && currentStep < 3 && (
                                            <button className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md hover:bg-indigo-700">
                                                <span className="text-lg leading-none">+</span> فاتورة جديدة
                                            </button>
                                        )}
                                    </div>

                                    {/* Dashboard Content (Step 1) */}
                                    <div className="demo-dashboard absolute top-24 left-6 right-6">
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-blue-500 flex flex-col gap-1">
                                                <p className="text-xs text-slate-500 font-medium">إجمالي الفواتير</p>
                                                <p className="font-bold text-xl text-slate-800">45</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-green-500 flex flex-col gap-1">
                                                <p className="text-xs text-slate-500 font-medium">الإيرادات</p>
                                                <p className="font-bold text-xl text-slate-800">12,500 <span className="text-xs font-normal">ر.س</span></p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-orange-500 flex flex-col gap-1">
                                                <p className="text-xs text-slate-500 font-medium">العملاء</p>
                                                <p className="font-bold text-xl text-slate-800">128</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border-r-4 border-purple-500 flex flex-col gap-1">
                                                <p className="text-xs text-slate-500 font-medium">المنتجات</p>
                                                <p className="font-bold text-xl text-slate-800">34</p>
                                            </div>
                                        </div>
                                        <div className="bg-white h-[200px] rounded-xl shadow-sm border border-gray-100 p-4">
                                            <div className="flex justify-between items-end h-full pt-8 pb-2 px-2 gap-4 opacity-30">
                                                {[30, 50, 40, 80, 60, 90, 70, 100].map((h, i) => (
                                                    <div key={i} className="w-full bg-[#4F46E5] rounded-t-sm" style={{ height: h + '%' }}></div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoice List (Step 2+) */}
                                    <div className="demo-invoice-list absolute top-24 left-6 right-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="grid grid-cols-4 bg-slate-50 p-4 text-xs font-bold text-slate-500 border-b border-gray-100">
                                            <div>رقم الفاتورة</div><div>العميل</div><div>المبلغ</div><div>الحالة</div>
                                        </div>
                                        <div className="flex flex-col">
                                            {[
                                                { id: 'INV-001', name: 'محمد أحمد', amount: '1,500', status: 'مدفوعة', color: 'green' },
                                                { id: 'INV-002', name: 'شركة الرياض', amount: '3,200', status: 'معلقة', color: 'orange' },
                                                { id: 'INV-003', name: 'أحمد علي', amount: '800', status: 'مدفوعة', color: 'green' },
                                            ].map((row, i) => (
                                                <div key={i} className="grid grid-cols-4 p-4 text-sm border-b border-gray-50 items-center hover:bg-slate-50">
                                                    <div className="font-bold text-indigo-900">{row.id}</div>
                                                    <div className="text-slate-700">{row.name}</div>
                                                    <div className="font-medium">{row.amount} ر.س</div>
                                                    <div><span className={`bg-${row.color}-100 text-${row.color}-700 px-3 py-1 rounded-full text-xs font-bold`}>{row.status}</span></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Create Form (Step 3) */}
                                    <div className="demo-create-form absolute inset-6 lg:inset-x-20 bg-white shadow-2xl border border-gray-100 rounded-2xl p-6 flex flex-col z-20">
                                        <h4 className="font-black text-xl mb-6 text-slate-800">إنشاء فاتورة جديدة</h4>
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-2">العميل</label>
                                                <div className="border border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)] rounded-lg p-3 text-sm bg-white"><span className="demo-type-1 border-r-2 pr-1 ml-1" style={{ animationDelay: '0s' }}>محمد الزهراني</span></div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 block mb-2">تاريخ الإصدار</label>
                                                <div className="border border-gray-200 rounded-lg p-3 text-sm bg-slate-50 text-slate-500">2026-03-01</div>
                                            </div>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                                            <div className="bg-slate-50 grid grid-cols-12 gap-3 p-3 text-xs font-bold text-slate-500 border-b border-slate-200">
                                                <div className="col-span-6">المنتج</div>
                                                <div className="col-span-2 text-center">الكمية</div>
                                                <div className="col-span-2 text-center">السعر</div>
                                                <div className="col-span-2 text-left">الإجمالي</div>
                                            </div>
                                            <div className="grid grid-cols-12 gap-3 p-2.5 text-sm items-center">
                                                <div className="col-span-6 border border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)] rounded-lg p-2.5 bg-white"><span className="demo-type-1 border-r-2 pr-1 ml-1" style={{ animationDelay: '1.5s', width: '0' }}>خدمة تصميم</span></div>
                                                <div className="col-span-2 border border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)] rounded-lg p-2.5 text-center bg-white"><span className="demo-type-1 border-r-2 pr-1 ml-1" style={{ animationDelay: '2.5s', width: '0' }}>2</span></div>
                                                <div className="col-span-2 border border-indigo-500 shadow-[0_0_0_2px_rgba(79,70,229,0.2)] rounded-lg p-2.5 text-center bg-white"><span className="demo-type-1 border-r-2 pr-1 ml-1" style={{ animationDelay: '3.5s', width: '0' }}>500</span></div>
                                                <div className="col-span-2 font-black text-slate-800 text-left pt-1">1,000</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-auto bg-[#302b63] rounded-xl p-4 text-white">
                                            <button className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors">مراجعة الفاتورة</button>
                                            <div className="text-lg font-bold">الإجمالي: <span className="font-black text-[#00BCD4]">1,000 ر.س</span></div>
                                        </div>
                                    </div>

                                    {/* Preview (Step 4 & 5) */}
                                    <div className="demo-preview absolute inset-4 lg:inset-x-[15%] lg:inset-y-6 bg-white shadow-2xl rounded-2xl border border-gray-200 flex flex-col overflow-hidden z-30">
                                        <div className="h-2 bg-gradient-to-r from-indigo-500 to-cyan-400 w-full"></div>
                                        <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center text-sm shadow-sm relative z-10">
                                            <span className="font-black text-slate-800 text-lg">معاينة الفاتورة</span>
                                            <button className="bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_4px_10px_rgba(16,185,129,0.3)] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2">إرسال الفاتورة <span className="transform -scale-x-100">➤</span></button>
                                        </div>
                                        <div className="p-8 flex-1 overflow-y-auto relative bg-slate-50/50" style={{ zoom: 0.85 }}>
                                            <div className="bg-white p-8 border border-gray-200 shadow-sm rounded-xl relative overflow-hidden">
                                                {/* Stamp */}
                                                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-[6px] border-green-500 text-green-500 text-6xl font-black px-8 py-2 rounded-xl opacity-10 pointer-events-none">مدفوعة</div>

                                                <div className="flex justify-between items-start mb-10 border-b border-slate-200 pb-6">
                                                    <div>
                                                        <h2 className="text-3xl font-black text-indigo-900 mb-2">فاتورة ضريبية</h2>
                                                        <p className="text-sm font-bold text-slate-500">INV-2026-001</p>
                                                    </div>
                                                    <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-xl flex items-center justify-center font-black border border-indigo-100">شعار</div>
                                                </div>
                                                <div className="mb-10 text-slate-800">
                                                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-wider">مفوترة إلى:</p>
                                                    <p className="font-black text-xl">محمد الزهراني</p>
                                                </div>
                                                <table className="w-full text-sm mb-8 border-collapse">
                                                    <thead className="text-xs text-slate-500 bg-slate-50 rounded-t-lg border-b-2 border-slate-200">
                                                        <tr>
                                                            <th className="py-3 px-4 text-right w-1/2 font-bold rounded-tr-lg">الوصف</th>
                                                            <th className="py-3 px-4 text-center font-bold">الكمية</th>
                                                            <th className="py-3 px-4 text-center font-bold">السعر</th>
                                                            <th className="py-3 px-4 text-left font-bold rounded-tl-lg">المجموع</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-slate-800">
                                                        <tr className="border-b border-slate-100">
                                                            <td className="py-4 px-4 font-bold">خدمة تصميم</td>
                                                            <td className="py-4 px-4 text-center">2</td>
                                                            <td className="py-4 px-4 text-center">500</td>
                                                            <td className="py-4 px-4 text-left font-bold">1,000</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                                <div className="flex justify-between items-end mt-12 bg-slate-50 p-6 rounded-xl border border-slate-100">
                                                    <div className="w-24 h-24 bg-white border-2 border-slate-200 p-1 flex items-center justify-center rounded-lg shadow-sm">
                                                        <div className="w-full h-full bg-slate-800" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 20%, 60% 20%, 60% 0, 100% 0, 100% 40%, 80% 40%, 80% 60%, 100% 60%, 100% 100%, 60% 100%, 60% 80%, 40% 80%, 40% 100%, 0 100%, 0 60%, 20% 60%, 20% 40%, 0 40%)' }}></div>
                                                    </div>
                                                    <div className="w-[280px] text-sm text-slate-600">
                                                        <div className="flex justify-between py-2 font-medium"><span>المجموع:</span><span className="text-slate-800">1000 ر.س</span></div>
                                                        <div className="flex justify-between py-2 font-medium bg-yellow-50/50 text-amber-700 px-2 rounded-md"><span>ضريبة (15%):</span><span>150 ر.س</span></div>
                                                        <div className="flex justify-between py-3 mt-2 font-black text-xl text-indigo-900 border-t border-slate-200"><span>الإجمالي:</span><span>1,150 ر.س</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Success Overlay Flash (Step 5) */}
                                        <div className="demo-success-overlay absolute inset-0 bg-green-500/95 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center z-50">
                                            <div className="demo-success-check w-24 h-24 bg-white rounded-full flex items-center justify-center text-green-500 shadow-2xl mb-6">
                                                <CheckCircle size={50} strokeWidth={3} />
                                            </div>
                                            <h3 className="text-3xl font-black mb-2 shadow-sm text-white drop-shadow-md">تم الإرسال بنجاح!</h3>
                                            <p className="text-green-50 text-lg font-medium opacity-90 drop-shadow-sm">تم إرسال الفاتورة إلى العميل</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Mobile static placeholder */}
                <div className="block md:hidden w-full relative bg-white overflow-hidden rounded-xl mb-8 border border-white/10 shadow-xl p-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
                            <span className="font-black text-lg text-indigo-900">فاتورة ضريبية</span>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-bold">1,150 ر.س</span>
                        </div>
                        <div className="text-right text-sm">
                            <p className="text-slate-500 mb-1 line-clamp-1">العميل: محمد الزهراني</p>
                            <p className="text-slate-500">التاريخ: 2026-03-01</p>
                        </div>
                    </div>
                </div>

                {/* Controls and Progress Area */}
                <div className="max-w-[800px] mx-auto hidden md:flex flex-col gap-6 relative z-20">

                    {/* Progress Dots with Labels */}
                    {/* Fix: use flex-row-reverse or dir="ltr" to render LTR array in an RTL document */}
                    <div className="flex justify-between items-end w-full px-4 relative z-10" dir="ltr">
                        {/* Connecting line */}
                        <div className="absolute top-[14px] left-[10%] right-[10%] h-[2px] bg-white/10 z-0"></div>

                        {steps.map((label, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 z-10 w-24">
                                {/* Dot */}
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shrink-0 ${currentStep > idx ? 'bg-[#00BCD4] text-white' :
                                        currentStep === idx ? 'bg-indigo-500 ring-4 ring-indigo-500/30' :
                                            'bg-[#2a2a3e] border-2 border-white/20'
                                    }`}>
                                    {currentStep > idx ? <CheckCircle size={14} strokeWidth={3} /> : <span className="w-2.5 h-2.5 bg-white rounded-full opacity-50"></span>}
                                </div>
                                {/* Label */}
                                <span className={`text-[11px] font-bold text-center transition-colors w-full ${currentStep >= idx ? 'text-white' : 'text-white/40'}`} dir="rtl">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6" dir="ltr">
                        {/* Play Controls */}
                        <div className="flex gap-2 shrink-0">
                            <button
                                onClick={handleRestart}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg shadow-black/20"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg shadow-black/20"
                            >
                                {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" className="translate-x-[1px]" />}
                            </button>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden shrink-0">
                            {/* Fix: Now that parent is LTR, it fills strictly left to right using scaleX from transform-origin left */}
                            <div className="w-full h-full bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] demo-progress-bar shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
                        </div>
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-20 pt-10 border-t border-white/10 flex flex-col items-center gap-6 relative z-20">
                    <h3 className="text-2xl font-black text-white px-4">هل أنت مستعد للبدء؟</h3>
                    <Link to="/signup" className="btn-pulse inline-flex items-center gap-3 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white px-8 py-4 rounded-full font-black text-lg shadow-[0_10px_25px_rgba(79,70,229,0.5)] hover:scale-105 transition-all">
                        ابدأ الاستخدام مجاناً
                        <span className="transform rotate-180">➤</span>
                    </Link>
                </div>

            </div>
        </section>
    );
};
export default AnimatedDemo;
