import React from 'react';

interface EmailProps {
    customerName: string;
    vehicleName: string; // 'Light Van (軽バン)' or 'Pick-up (軽トラック)'
    pickupAddress: string;
    deliveryAddress: string;
    pickupDate: string;
    pickupTime: string;
    distanceKm: number;
    totalPrice: number;
    trackingNumber: string;
}

export const ConfirmationEmailTemplate: React.FC<EmailProps> = ({
    customerName,
    vehicleName,
    pickupAddress,
    deliveryAddress,
    pickupDate,
    pickupTime,
    distanceKm,
    totalPrice,
    trackingNumber,
}) => {
    // Styles
    const styles = {
        container: {
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            backgroundColor: '#f8fafc',
            padding: '40px 20px',
            color: '#334155',
        },
        card: {
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
        },
        header: {
            backgroundColor: '#0f172a', // Slate 900
            padding: '30px',
            textAlign: 'center' as const,
        },
        logoText: {
            color: '#ffffff',
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
        },
        body: {
            padding: '40px 30px',
        },
        h1: {
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#0f172a',
            marginTop: 0,
            marginBottom: '20px',
        },
        text: {
            fontSize: '16px',
            lineHeight: '1.6',
            marginBottom: '20px',
        },
        highlightBox: {
            backgroundColor: '#f1f5f9', // Slate 100
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '30px',
        },
        detailRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            borderBottom: '1px dashed #cbd5e1',
            paddingBottom: '8px',
        },
        label: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#64748b',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
        },
        value: {
            fontSize: '15px',
            fontWeight: 'bold',
            color: '#0f172a',
            textAlign: 'right' as const,
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '2px solid #0f172a',
        },
        totalLabel: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#0f172a',
        },
        totalValue: {
            fontSize: '24px',
            fontWeight: '900',
            color: '#2563eb', // Brand Blue
        },
        button: {
            display: 'block',
            width: '100%',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            padding: '16px',
            textAlign: 'center' as const,
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: 'bold',
            fontSize: '16px',
            marginBottom: '30px',
        },
        footer: {
            backgroundColor: '#f8fafc',
            padding: '20px 30px',
            textAlign: 'center' as const,
            fontSize: '13px',
            color: '#94a3b8',
            borderTop: '1px solid #e2e8f0',
        },
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.logoText}>AONEKO MOVE</h1>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    <h2 style={styles.h1}>見積もりの保存が完了しました</h2>
                    <p style={styles.text}>
                        {customerName} 様、<br />
                        Aoneko Moveをご利用いただきありがとうございます。以下の内容で見積もりを保存いたしました。
                    </p>

                    {/* Quote Details Box */}
                    <div style={styles.highlightBox}>
                        <div style={styles.detailRow}>
                            <span style={styles.label}>お問い合わせ番号</span>
                            <span style={styles.value}>{trackingNumber}</span>
                        </div>
                        <div style={styles.detailRow}>
                            <span style={styles.label}>車両タイプ</span>
                            <span style={styles.value}>{vehicleName}</span>
                        </div>
                        <div style={styles.detailRow}>
                            <span style={styles.label}>集荷予定日</span>
                            <span style={styles.value}>{pickupDate} {pickupTime}</span>
                        </div>
                        <div style={styles.detailRow}>
                            <span style={styles.label}>移動距離</span>
                            <span style={styles.value}>{distanceKm} km</span>
                        </div>

                        <div style={{ margin: '20px 0' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>FROM (集荷先)</div>
                                <div style={{ fontWeight: 'bold' }}>{pickupAddress}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>TO (配送先)</div>
                                <div style={{ fontWeight: 'bold' }}>{deliveryAddress}</div>
                            </div>
                        </div>

                        <div style={styles.totalRow}>
                            <span style={styles.totalLabel}>合計金額 (税込)</span>
                            <span style={styles.totalValue}>¥{totalPrice.toLocaleString()}</span>
                        </div>
                    </div>

                    <p style={styles.text}>
                        この見積もりの有効期限は作成から7日間です。予約を確定するには、以下のボタンをクリックしてください。
                    </p>

                    <a href={`https://aonekomove.com/tracking?id=${trackingNumber}`} style={styles.button}>
                        予約手続きへ進む / Confirm Booking
                    </a>
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p style={{ margin: '0 0 10px 0' }}>AONEKO MOVE (アオネコムーブ)</p>
                    <p style={{ margin: 0 }}>
                        お問い合わせ: support@aonekomove.com<br />
                        TEL: 0120-000-000
                    </p>
                </div>
            </div>
        </div>
    );
};
