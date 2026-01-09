import React from 'react';
import { PricingOutput } from '../hooks/usePricingCalculator';

interface Props {
    pricing: PricingOutput;
    debugMode?: boolean; // Para ver el desglose interno
}

const PriceBreakdown: React.FC<Props> = ({ pricing, debugMode = false }) => {
    if (!pricing.isValid) return null;

    // Formateador de moneda para JPY
    const fmt = (amount: number) => `¥${amount.toLocaleString('ja-JP')}`;

    return (
        <div style={styles.container}>
            {/* Sección Cliente */}
            <div style={styles.section}>
                <h3 style={styles.title}>Desglose Estimado / お見積り内訳</h3>

                <div style={styles.row}>
                    <span>Tarifa Base (Flete) / 基本運賃</span>
                    <span>{fmt(pricing.base_fare)}</span>
                </div>

                <div style={styles.row}>
                    <span>+ Peajes / 高速道路料金</span>
                    <span>{fmt(pricing.net_price - pricing.base_fare - pricing.tax_amount - (pricing.net_price - pricing.base_fare - pricing.tax_amount))} {/* Lógica simplificada visualmente */}
                        {/* Mejor calculamos los extras restando la base al neto para mostrar extras agregados si no pasamos las props individuales */}
                        {/* Nota: Para simplicidad visual mostramos el Subtotal directo abajo */}
                    </span>
                </div>

                <div style={styles.divider}></div>

                <div style={styles.rowBold}>
                    <span>Subtotal (Neto) / 税抜合計</span>
                    <span>{fmt(pricing.net_price)}</span>
                </div>

                <div style={styles.row}>
                    <span>+ Impuesto (10%) / 消費税</span>
                    <span>{fmt(pricing.tax_amount)}</span>
                </div>

                <div style={styles.totalRow}>
                    <span>Total a Pagar / お支払い総額</span>
                    <span style={{ color: '#0056b3' }}>{fmt(pricing.total_customer_price)}</span>
                </div>
            </div>

            {/* Sección Interna (Debug/Admin) */}
            {debugMode && (
                <div style={styles.debugSection}>
                    <h4 style={styles.debugTitle}>📊 Reparto Interno (Admin)</h4>
                    <div style={styles.row}>
                        <span>Empresa (20%):</span>
                        <span style={{ color: '#28a745' }}>{fmt(pricing.company_revenue)}</span>
                    </div>
                    <div style={styles.row}>
                        <span>Conductor (80%):</span>
                        <span style={{ color: '#28a745' }}>{fmt(pricing.driver_revenue)}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// Estilos básicos en objeto (CSS-in-JS simple)
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        padding: '20px',
        marginTop: '20px',
        border: '1px solid #e0e0e0',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    title: {
        margin: '0 0 15px 0',
        fontSize: '1.1rem',
        color: '#333',
        borderBottom: '2px solid #0056b3', // Azul Aoneko
        paddingBottom: '8px',
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.95rem',
        color: '#555',
    },
    rowBold: {
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: 'bold',
        fontSize: '1rem',
        color: '#333',
    },
    divider: {
        height: '1px',
        backgroundColor: '#ddd',
        margin: '10px 0',
    },
    totalRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontWeight: '800',
        fontSize: '1.25rem',
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: '2px dashed #ccc',
    },
    debugSection: {
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px dashed #999',
        fontSize: '0.85rem',
    },
    debugTitle: {
        margin: '0 0 5px 0',
        fontSize: '0.9rem',
        color: '#666',
    }
};

export default PriceBreakdown;
