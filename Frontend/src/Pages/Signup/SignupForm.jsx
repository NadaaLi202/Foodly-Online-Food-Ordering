import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react';
import { useSignup } from './SignupLayout';

const countries = [
    { code: '+966', name: 'Saudi Arabia / السعودية', flag: '🇸🇦' },
    { code: '+20', name: 'Egypt / مصر', flag: '🇪🇬' },
    { code: '+971', name: 'UAE / الإمارات', flag: '🇦🇪' },
    { code: '+965', name: 'Kuwait / الكويت', flag: '🇰🇼' },
    { code: '+974', name: 'Qatar / قطر', flag: '🇶🇦' },
    { code: '+973', name: 'Bahrain / البحرين', flag: '🇧🇭' },
    { code: '+968', name: 'Oman / عُمان', flag: '🇴🇲' },
    { code: '+962', name: 'Jordan / الأردن', flag: '🇯🇴' },
    { code: '+961', name: 'Lebanon / لبنان', flag: '🇱🇧' },
    { code: '+963', name: 'Syria / سوريا', flag: '🇸🇾' },
    { code: '+964', name: 'Iraq / العراق', flag: '🇮🇶' },
    { code: '+967', name: 'Yemen / اليمن', flag: '🇾🇪' },
    { code: '+212', name: 'Morocco / المغرب', flag: '🇲🇦' },
    { code: '+213', name: 'Algeria / الجزائر', flag: '🇩🇿' },
    { code: '+216', name: 'Tunisia / تونس', flag: '🇹🇳' },
    { code: '+249', name: 'Sudan / السودان', flag: '🇸🇩' },
    { code: '+218', name: 'Libya / ليبيا', flag: '🇱🇾' },
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+1', name: 'Canada', flag: '🇨🇦' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+90', name: 'Turkey', flag: '🇹🇷' },
    { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
    { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
];

const CountryCodeSelector = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = countries.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    );

    const selected = countries.find(c => c.code === value) || countries[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                className="h-11 border border-gray-200 rounded-lg px-2 bg-gray-50 flex items-center justify-between gap-1 cursor-pointer min-w-[95px] outline-none focus-within:ring-2 focus-within:ring-[#4f46e5]/20 focus-within:border-[#4f46e5] hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                tabIndex={0}
            >
                <div className="flex items-center gap-1.5 justify-center flex-1">
                    <span className="text-xl leading-none">{selected.flag}</span>
                    <span className="text-sm font-bold text-gray-700 pt-[2px]" dir="ltr">{selected.code}</span>
                </div>
                <ChevronDown size={14} className="text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute top-12 right-0 w-[260px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-64 flex flex-col" dir="rtl">
                    <div className="p-2 border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm outline-none focus:border-[#4f46e5] text-right"
                            placeholder="ابحث عن الدولة أو الرمز..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filtered.map((c, i) => (
                            <div
                                key={i}
                                className={`px-3 py-2.5 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-sm rounded-md transition-colors ${selected.code === c.code ? 'bg-indigo-50 text-[#4f46e5]' : 'text-gray-700'}`}
                                onClick={() => {
                                    onChange(c.code);
                                    setIsOpen(false);
                                    setSearch('');
                                }}
                            >
                                <span className="text-lg">{c.flag}</span>
                                <span className="flex-1 truncate text-right font-medium">{c.name}</span>
                                <span className={`font-bold ${selected.code === c.code ? 'text-[#4f46e5]' : 'text-gray-500'}`} dir="ltr">{c.code}</span>
                                {selected.code === c.code && <Check size={16} className="text-[#4f46e5] ml-1" />}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm font-medium">لا توجد نتائج</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const SignupForm = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { signupData, updateData } = useSignup();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [countryCode, setCountryCode] = useState('+966');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (signupData.password !== confirmPassword) {
            setError('كلمة المرور غير متطابقة / Passwords do not match');
            return;
        }

        if (signupData.password.length < 8 || !/(?=.*[A-Za-z])(?=.*\d)/.test(signupData.password)) {
            setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حرف ورقم / Password must be at least 8 chars with a letter and number');
            return;
        }

        // Proceed to next step
        navigate('/signup/company');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto relative border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Personal Name */}
                <div className="space-y-2">
                    <label htmlFor="adminName" className="block text-sm font-bold text-gray-700">الاسم الشخصي</label>
                    <input
                        type="text"
                        id="adminName"
                        name="adminName"
                        required
                        value={signupData.adminName}
                        onChange={e => updateData({ adminName: e.target.value })}
                        className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all text-center placeholder-gray-400"
                        placeholder="أدخل اسمك الشخصي"
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700">البريد الإلكتروني</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        placeholder="example@email.com"
                        value={signupData.email}
                        onChange={e => updateData({ email: e.target.value })}
                        className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all text-center placeholder-gray-400"
                    />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-700">رقم الجوال</label>
                    <div className="flex gap-2">
                        <CountryCodeSelector value={countryCode} onChange={setCountryCode} />
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            required
                            placeholder="5XXXXXXXX"
                            value={signupData.phone}
                            onChange={e => updateData({ phone: e.target.value })}
                            className="flex-1 h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all placeholder-gray-400 text-left"
                            style={{ direction: 'ltr' }}
                        />
                    </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-bold text-gray-700">كلمة المرور</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            required
                            value={signupData.password}
                            onChange={e => updateData({ password: e.target.value })}
                            className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none transition-all text-center"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700">تأكيد كلمة المرور</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full h-11 border-2 border-[#4f46e5]/30 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/50 focus:border-[#4f46e5] outline-none transition-all text-center"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="text-center text-sm font-medium text-gray-600 pt-2">
                    بالتسجيل، أنت توافق على <a href="#" className="text-gray-800 underline">شروط الخدمة</a> و <a href="#" className="text-gray-800 underline">سياسة الخصوصية</a>.
                </div>

                <div className="flex items-center justify-between pt-4">
                    <button
                        type="submit"
                        className="bg-[#2a3042] text-white px-6 py-2.5 rounded-lg hover:bg-[#1a1d29] transition-colors font-bold text-sm"
                    >
                        تسجيل حساب جديد
                    </button>
                    <Link to="/login" className="text-gray-500 hover:text-gray-800 text-sm font-medium underline">
                        هل لديك حساب بالفعل؟ تسجيل الدخول
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default SignupForm;
