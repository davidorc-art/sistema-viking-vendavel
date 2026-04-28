import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('MERCADOPAGO: Webhook received but ACCESS_TOKEN is missing');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const client = new MercadoPagoConfig({ accessToken });
  const payment = new Payment(client);

  // Mercado Pago webhook can come as params or body depending on the type
  const query = req.query;
  const body = req.body;
  
  const type = query.type || body.type;
  const id = query.id || body.data?.id || body.id;

  console.log('MERCADOPAGO Webhook received:', { type, id, body });

  if (type === 'payment' && id) {
    try {
      // Get payment details from Mercado Pago
      const paymentData = await payment.get({ id });
      
      console.log('MERCADOPAGO Payment Data:', paymentData);

      const appointmentId = paymentData.external_reference;
      const status = paymentData.status;

      if (!appointmentId) {
        console.warn('MERCADOPAGO: Payment received without external_reference (appointmentId)');
        return res.status(200).send('OK');
      }

      if (status === 'approved') {
        console.log(`MERCADOPAGO: Payment approved for appointment ${appointmentId}`);

        // Update appointment status to Confirmado since payment was received
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ 
            payment_status: 'Pago',
            approval_status: 'Aprovado', // Auto-approve on payment
            status: 'Confirmado'
          })
          .eq('id', appointmentId);

        if (updateError) {
          console.error('Webhook Supabase Error:', updateError);
          return res.status(500).json({ error: 'Failed to update appointment status' });
        }

        // Create a transaction for the paid amount
        try {
          // Get appointment to find user_id and value
          const { data: appointment } = await supabase
            .from('appointments')
            .select('*')
            .eq('id', appointmentId)
            .single();

          if (appointment) {
            const transactionId = Math.random().toString(36).substr(2, 9);
            await supabase
              .from('transactions')
              .insert([{
                id: transactionId,
                description: `Sinal - Agendamento ${appointment.client_name || 'Cliente'}`,
                value: appointment.value,
                type: 'Receita',
                category: 'Serviços',
                date: new Date().toISOString().split('T')[0],
                status: 'Pago',
                method: 'Cartão',
                appointment_id: appointmentId,
                user_id: appointment.user_id || null
              }]);
            console.log(`Transaction created for appointment ${appointmentId}`);
          }
        } catch (transErr) {
          console.error('Error creating transaction in webhook:', transErr);
        }
      } else {
        console.log(`MERCADOPAGO: Payment status for ${appointmentId} is ${status}`);
        
        // Update payment status if it failed or is pending
        await supabase
          .from('appointments')
          .update({ 
            payment_status: status === 'pending' ? 'Pendente' : 'Cancelado',
          })
          .eq('id', appointmentId);
      }
    } catch (error: any) {
      console.error('MERCADOPAGO: Error verifying payment:', error);
      return res.status(500).json({ error: 'Internal server error during verification' });
    }
  }

  return res.status(200).send('OK');
}
