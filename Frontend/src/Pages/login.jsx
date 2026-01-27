import { useState } from "react";

export default function Login() {
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
            const res = await fetch("http://localhost:4000/api/v1/auth/signIn", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                alert(data.message || "حدث خطأ في تسجيل الدخول");
                return;
            }

            alert("تم تسجيل الدخول بنجاح!");
            console.log("Login result:", data);

            // يمكنك حفظ الـ token هنا
            // localStorage.setItem("token", data.token);
            // window.location.href = "/dashboard";

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
                    <p className="text-blue-100 text-sm">تسجيل الدخول</p>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    <form className="w-full space-y-5" onSubmit={handleSubmit}>

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

                        <div className="flex items-center justify-between" dir="rtl">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">تذكرني</span>
                            </label>
                            <a href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                نسيت كلمة المرور؟
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl py-3.5 font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                        </button>

                        <p className="text-center text-sm text-gray-600 pt-2">
                            ليس لديك حساب؟{" "}
                            <span
                                onClick={() => window.location.href = '/register'}
                                className="text-blue-600 font-semibold hover:text-blue-700 hover:underline cursor-pointer"
                            >
                                إنشاء حساب جديد
                            </span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
