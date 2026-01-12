import React from 'react';
import { Delivery } from '../../types/Order';

interface LogisticsViewerProps {
    orders: Delivery[];
}

export const LogisticsViewer: React.FC<LogisticsViewerProps> = ({ orders }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-lg text-slate-800">物流状況・オーダー</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-slate-100">追跡番号</th>
                            <th className="p-4 font-bold border-b border-slate-100">ステータス</th>
                            <th className="p-4 font-bold border-b border-slate-100">集荷先</th>
                            <th className="p-4 font-bold border-b border-slate-100">配送先</th>
                            <th className="p-4 font-bold border-b border-slate-100">車種</th>
                            <th className="p-4 font-bold border-b border-slate-100">料金</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 border-b border-slate-100 font-mono font-bold text-brand-600">
                                    {order.trackingNumber}
                                </td>
                                <td className="p-4 border-b border-slate-100">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'delivered' ? 'bg-slate-100 text-slate-500' :
                                            order.status === 'searching_driver' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                                                'bg-brand-50 text-brand-600'
                                        }`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="p-4 border-b border-slate-100 text-slate-600 max-w-xs truncate">
                                    {order.pickup.address}
                                </td>
                                <td className="p-4 border-b border-slate-100 text-slate-600 max-w-xs truncate">
                                    {order.delivery.address}
                                </td>
                                <td className="p-4 border-b border-slate-100 text-slate-600 text-xs uppercase font-bold">
                                    {order.vehicle.type}
                                </td>
                                <td className="p-4 border-b border-slate-100 font-mono font-bold text-slate-800">
                                    ¥{order.price.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
