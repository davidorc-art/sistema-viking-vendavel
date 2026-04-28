import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { appointmentId, value, description, clientName, clientEmail } = req.body;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('Mercado Pago config missing: MERCADOPAGO_ACCESS_TOKEN');
    return res.status(500).json({ 
      error: `Configuração incompleta. Variável ausente: MERCADOPAGO_ACCESS_TOKEN no Vercel Dashboard.` 
    });
  }

  if (!value || isNaN(Number(value)) || Number(value) <= 0) {
    return res.status(400).json({ error: 'O valor do serviço deve ser maior que zero para gerar um checkout.' });
  }

  // Use the Origin header from the request, or fallback to environment variables
  const origin = req.headers.origin;
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  
  let appUrl = process.env.APP_URL;
  
  if (!appUrl) {
    if (origin) {
      appUrl = origin;
    } else if (host) {
      appUrl = `${protocol}://${host}`;
    } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      appUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    } else if (process.env.VERCEL_URL) {
      appUrl = `https://${process.env.VERCEL_URL}`;
    } else {
      appUrl = 'https://ais-dev-2tbowewzusbqf6dnvcjq6n-79836564543.us-east1.run.app';
    }
  }

  // Remove trailing slash if present
  appUrl = appUrl.replace(/\/$/, '');

  try {
    console.log('Creating Mercado Pago preference for:', clientName, 'Value:', value, 'ApptID:', appointmentId);

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: appointmentId,
            title: description || 'Agendamento - Viking Studio',
            quantity: 1,
            unit_price: Number(value),
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: clientName,
          email: clientEmail || 'pagamento@vikingstudio.com',
        },
        back_urls: {
          success: `${appUrl}/booking-success`,
          failure: `${appUrl}/pagamento/${appointmentId}`,
          pending: `${appUrl}/booking-success`
        },
        auto_return: 'approved',
        notification_url: `${appUrl}/api/payments/webhook`,
        external_reference: appointmentId,
      }
    });

    if (!result || !result.init_point) {
      throw new Error('Falha ao gerar link do Mercado Pago');
    }

    const paymentUrl = result.init_point;
    console.log('MERCADO PAGO: Link gerado com sucesso:', paymentUrl);

    // Update appointment with payment link URL
    const { error: supabaseError } = await supabase
      .from('appointments')
      .update({ 
        payment_url: paymentUrl,
        payment_status: 'Pendente',
        approval_status: 'Aguardando Pagamento'
      })
      .eq('id', appointmentId);

    if (supabaseError) {
      console.error('Supabase Error updating appointment:', supabaseError);
      return res.status(500).json({ 
        error: 'Falha ao atualizar o agendamento no banco de dados.',
        details: supabaseError.message
      });
    }

    return res.status(200).json({ url: paymentUrl });
  } catch (error: any) {
    console.error('CRITICAL Server Error:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor ao gerar checkout do Mercado Pago.', 
      details: error.message || String(error)
    });
  }
}
