import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BarChart3, ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import companyService from '../services/companyService';

export default function CompanyLogin() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const { login } = useAuth();
    const [companyInfo, setCompanyInfo] = useState(null);
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) {
            companyService.getCompanyBySlug(slug).then((res) => {
                setCompanyInfo(res.company);
            }).catch(() => setCompanyInfo(null));
        }
    }, [slug]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const data = await companyService.companySignIn(form.email, form.password);
            if (data.token && data.company) {
                login(data.company, data.token);
                if (slug) {
                    navigate(`/dashboard`);
                } else {
                    navigate('/dashboard');
                }
                window.location.reload();
            }
        } catch (err) {
            setLoading(false);
            const message = err.response?.data?.message || 'Invalid email or password';
            setError(message);
        }
    };

    return (
        <div className="min-h-screen bg-white flex relative overflow-hidden font-sans text-left" dir="ltr">
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
                        <h1 className="text-4xl font-black text-gray-900 mb-2">
                            {companyInfo ? `${companyInfo.name} – Sign in` : 'Company sign in'}
                        </h1>
                        <p className="text-gray-500">
                            {companyInfo ? 'Enter your company credentials.' : 'Enter your email and password to access your company account.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest text-left">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="contact@company.com"
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gray-900 text-white rounded-xl py-4 font-bold text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-gray-500 font-medium">
                        <Link to="/login" className="text-indigo-600 font-bold hover:underline">User login</Link>
                    </p>
                </div>

                <div className="text-sm text-gray-400 font-medium">
                    © {new Date().getFullYear()} Dafater Inc.
                </div>
            </div>

            <div className="hidden lg:flex w-1/2 bg-gray-900 relative overflow-hidden items-center justify-center">
                <div className="relative z-10 max-w-lg p-10 text-white text-center">
                    <h2 className="text-4xl font-black mb-6">Company portal</h2>
                    <p className="text-gray-400 text-lg">Sign in with your company credentials to access your dashboard.</p>
                </div>
            </div>
        </div>
    );
}
