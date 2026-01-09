
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const htmlTemplate = (data: any) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155; }
    .card { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background-color: #0f172a; padding: 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; }
    .body { padding: 40px 30px; }
    .highlight { background-color: #f1f5f9; border-radius: 12px; padding: 24px; margin-bottom: 30px; }
    .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
    .label { font-size: 14px; font-weight: bold; color: #64748b; text-transform: uppercase; }
    .value { font-size: 15px; font-weight: bold; color: #0f172a; text-align: right; }
    .total { margin-top: 20px; padding-top: 20px; border-top: 2px solid #0f172a; display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; }
    .button { display: block; width: 100%; background-color: #2563eb; color: #ffffff; padding: 16px; text-align: center; border-radius: 12px; text-decoration: none; font-weight: bold; margin-bottom: 30px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h1>AONEKO MOVE</h1></div>
    <div class="body">
      <h2>見積もりの保存が完了しました</h2>
      <p>${data.name} 様、<br>Aoneko Moveをご利用いただきありがとうございます。</p>
      
      <div class="highlight">
        <div class="row"><span class="label">お問い合わせ番号</span><span class="value">${data.id}</span></div>
        <div class="row"><span class="label">From</span><span class="value">${data.pickup}</span></div>
        <div class="row"><span class="label">To</span><span class="value">${data.delivery}</span></div>
        <div class="row"><span class="label">Distance</span><span class="value">${data.distance} km</span></div>
        <div class="total"><span>合計金額 (税込)</span><span style="color:#2563eb;">¥${Number(data.price).toLocaleString()}</span></div>
      </div>

      <a href="https://aonekomove.com/tracking?id=${data.id}" class="button">予約手続きへ進む / Confirm Booking</a>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    try {
        const payload = await req.json();
        const order = payload.record; // Webhook payload structure

        if (!order || !order.customer_email) {
            return new Response(JSON.stringify({ message: "No email provided in order" }), { status: 200 });
        }

        // Call Resend API
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Aoneko Move <onboarding@resend.dev>", // Or your verified domain
                to: [order.customer_email],
                subject: "【Aoneko Move】お見積もりの保存完了 / Quote Saved",
                html: htmlTemplate({
                    name: order.customer_name || 'Customer',
                    id: order.id,
                    pickup: order.pickup_address,
                    delivery: order.delivery_address,
                    distance: order.distance_km,
                    price: order.total_customer_price
                }),
            }),
        });

        const data = await res.json();
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
