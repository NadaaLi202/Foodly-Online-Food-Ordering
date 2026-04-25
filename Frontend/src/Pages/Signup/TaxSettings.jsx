import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignup } from './SignupLayout';
import companyService from '../../services/companyService';
import toast from 'react-hot-toast';
import { Loader2, Check } from 'lucide-react';

const TaxSettings = () => {
    const navigate = useNavigate();
    const { signupData, updateData } = useSignup();
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Redirect to start if state is lost (e.g., page refresh)
    React.useEffect(() => {
        if (!signupData.email || !signupData.name) {
            navigate('/signup');
        }
    }, [signupData.email, signupData.name, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await companyService.signupCompany(signupData);
            setShowSuccessModal(true);
        } catch (error) {
            const msg = error.response?.data?.message || 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.';
            toast.error(msg);
            setLoading(false);
        }
    };

    const handleSuccessClick = () => {
        setShowSuccessModal(false);
        navigate('/signup/pending');
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex items-center mb-8 border-b-2 border-gray-100 pb-4">
                <div className="flex-1 text-center border-l-2 border-gray-100 opacity-50 cursor-pointer" onClick={() => navigate('/signup/company')}>
                    <h2 className="text-[#4f46e5] font-bold text-lg">الخطوة 1</h2>
                    <p className="text-gray-800 font-bold">بيانات الشركة</p>
                </div>
                <div className="flex-1 text-center">
                    <h2 className="text-[#4f46e5] font-bold text-lg">الخطوة 2</h2>
                    <p className="text-[#4f46e5] font-bold">إعدادات الضرائب</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-4">

                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg">إدخال أسعار المنتجات والخدمات</h3>

                    <label className="flex items-center justify-between p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="priceType"
                                value="before_vat"
                                checked={signupData.priceType === 'before_vat'}
                                onChange={(e) => updateData({ priceType: e.target.value })}
                                className="w-5 h-5 text-[#4f46e5] focus:ring-[#4f46e5]"
                            />
                            <span className="font-medium text-gray-700">عند إنشاء المنتج سأقوم بإدخال سعره قبل إضافة ضريبة القيمة المضافة.</span>
                        </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="radio"
                            name="priceType"
                            value="after_vat"
                            checked={signupData.priceType === 'after_vat'}
                            onChange={(e) => updateData({ priceType: e.target.value })}
                            className="w-5 h-5 text-[#4f46e5] focus:ring-[#4f46e5]"
                        />
                        <span className="font-medium text-gray-700">عند إنشاء المنتج سأقوم بإدخال سعره النهائي بعد إضافة ضريبة القيمة المضافة.</span>
                    </label>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="pt-1">
                            <input
                                type="checkbox"
                                checked={signupData.zatcaEnabled}
                                onChange={(e) => updateData({ zatcaEnabled: e.target.checked })}
                                className="w-5 h-5 text-[#4f46e5] focus:ring-[#4f46e5] rounded"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-gray-800 block mb-1 group-hover:text-[#4f46e5] transition-colors">
                                تفعيل الفاتورة الإلكترونية السعودية (هيئة الزكاة والضريبة والجمارك)
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                                يمكنك تفعيل وتهيئة الفاتورة الإلكترونية المرحلة الأولى أو المرحلة الثانية من خلال إعدادات الفاتورة الإلكترونية عندما تكون جاهزاً للبدء.
                            </span>
                        </div>
                    </label>
                </div>

                <div className="flex mt-8 border-t border-gray-100 pt-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-[#4f46e5] text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50 flex items-center justify-center min-w-[150px]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'إعداد قاعدة البيانات'}
                    </button>
                </div>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="text-green-500 w-8 h-8" strokeWidth={3} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">تم إنشاء قاعدة البيانات بنجاح!</h2>
                        <p className="text-gray-500 mb-8 font-medium">يمكنك الآن البدء في استخدام النظام.</p>

                        <button
                            onClick={handleSuccessClick}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            ابدأ الاستخدام
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaxSettings;
