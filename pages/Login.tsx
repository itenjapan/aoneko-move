import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, User, Truck, ShieldCheck } from 'lucide-react';
import { mockStore } from '../services/mockDb';

type LoginRole = 'customer' | 'driver' | 'admin';

const Login: React.FC = () => {
  const [activeRole, setActiveRole] = useState<LoginRole>('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Demo Credentials Map
  const demoCredentials: Record<LoginRole, { email: string; pass: string }> = {
    customer: { email: 'tanaka@demo.com', pass: 'password' },
    driver: { email: 'suzuki@driver.com', pass: 'password' },
    admin: { email: 'admin@jpmove.com', pass: 'admin' },
  };

  const handleRoleSwitch = (role: LoginRole) => {
      setActiveRole(role);
      setEmail(demoCredentials[role].email);
      setPassword(demoCredentials[role].pass);
      setError('');
  };

  // Initialize with default customer credentials
  React.useEffect(() => {
      setEmail(demoCredentials.customer.email);
      setPassword(demoCredentials.customer.pass);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      
      // Check if there is a pending redirect (e.g. from Quote or Dashboard)
      // We prioritize this unless it's the login page itself
      const destination = location.state?.from;

      if (destination && destination !== '/login') {
         navigate(destination, { replace: true });
         return;
      }

      // Default redirects based on actual user role
      // We check the store to get the real role of the user, regardless of which tab they clicked
      const user = mockStore.users.find(u => u.email === email);
      
      if (user) {
          if (user.userType === 'admin') {
              navigate('/admin/drivers');
          } else if (user.userType === 'driver') {
              navigate('/driver');
          } else {
              // Default for customer
              navigate('/dashboard');
          }
      } else {
          // Fallback
          navigate('/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-soft p-8 sm:p-10 animate-fade-in-up border border-slate-100">
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-full bg-brand-50 mb-4">
            <div className="bg-brand-500 w-3 h-3 rounded-full"></div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">統合ログイン</h1>
          <p className="text-slate-500 mt-2 font-light">役割を選択してログインしてください</p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-8">
            <button 
                onClick={() => handleRoleSwitch('customer')}
                className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all ${activeRole === 'customer' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <User size={20} className="mb-1" />
                お客様
            </button>
            <button 
                onClick={() => handleRoleSwitch('driver')}
                className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all ${activeRole === 'driver' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Truck size={20} className="mb-1" />
                ドライバー
            </button>
            <button 
                onClick={() => handleRoleSwitch('admin')}
                className={`flex flex-col items-center justify-center py-3 rounded-lg text-xs font-bold transition-all ${activeRole === 'admin' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <ShieldCheck size={20} className="mb-1" />
                管理者
            </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-8 text-sm flex items-center justify-center border border-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">メールアドレス</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-slate-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder-slate-400"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">パスワード</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-slate-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
          >
            {isLoading ? 'ログイン中...' : `${activeRole === 'customer' ? 'お客様' : activeRole === 'driver' ? 'ドライバー' : '管理者'}としてログイン`}
          </button>
        </form>

        <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
           <p className="text-xs text-slate-400 mb-2 uppercase font-bold">デモ用アカウント (自動入力済)</p>
           <p className="text-sm font-mono text-slate-600">{email}</p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            アカウントをお持ちでないですか？{' '}
            <Link to="/signup" className="font-bold text-brand-600 hover:text-brand-500 inline-flex items-center transition-colors">
              新規登録 <ArrowRight size={14} className="ml-1" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;