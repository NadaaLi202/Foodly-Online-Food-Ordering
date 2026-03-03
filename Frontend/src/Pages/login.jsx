import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import companyService from "../services/companyService";
import { useTranslation } from "react-i18next";
import logo from '../assets/logo.jpg';

export default function Login() {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirect");
    const companySlug = searchParams.get("company");

    const { login } = useAuth();
    const [companyInfo, setCompanyInfo] = useState(null);
    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companySlug) {
            companyService.getCompanyBySlug(companySlug)
                .then((res) => {
                    setCompanyInfo(res.company);
                })
                .catch((err) => {
                    logError("Failed to fetch company info", err);
                    setCompanyInfo(null);
                });
        } else {
            setCompanyInfo(null);
        }
    }, [companySlug]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (companySlug) {
                // Use company dedicated sign in
                res = await api.post("/auth/company/signIn", {
                    email: form.email,
                    password: form.password,
                });
            } else {
                // Use standard sign in
                res = await api.post("/auth/signIn", {
                    email: form.email,
                    password: form.password,
                });
            }

            const data = res.data;
            setLoading(false);

            // Save token via context
            if (data.token) {
                const userObj = data.isUserExist || data.company;
                login(userObj, data.token);

                const role = userObj.role;
                const target = redirectTo && redirectTo.startsWith("/") ? redirectTo : null;

                if (target) {
                    navigate(target, { replace: true });
                } else if (role === "superAdmin") {
                    navigate("/super-admin", { replace: true });
                } else {
                    navigate("/dashboard", { replace: true });
                }

                // Ensure page refresh if needed for state consistency
                if (companySlug) {
                    window.location.reload();
                }
            }

        } catch (error) {
            setLoading(false);
            logError(error);
            const message = error.response?.data?.message || t('auth.login_failed');
            setError(message);
        }
    };

    return (
        <div className={`min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans ${isRtl ? 'text-right' : 'text-left'} relative`} dir={isRtl ? 'rtl' : 'ltr'}>
            <Link to="/" className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100`}>
                <span className={isRtl ? '' : 'rotate-180'}>&rarr;</span>
                {t('auth.back_home', 'العودة للرئيسية')}
            </Link>
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <img src={logo} alt="Daftar Almohaseb Logo" className="mx-auto h-16 w-auto object-contain mix-blend-multiply" />
                <h2 className="mt-6 text-center text-[22px] font-bold text-[#1f2937]">
                    {companyInfo
                        ? (isRtl ? `تسجيل الدخول في ${companyInfo.name}` : `Sign in to ${companyInfo.name}`)
                        : t('auth.signin_hero_title', 'Sign in to your account')}
                </h2>
                {companyInfo && (
                    <p className="mt-2 text-sm text-gray-500">
                        {isRtl ? 'الوصول إلى بوابة الشركة المخصصة' : 'Access your dedicated company portal'}
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] sm:rounded-xl sm:px-10 border border-gray-100">

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-sm text-center font-medium shadow-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[13px] font-bold text-[#4b5563] mb-1.5 w-full">
                                {t('auth.email_address', 'Email address')}
                            </label>
                            <input
                                required
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="documenta694@gmail.com"
                                className="w-full px-4 py-3 bg-[#EEF2FF] border border-gray-200 rounded-md text-gray-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-[#4b5563] mb-1.5 w-full">
                                {t('auth.password', 'Password')}
                            </label>
                            <input
                                required
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#EEF2FF] border border-gray-200 rounded-md text-gray-900 font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm tracking-widest"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#5340FF] text-white rounded-md py-2.5 font-bold text-sm hover:bg-[#4330DF] transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? t('auth.signing_in', 'Signing in...') : t('auth.signin', 'Sign in')}
                            </button>
                        </div>

                        {!companySlug && (
                            <div className="pt-2 text-center pb-2 border-t border-gray-100 mt-4">
                                <Link to="/signup" className="text-sm font-bold text-[#5340FF] hover:underline">
                                    {isRtl ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Create one"}
                                </Link>
                            </div>
                        )}

                        {companySlug && (
                            <div className="pt-2 text-center pb-2 border-t border-gray-100 mt-4">
                                <Link to="/login" className="text-sm font-bold text-[#5340FF] hover:underline">
                                    {isRtl ? 'تسجيل دخول مستخدم عام' : 'Standard user login'}
                                </Link>
                            </div>
                        )}
                    </form>
                </div>

                <div className="mt-8 flex justify-center border-t-0">
                    <button
                        onClick={() => i18n.changeLanguage(isRtl ? 'en' : 'ar')}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 shadow-sm text-[13px] font-bold rounded-lg text-gray-800 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {isRtl ? (
                            <>🇺🇸 English <span className="text-gray-400 text-[10px] ml-1">▼</span></>
                        ) : (
                            <>🇸🇦 العربية <span className="text-gray-400 text-[10px] ml-1">▼</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
