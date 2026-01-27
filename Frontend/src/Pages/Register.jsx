import { useState } from "react";

export default function Register() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        countryCode: "+20",
        password: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            alert("كلمة المرور غير متطابقة");
            return;
        }

        setLoading(true);

        // Prepare body - only include phone if it has a value
        const requestBody = {
            name: form.name,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword, // Include confirmPassword for backend validation
        };

        // Only add phone if it's not empty
        if (form.phone && form.phone.trim() !== "") {
            requestBody.phone = form.countryCode + form.phone;
        }

        try {
            const res = await fetch("http://localhost:4000/api/v1/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                alert(data.message || "حدث خطأ في التسجيل");
                return;
            }

            alert("تم التسجيل بنجاح!");
            console.log("Signup result:", data);

        } catch (error) {
            setLoading(false);
            console.error(error);
            alert("حدث خطأ في الاتصال بالسيرفر");
        }
    };

    return (
        <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden mx-auto">

                {/* Header with gradient background */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8 px-6 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">دفاتر المحاسب</h1>
                    <p className="text-blue-100 text-sm">إنشاء حساب جديد</p>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <form className="w-full space-y-5" onSubmit={handleSubmit}>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700 text-right">
                                الاسم الشخصي
                            </label>
                            <input
                                required
                                name="name"
                                type="text"
                                dir="rtl"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="اكتب اسمك"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700 text-right">
                                البريد الإلكتروني
                            </label>
                            <input
                                required
                                name="email"
                                type="email"
                                dir="rtl"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="example@mail.com"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700 text-right">
                                رقم الجوال
                            </label>
                            <div className="flex gap-3" dir="rtl">
                                <input
                                    name="phone"
                                    type="text"
                                    dir="rtl"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="رقم الهاتف (اختياري)"
                                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-blue-500 transition-colors"
                                />

                                <select
                                    name="countryCode"
                                    value={form.countryCode}
                                    onChange={handleChange}
                                    className="border-2 border-gray-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="+20">+20</option>
                                    <option value="+966">+966</option>
                                    <option value="+971">+971</option>
                                    <option value="+965">+965</option>
                                    <option value="+974">+974</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700 text-right">
                                كلمة المرور
                            </label>
                            <input
                                required
                                type="password"
                                name="password"
                                dir="rtl"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-semibold text-gray-700 text-right">
                                تأكيد كلمة المرور
                            </label>
                            <input
                                required
                                type="password"
                                name="confirmPassword"
                                dir="rtl"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-right focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <p className="text-xs text-gray-600 text-center leading-relaxed py-2">
                            بالتسجيل، أنت توافق على شروط الخدمة و سياسة الخصوصية.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? "جاري التسجيل..." : "تسجيل حساب جديد"}
                        </button>

                        <p className="text-center text-sm text-gray-600 pt-2">
                            هل لديك حساب بالفعل؟{" "}
                            <span
                                onClick={() => window.location.href = '/login'}
                                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline cursor-pointer"
                            >
                                تسجيل الدخول
                            </span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
