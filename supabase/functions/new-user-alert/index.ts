// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = 'aoneko.move@gmail.com'

serve(async (req) => {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    try {
        const { record } = await req.json()
        const { email, phone, aoneko_id, name } = record

        if (!RESEND_API_KEY) {
            console.log("Mocking Email Send to Admin:", { email, phone, aoneko_id })
            console.log("Mocking Welcome Email to User:", { email, aoneko_id })
            return new Response(JSON.stringify({ message: "Mock email logged" }), { status: 200 })
        }

        // 1. Send Admin Alert
        const adminRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Aoneko System <system@aonekomove.com>',
                to: ADMIN_EMAIL,
                subject: `New User Registered: ${aoneko_id}`,
                html: `
          <h1>New User Alert</h1>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>ID:</strong> ${aoneko_id}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
        `
            })
        })

        // 2. Send Welcome Email to User
        const userRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Aoneko Move <welcome@aonekomove.com>',
                to: email,
                subject: 'Welcome to Aoneko Move',
                html: `
          <h1>Welcome, ${name}!</h1>
          <p>Thank you for registering.</p>
          <p>Your Member ID is: <strong>${aoneko_id}</strong></p>
        `
            })
        })

        return new Response(
            JSON.stringify({ admin: await adminRes.json(), user: await userRes.json() }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        })
    }
})
