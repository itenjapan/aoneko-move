import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Phone, Truck, ArrowRight, ShieldCheck } from 'lucide-react';

const DriverRegistration: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('keivan');
  const [licensePlate, setLicensePlate] = useState('');
  
  const [error, setError] = useState('');
  const { signupDriver, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!name || !email || !password || !phone || !licensePlate) {
        setError('すべての項目を入力してください');
        return;
    }

    try {
      await signupDriver(name, email, password, phone, vehicleType, licensePlate);
      navigate('/driver'); // Go directly to driver dashboard
    } catch (err: any) {
      setError(err.message || '登録に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-full bg-slate-900 mb-4 shadow-lg shadow-slate-900/30">
             <Truck size={32} className="text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">ドライバーパートナー登録</h1>
          <p className="text-slate-500 mt-3 text-lg font-light">
            あなたの車で、空いた時間を収入に。<br/>
            Aoneko Moveの配送パートナーになりませんか？
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-8 md:p-10 border border-slate-100 animate-fade-in-up">
            {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-8 text-sm flex items-center justify-center border border-rose-100 font-medium">
                {error}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">お名前</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                            placeholder="山田 太郎"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">電話番号</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                            placeholder="090-1234-5678"
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">メールアドレス</label>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                </div>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                    placeholder="driver@example.com"
                />
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">パスワード</label>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                </div>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                    placeholder="8文字以上の英数字"
                    minLength={8}
                />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                    <Truck size={18} className="mr-2 text-brand-500" /> 車両情報
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">車両タイプ</label>
                        <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                        >
                            <option value="keivan">軽バン (Box Van)</option>
                            <option value="keitruck">軽トラック (Pick-up)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">車両ナンバー</label>
                        <input
                            type="text"
                            required
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value)}
                            className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-slate-800"
                            placeholder="名古屋 580 あ 12-34"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-brand-50 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="text-brand-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-brand-800 leading-relaxed">
                    登録することで、Aoneko Moveの<a href="#" className="underline font-bold">プライバシーポリシー</a>および<a href="#" className="underline font-bold">ドライバー利用規約</a>に同意したものとみなされます。
                </p>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-brand-500/20 text-lg font-bold text-white bg-slate-900 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
            >
                {isLoading ? '登録処理中...' : 'ドライバーとして登録'}
            </button>
            </form>

            <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
                すでにアカウントをお持ちですか？{' '}
                <Link to="/login" className="font-bold text-brand-600 hover:text-brand-500 inline-flex items-center transition-colors">
                ログイン <ArrowRight size={14} className="ml-1" />
                </Link>
            </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;