import React from 'react';
import { User, Driver } from '../../types/User';

interface UsersTableProps {
    users: (User | Driver)[];
}

export const UsersTable: React.FC<UsersTableProps> = ({ users }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">登録ユーザー一覧</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-slate-100">Aoneko ID</th>
                            <th className="p-4 font-bold border-b border-slate-100">名前</th>
                            <th className="p-4 font-bold border-b border-slate-100">Email</th>
                            <th className="p-4 font-bold border-b border-slate-100">電話番号</th>
                            <th className="p-4 font-bold border-b border-slate-100">タイプ</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 border-b border-slate-100 font-mono text-brand-600 font-bold">
                                    {user.aonekoId || '-'}
                                </td>
                                <td className="p-4 border-b border-slate-100 font-medium text-slate-800">
                                    {user.name}
                                </td>
                                <td className="p-4 border-b border-slate-100 text-slate-500">
                                    {user.email}
                                </td>
                                <td className="p-4 border-b border-slate-100 text-slate-500 font-mono">
                                    {user.phone || '-'}
                                </td>
                                <td className="p-4 border-b border-slate-100">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.userType === 'driver' ? 'bg-indigo-50 text-indigo-600' :
                                            user.userType === 'admin' ? 'bg-rose-50 text-rose-600' :
                                                'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {user.userType}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
