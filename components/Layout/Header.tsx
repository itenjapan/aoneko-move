import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Truck, Package, User, Menu, X, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const navLinks = [
        { path: '/', label: 'ホーム', icon: null },
        { path: '/quote', label: '見積もり・配送', icon: Truck },
        { path: '/tracking', label: '追跡', icon: Package },
    ];

    if (user?.userType === 'admin') {
        navLinks.push({ path: '/admin/drivers', label: '管理パネル', icon: Shield });
    } else if (user?.userType === 'driver') {
        navLinks.push({ path: '/driver', label: 'ドライバー画面', icon: User });
    }

    if (user && user.userType === 'customer') {
        navLinks.push({ path: '/dashboard', label: 'マイページ', icon: User });
    }

    const getRoleBadge = (type: string) => {
        switch (type) {
            case 'admin':
                return (
                    <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                        Admin
                    </span>
                );
            case 'driver':
                return (
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        Driver
                    </span>
                );
            case 'customer':
                return (
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        Customer
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
                            <div className="bg-brand-500 text-white p-2.5 rounded-2xl shadow-lg shadow-brand-500/20 transform group-hover:scale-105 transition-transform duration-300">
                                <Truck size={24} />
                            </div>
                            <div className="font-bold text-2xl tracking-tighter group-hover:opacity-90 transition-opacity">
                                <span className="text-slate-900 border-b-2 border-transparent group-hover:border-brand-500 transition-colors">Aoneko</span>
                                <span className="text-brand-500 ml-1">Move</span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex md:items-center md:space-x-6">
                        <div className="flex space-x-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${isActive(link.path)
                                        ? 'text-brand-600 bg-brand-50 shadow-inner'
                                        : 'text-slate-500 hover:text-brand-500 hover:bg-white hover:shadow-soft'
                                        }`}
                                >
                                    {link.icon && <link.icon size={16} className="mr-2.5" />}
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <div className="pl-6 border-l border-slate-100 flex items-center gap-4">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-slate-900">
                                            {user.name}
                                        </span>
                                        {getRoleBadge(user.userType)}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="text-slate-400 hover:text-rose-500 transition-colors p-2.5 hover:bg-rose-50 rounded-full"
                                        title="ログアウト"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link to="/login" className="text-slate-500 hover:text-brand-500 font-medium text-sm px-4 transition-colors">
                                        ログイン
                                    </Link>
                                    <Link to="/signup" className="bg-brand-500 text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 transform hover:-translate-y-0.5">
                                        新規登録
                                    </Link>
                                    <div className="h-4 w-px bg-slate-100 mx-1"></div>
                                    <Link to="/partner/register" className="text-[10px] font-bold text-slate-400 hover:text-brand-500 uppercase tracking-widest transition-colors">
                                        ドライバー登録
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 absolute w-full shadow-2xl animate-fade-in-up">
                    <div className="px-4 pt-4 pb-8 space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-5 py-4 rounded-2xl text-base font-medium transition-all ${isActive(link.path)
                                    ? 'text-brand-600 bg-brand-50/80'
                                    : 'text-slate-600 hover:text-brand-600 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex items-center">
                                    {link.icon && <link.icon size={20} className="mr-4 text-brand-400" />}
                                    {link.label}
                                </div>
                            </Link>
                        ))}

                        {!user && (
                            <Link
                                to="/partner/register"
                                onClick={() => setIsMenuOpen(false)}
                                className="block px-5 py-4 rounded-2xl text-base font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-50"
                            >
                                <div className="flex items-center">
                                    <Truck size={20} className="mr-4 text-slate-400" />
                                    ドライバーとして登録
                                </div>
                            </Link>
                        )}

                        <div className="mt-8 px-2 space-y-4 pt-6 border-t border-slate-100">
                            {user ? (
                                <>
                                    <div className="px-4 py-2 text-slate-500 text-sm flex items-center justify-between">
                                        <span>ログイン中: {user.email}</span>
                                        {getRoleBadge(user.userType)}
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full bg-slate-50 text-slate-700 py-3.5 rounded-xl font-bold hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center justify-center"
                                    >
                                        <LogOut size={18} className="mr-2" /> ログアウト
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center text-slate-600 py-3.5 font-bold hover:text-brand-600 transition-colors">
                                        ログイン
                                    </Link>
                                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all">
                                        新規登録
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
