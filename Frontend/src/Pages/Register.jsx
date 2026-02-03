import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ArrowLeft, Mail, Lock, User, Phone, Globe } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
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
            alert("Passwords do not match");
            return;
        }

        setLoading(true);

        // Prepare body
        const requestBody = {
            name: form.name,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
        };

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
                alert(data.message || "Registration failed");
                return;
            }

            alert("Account created successfully! Please sign in.");
            navigate('/login');

        } catch (error) {
            setLoading(false);
            console.error(error);
            alert("Connection error");
        }
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden font-sans text-left" dir="ltr">

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 relative z-10 bg-white overflow-y-auto">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto mt-10">
                    <div className="mb-8">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
                            <BarChart3 className="text-white w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Create Account</h1>
                        <p className="text-gray-500">Start your 14-day free trial. No credit card required.</p>
                    </div>

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    required
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="name@company.com"
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Phone Number</label>
                            <div className="flex gap-2">
                                <div className="relative w-1/3">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <select
                                        name="countryCode"
                                        value={form.countryCode}
                                        onChange={handleChange}
                                        className="w-full pl-9 pr-2 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 bg-white appearance-none"
                                    >
                                        <option value="+20">+20</option>
                                        <option value="+966">+966</option>
                                        <option value="+971">+971</option>
                                        <option value="+965">+965</option>
                                        <option value="+974">+974</option>
                                    </select>
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        name="phone"
                                        type="text"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="123 456 7890"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        required
                                        type="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        required
                                        type="password"
                                        name="confirmPassword"
                                        value={form.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                            By clicking "Create Account", you agree to our Terms of Service and Privacy Policy.
                        </p>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white rounded-xl py-4 font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-500 font-medium pb-8">
                        Already have an account?{" "}
                        <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Decoration */}
            <div className="hidden lg:flex w-1/2 bg-indigo-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 max-w-lg p-10 text-white text-center">
                    <h2 className="text-4xl font-black mb-6">Scale faster with Dafater.</h2>
                    <div className="space-y-6 text-left">
                        {[
                            "Automated bookkeeping and reports",
                            "Inventory tracking across locations",
                            "Seamless invoicing and payments",
                            "Multi-user collaboration"
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/10">
                                <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-indigo-900 font-bold">✓</div>
                                <span className="font-bold text-lg">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}
