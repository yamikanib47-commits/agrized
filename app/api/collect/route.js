import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const { amount, accountNumber, referenceId, orderId, network } = await req.json()

    // Store pending payment
    await supabase.from('payments').insert({
      order_id: orderId,
      lipila_reference_id: referenceId,
      amount_zmw: amount,
      network,
      customer_phone: accountNumber,
      status: 'pending'
    })

    // Call Lipila
    const callbackUrl = process.env.NEXT_PUBLIC_APP_URL + '/api/collect/callback'

    const res = await fetch('https://api.lipila.dev/api/v1/collections/mobile-money', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.LIPILA_API_KEY,
        'callbackUrl': callbackUrl
      },
      body: JSON.stringify({
        referenceId,
        amount,
        narration: 'Agrized order payment',
        accountNumber,
        currency: 'ZMW'
      })
    })

    const text = await res.text()
    console.log('Lipila response:', text)
    if (!text) return NextResponse.json({ error: 'Empty Lipila response' }, { status: 500 })

    let data
    try { data = JSON.parse(text) } catch { return NextResponse.json({ error: 'Non-JSON from Lipila' }, { status: 500 }) }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    console.error('Collect error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}