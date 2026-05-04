import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../../api/auth';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const from = location.state?.from?.pathname || '/admin/dashboard';

    const onSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            await login(email, password);
            toast.success('Welcome back');
            navigate(from, { replace: true });
        } catch (err) {
            const msg = err?.response?.data?.error || 'Login failed';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bodybg px-4">
            <div className="w-full max-w-[400px]">
                <div className="ol-card">
                    <div className="ol-card-body p-6">
                        <h1 className="text-[20px] font-bold text-dark mb-1">Admin Sign In</h1>
                        <p className="text-[13px] text-gray mb-5">Sign in to access the admin panel.</p>
                        <form onSubmit={onSubmit} className="flex flex-col gap-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-[13px] text-dark">Email</span>
                                <input
                                    type="email"
                                    required
                                    autoFocus
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border border-border rounded-ol-8 px-3 py-2 text-[14px] focus:outline-none focus:border-skin"
                                    placeholder="admin@example.com"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-[13px] text-dark">Password</span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="border border-border rounded-ol-8 px-3 py-2 text-[14px] focus:outline-none focus:border-skin"
                                    placeholder="••••••••"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="mt-2 bg-skin text-white rounded-ol-8 py-2 text-[14px] font-semibold disabled:opacity-60"
                            >
                                {submitting ? 'Signing in…' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
