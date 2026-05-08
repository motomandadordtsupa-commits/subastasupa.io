import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Solo aceptamos POST
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    // Mercado Pago envía los datos en la URL (query params) o en el body
    const url = new URL(req.url)
    const type = url.searchParams.get('type')
    const dataId = url.searchParams.get('data.id')

    let body = {}
    try {
      body = await req.json()
    } catch (e) {
      console.log("No JSON body")
    }

    const action = type || body.action || body.type
    const paymentId = dataId || body.data?.id

    if (action === 'payment' && paymentId) {
      // 1. Consultar a Mercado Pago el estado real de este pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`
        }
      })
      
      const paymentData = await mpResponse.json()

      if (paymentData.status === 'approved') {
        const auctionId = paymentData.metadata?.auction_id || paymentData.external_reference

        if (auctionId) {
          // Extraer la comisión exacta que cobró Mercado Pago
          const transactionAmount = paymentData.transaction_amount || 0;
          const netReceived = paymentData.transaction_details?.net_received_amount || transactionAmount;
          const mpFee = transactionAmount - netReceived;

          // 2. Conectar a Supabase usando el rol de administrador
          const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_DB_URL')
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
          
          if (!supabaseUrl || !supabaseKey) {
            throw new Error('Faltan credenciales de Supabase en el entorno')
          }

          const supabase = createClient(supabaseUrl, supabaseKey)

          // 3. Actualizar la subasta a "pagado" y guardar la comisión de MP
          const { error } = await supabase
            .from('auctions')
            .update({ payment_status: 'paid', mp_fee: mpFee })
            .eq('id', auctionId)

          if (error) throw error

          console.log(`Subasta ${auctionId} marcada como pagada con éxito.`)
        }
      }
    }

    return new Response('Webhook recibido', { status: 200 })
  } catch (error) {
    console.error('Error en webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
