import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from './signuplayout';
import companyService from '../../services/companyservice';
import { Loader2 } from 'lucide-react';

const CompanyForm = () => {
    const navigate = useNavigate();
    const { signupData, updateData } = useSignup();
    const [slugError, setSlugError] = useState('');
    const [slugLoading, setSlugLoading] = useState(false);
    const [showFullAddress, setShowFullAddress] = useState(false);
    const [slugCheckingTimeout, setSlugCheckingTimeout] = useState(null);

    // Redirect to start if state is lost (e.g., page refresh)
    useEffect(() => {
        if (!signupData.email || !signupData.adminName) {
            navigate('/signup');
        }
    }, [signupData.email, signupData.adminName, navigate]);

    // Slug validation effect
    useEffect(() => {
        if (!signupData.slug) return;

        const checkSlug = async () => {
            setSlugLoading(true);
            try {
                // Call API to check slug
                const response = await companyService.checkSlug(signupData.slug);
                if (!response.isAvailable) {
                    setSlugError('رابط صفحة الدخول مستخدم بالفعل / Slug already taken');
                } else {
                    setSlugError('');
                }
            } catch (err) {
                logError(err);
            } finally {
                setSlugLoading(false);
            }
        };

        if (slugCheckingTimeout) clearTimeout(slugCheckingTimeout);

        // Debounce API call
        const timeout = setTimeout(checkSlug, 800);
        setSlugCheckingTimeout(timeout);

        return () => clearTimeout(timeout);
    }, [signupData.slug]);

    const handleSlugChange = (e) => {
        const val = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        updateData({ slug: val });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (slugError || slugLoading || !signupData.slug) return;
        navigate('/signup/tax');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center mb-8 border-b-2 border-gray-100 pb-4">
                <div className="flex-1 text-center border-l-2 border-gray-100">
                    <h2 className="text-[#4f46e5] font-bold text-lg">الخطوة 1</h2>
                    <p className="text-gray-800 font-bold">بيانات الشركة</p>
                </div>
                <div className="flex-1 text-center opacity-50">
                    <h2 className="text-[#4f46e5] font-bold text-lg">الخطوة 2</h2>
                    <p className="text-gray-600 font-bold">إعدادات الضرائب</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Right Column */}
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                                اسم الشركة/المؤسسة <span className="text-red-500">(مطلوب)</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={signupData.name}
                                onChange={e => updateData({ name: e.target.value })}
                                className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none text-right"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                                السجل التجاري <span className="text-gray-400 font-normal">(يمكنك ملؤه لاحقاً)</span>
                            </label>
                            <input
                                type="text"
                                value={signupData.commercialRegister}
                                onChange={e => updateData({ commercialRegister: e.target.value })}
                                className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none text-right"
                            />
                        </div>
                    </div>

                    {/* Left Column */}
                    <div className="space-y-5">
                        <div className="h-[76px]">
                            {/* Spacer for alignment to match design */}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                                الرقم الضريبي <span className="text-gray-400 font-normal">(يمكنك ملؤه لاحقاً)</span>
                            </label>
                            <input
                                type="text"
                                value={signupData.taxNumber}
                                onChange={e => updateData({ taxNumber: e.target.value })}
                                className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none text-right"
                            />
                        </div>
                    </div>
                </div>

                <div className="text-gray-600 text-sm font-medium pt-2">
                    سيتم إنشاء الحساب بإعدادات: {signupData.country} <button type="button" className="text-[#4f46e5] underline mr-1 hover:text-indigo-700">تغيير؟</button>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-5 md:w-1/2 ml-auto">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                            العنوان <span className="text-red-500">(مطلوب)</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={signupData.address}
                            onChange={e => updateData({ address: e.target.value })}
                            className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none text-right"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                            المدينة <span className="text-red-500">(مطلوب)</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={signupData.city}
                            onChange={e => updateData({ city: e.target.value })}
                            className="w-full h-11 border border-gray-200 rounded-lg px-4 focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] outline-none text-right"
                        />
                    </div>

                    <button type="button" onClick={() => setShowFullAddress(!showFullAddress)} className="text-[#4f46e5] font-bold text-sm">
                        إظهار جميع حقول العنوان
                    </button>

                    <div className="pt-4 pb-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
                            رابط صفحة الدخول
                        </label>
                        <div className="flex items-center" dir="ltr">
                            <span className="text-gray-600 font-medium pl-2">https://</span>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={signupData.slug}
                                    onChange={handleSlugChange}
                                    className={`w-36 h-11 border-2 ${slugError ? 'border-red-400' : 'border-[#4f46e5]'} rounded-none px-2 focus:outline-none text-center font-bold`}
                                />
                                {slugLoading && <Loader2 size={16} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                            </div>
                            <span className="text-gray-600 font-medium">.daftar-almohaseb.io</span>
                        </div>
                        {slugError && <p className="text-red-500 text-xs mt-1 text-right">{slugError}</p>}
                    </div>
                </div>

                <div className="flex mt-8 border-t border-gray-100 pt-6">
                    <button
                        type="submit"
                        disabled={!!slugError || slugLoading || !signupData.slug}
                        className="bg-[#4f46e5] text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50"
                    >
                        التالي
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyForm;
