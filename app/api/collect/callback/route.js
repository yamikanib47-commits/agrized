import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(req) {
  try {
    const body = await req.json()
    console.log('Lipila callback:', body)

    const { referenceId, status } = body
    if (!referenceId) return NextResponse.json({ error: 'No referenceId' }, { status: 400 })

    if (status === 'Successful') {
      // Update payment record
      await supabase
        .from('payments')
        .update({ status: 'successful', paid_at: new Date().toISOString() })
        .eq('lipila_reference_id', referenceId)

      // Get order id from payment
      const { data: payment } = await supabase
        .from('payments')
        .select('order_id')
        .eq('lipila_reference_id', referenceId)
        .single()

      if (payment?.order_id) {
        await supabase
          .from('orders')
          .update({
            status: 'delivered',
            payment_reference: referenceId,
            paid_at: new Date().toISOString()
          })
          .eq('id', payment.order_id)
      }
    } else {
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('lipila_reference_id', referenceId)
    }

    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('Callback error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}