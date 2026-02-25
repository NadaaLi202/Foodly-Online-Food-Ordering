import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BarChart3, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { useTranslation } from "react-i18next";

export default function Login() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirect");
    const { login } = useAuth();
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await api.post("/auth/signIn", {
                email: form.email,
                password: form.password,
            });

            const data = res.data;
            setLoading(false);

            // Save token via context
            if (data.token) {
                login(data.isUserExist, data.token);

                const role = data.isUserExist.role;
                const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;

                if (target) {
                    navigate(target, { replace: true });
                } else if (role === "superAdmin") {
                    navigate("/super-admin", { replace: true });
                } else {
                    navigate("/dashboard", { replace: true });
                }
            }

        } catch (error) {
            setLoading(false);
            console.error(error);
            const message = error.response?.data?.message || t('auth.login_failed');
            alert(message);
        }
    };

    return (
        <div className={`min-h-screen bg-white flex relative overflow-hidden font-sans ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 relative z-10 bg-white">
                <div className={isRtl ? 'text-right' : 'text-left'}>
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                        <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                        {t('auth.back_home', 'Back to Home')}
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto">
                    <div className="mb-10">
                        <div className={`w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6 ${isRtl ? 'mr-0' : 'ml-0'}`}>
                            <BarChart3 className="text-white w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">{t('auth.welcome_back')}</h1>
                        <p className="text-gray-500">{t('auth.signin_details')}</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className={`block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('auth.email_address')}
                            </label>
                            <div className="relative">
                                <Mail className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder={t('auth.email_placeholder')}
                                    className={`w-full ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('auth.password')}
                            </label>
                            <div className="relative">
                                <Lock className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                                <input
                                    required
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder={t('auth.password_placeholder')}
                                    className={`w-full ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all`}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-gray-500">{t('auth.remember_me')}</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">{t('auth.forgot_password')}</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            {loading ? t('auth.signing_in') : t('auth.signin')}
                        </button>
                    </form>


                </div>

                <div className={`text-sm text-gray-400 font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t('auth.copyright', { year: new Date().getFullYear() })}
                </div>
            </div>

            {/* Right Side - Image/Decoration */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 max-w-lg p-10 text-white text-center">
                    <h2 className="text-4xl font-black mb-6">{t('auth.signin_hero_title')}</h2>
                    <p className="text-gray-400 text-lg mb-8">{t('auth.signin_hero_desc')}</p>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-left">
                        <div className={`flex items-center gap-4 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xl">
                                {isRtl ? 'ج د' : 'JD'}
                            </div>
                            <div className={isRtl ? 'text-right' : 'text-left'}>
                                <h4 className="font-bold text-lg">{t('auth.testimonial.name')}</h4>
                                <p className="text-indigo-200 text-sm">{t('auth.testimonial.role')}</p>
                            </div>
                        </div>
                        <p className={`italic text-gray-300 ${isRtl ? 'text-right' : 'text-left'}`}>{t('auth.testimonial.text')}</p>
                        <div className={`flex gap-1 mt-4 text-yellow-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
