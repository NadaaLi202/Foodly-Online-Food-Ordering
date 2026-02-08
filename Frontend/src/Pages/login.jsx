import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
    const navigate = useNavigate();
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
                console.log('Login successful, role:', role);

                // Redirect based on role
                if (role === 'superAdmin') {
                    navigate('/super-admin');
                } else {
                    navigate('/dashboard');
                }
            }

        } catch (error) {
            setLoading(false);
            console.error(error);
            const message = error.response?.data?.message || "Login failed";
            alert(message);
        }
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden font-sans text-left" dir="ltr">

            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 relative z-10 bg-white">
                <div>
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors text-sm font-bold">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                </div>

                <div className="max-w-md w-full mx-auto">
                    <div className="mb-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 mb-6">
                            <BarChart3 className="text-white w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Welcome back</h1>
                        <p className="text-gray-500">Please enter your details to sign in.</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
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
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

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
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl text-gray-900 font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span className="text-sm font-bold text-gray-500">Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-500 font-medium">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                            Sign up for free
                        </Link>
                    </p>
                </div>

                <div className="text-sm text-gray-400 font-medium">
                    © {new Date().getFullYear()} Dafater Inc.
                </div>
            </div>

            {/* Right Side - Image/Decoration */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
                </div>

                <div className="relative z-10 max-w-lg p-10 text-white text-center">
                    <h2 className="text-4xl font-black mb-6">Manage your business with confidence.</h2>
                    <p className="text-gray-400 text-lg mb-8">Join over 10,000+ businesses that trust Dafater for their accounting needs.</p>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10 text-left">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xl">JD</div>
                            <div>
                                <h4 className="font-bold text-lg">John Doe</h4>
                                <p className="text-indigo-200 text-sm">CEO, TechStart Inc.</p>
                            </div>
                        </div>
                        <p className="italic text-gray-300">"Dafater has completely transformed how we handle our finances. The automated insights are a game changer."</p>
                        <div className="flex gap-1 mt-4 text-yellow-400">
                            {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
