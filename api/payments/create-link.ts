import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { appointmentId, value, description, clientName, clientEmail } = req.body;

  const infinitePayTag = process.env.INFINITEPAY_TAG;

  if (!infinitePayTag) {
    console.error('Configuração de pagamento ausente: INFINITEPAY_TAG');
    return res.status(500).json({ 
      error: `Configuração incompleta. Por favor, configure o InfinitePay no Painel de Controle.` 
    });
  }

  if (!value || isNaN(Number(value)) || Number(value) <= 0) {
    return res.status(400).json({ error: 'O valor do serviço deve ser maior que zero para gerar um checkout.' });
  }

  try {
    console.log('Generating InfinitePay link for:', clientName, 'Value:', value);
    const formattedValue = Number(value).toFixed(2).replace('.', ',');
    const paymentUrl = `https://pay.infinitepay.io/${infinitePayTag}/${formattedValue}`;

    console.log('PAYMENT: Link gerado com sucesso:', paymentUrl);

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
      error: 'Erro interno do servidor ao gerar checkout.', 
      details: error.message || String(error)
    });
  }
}
