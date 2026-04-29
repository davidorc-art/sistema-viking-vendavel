import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

console.log('SERVER: File loaded at', new Date().toISOString());
console.log('SERVER: process.env.NODE_ENV =', process.env.NODE_ENV);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

console.log('SERVER: Iniciando servidor...');
console.log('SERVER: NODE_ENV =', process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

// Lazy initialization for Supabase to prevent crash on startup if ENV is missing
let supabase: any = null;
let supabaseAdmin: any = null;

const getSupabase = () => {
  if (!supabase && supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

const getSupabaseAdmin = () => {
  if (!supabaseAdmin && supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
};

const INFINITEPAY_API_KEY = process.env.INFINITEPAY_API_KEY;
const INFINITEPAY_TAG = process.env.INFINITEPAY_TAG;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Mercado Pago initialization
  let mpClient: any = null;
  const getMPClient = async () => {
    if (!mpClient && process.env.MERCADOPAGO_ACCESS_TOKEN) {
      const { MercadoPagoConfig, PreApproval } = await import('mercadopago');
      mpClient = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });
    }
    return mpClient;
  };

  // Mercado Pago Webhook (IPN/Webhooks)
  app.post('/api/webhooks/mercadopago', async (req, res) => {
    const { action, type, data } = req.body;
    console.log('Mercado Pago Event Received:', { action, type, data });

    try {
      if (type === 'subscription_preapproval' || action?.includes('subscription')) {
        const id = data.id;
        const { MercadoPagoConfig, PreApproval } = await import('mercadopago');
        const client = await getMPClient();
        
        if (client) {
          const preApproval = new PreApproval(client);
          const subData = await preApproval.get({ id });
          
          console.log('MP Subscription Data:', subData);

          // Find user by external_reference (which we should set as user_id)
          const userId = subData.external_reference;
          const admin = getSupabaseAdmin();
          
          if (userId && admin) {
            await admin
              .from('subscriptions')
              .update({
                status: subData.status === 'authorized' ? 'active' : subData.status,
                mercadopago_preapproval_id: subData.id,
                current_period_end: subData.next_payment_date
              })
              .eq('user_id', userId);
          }
        }
      }
    } catch (err) {
      console.error('Error handling Mercado Pago webhook:', err);
    }

    res.sendStatus(200);
  });

  // Request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get('/api/ping', async (req, res) => {
    console.log('PING hit');
    try {
      const client = getSupabase();
      if (!client) throw new Error('Supabase not configured');
      const { data, error } = await client.from('appointments').select('id').limit(1);
      if (error) throw error;
      res.json({ status: 'ok', message: 'pong', database: 'connected' });
    } catch (err: any) {
      console.error('Ping database error:', err);
      res.json({ status: 'ok', message: 'pong', database: 'error', details: err.message });
    }
  });

  app.post('/api/ping', express.json(), (req, res) => {
    console.log('PING POST:', req.body);
    res.json({ status: 'ok' });
  });

  app.get('/api/debug-env', (req, res) => {
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      APP_URL: process.env.APP_URL,
      SHARED_APP_URL: process.env.SHARED_APP_URL,
      INFINITEPAY_TAG: process.env.INFINITEPAY_TAG ? 'Configured' : 'Missing',
      INFINITEPAY_API_KEY: process.env.INFINITEPAY_API_KEY ? 'Configured' : 'Missing',
      headers: req.headers,
      cwd: process.cwd(),
    });
  });

  app.get('/api/debug/db', async (req, res) => {
    try {
      const client = getSupabase();
      if (!client) throw new Error('Supabase not configured');
      
      // Check if we can select from appointments
      const { data: appts, error: apptError } = await client.from('appointments').select('*').limit(1);
      
      // Check if we can select from transactions
      const { data: trans, error: transError } = await client.from('transactions').select('*').limit(1);

      res.json({
        appointments: {
          connected: !apptError,
          error: apptError,
          sample: appts?.[0] ? Object.keys(appts[0]) : 'No data'
        },
        transactions: {
          connected: !transError,
          error: transError,
          sample: trans?.[0] ? Object.keys(trans[0]) : 'No data'
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/debug/supabase-anon', async (req, res) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: appointments, error: apptError } = await supabase.from('appointments').select('*');
      const { data: blockedTimes, error: blockError } = await supabase.from('blocked_times').select('*');
      
      res.json({
        appointments: appointments,
        blockedTimes: blockedTimes,
        apptError,
        blockError
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get('/api/public/booking-data', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const { data: professionals } = await admin.from('professionals').select('*');
      const { data: blocked_times } = await admin.from('blocked_times').select('*');
      
      const lastDay = new Date();
      lastDay.setDate(lastDay.getDate() - 1);
      const dateString = lastDay.toISOString().split('T')[0];
      
      const { data: appointments } = await admin.from('appointments')
        .select('id, professional_id, date, time, duration, client_id, status')
        .gte('date', dateString);
        
      const { data: settings } = await admin.from('settings').select('*').limit(1);
      
      res.json({
        professionals: professionals || [],
        blocked_times: blocked_times || [],
        appointments: appointments || [],
        settings: settings?.[0] || null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/public/clients/search', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const { cpf } = req.query;
      if (!cpf || typeof cpf !== 'string') return res.status(400).json({ error: 'CPF required' });
      
      const cleanCpf = cpf.replace(/\D/g, '');
      const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      
      console.log('SERVER: Searching client with CPF:', { cleanCpf, formattedCpf });
      
      const { data, error } = await admin
        .from('clients')
        .select('*')
        .or(`cpf.eq.${cleanCpf},cpf.eq.${formattedCpf}`);
      
      if (error) throw error;
      
      console.log('SERVER: Search result count:', data?.length || 0);
      res.json({ success: true, data: data || [] });
    } catch (err: any) {
      console.error('SERVER: Search error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/public/clients', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const payload = req.body;
      const { data, error } = await admin.from('clients').insert([payload]).select();
      
      if (error) throw error;
      res.json({ success: true, data: data?.[0] || null });
    } catch (err: any) {
      console.error('SERVER: Insert client error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/public/clients/update/:id', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const payload = req.body;
      const { data, error } = await admin.from('clients').update(payload).eq('id', req.params.id).select();
      
      if (error) throw error;
      res.json({ success: true, data: data?.[0] || null });
    } catch (err: any) {
      console.error('SERVER: Update client error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/public/appointments', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const payload = req.body;
      const { data, error } = await admin.from('appointments').insert([payload]).select();
      
      if (error) throw error;
      res.json({ success: true, data: data?.[0] || null });
    } catch (err: any) {
      console.error('SERVER: Insert appt error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/public/appointments/update/:id', async (req, res) => {
    try {
      const admin = getSupabaseAdmin();
      if (!admin) return res.status(500).json({ error: 'DB not configured' });
      
      const payload = req.body;
      const { data, error } = await admin.from('appointments').update(payload).eq('id', req.params.id).select();
      
      if (error) throw error;
      res.json({ success: true, data: data?.[0] || null });
    } catch (err: any) {
      console.error('SERVER: Update appt error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/debug/infinitepay', async (req, res) => {
    const apiKey = (process.env.INFINITEPAY_API_KEY || '').trim();
    const tag = (process.env.INFINITEPAY_TAG || '').trim().replace(/^[@$]/, '');
    
    try {
      // Try GET with provided key
      const response = await fetch('https://api.infinitepay.io/invoices/public/checkout/links?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': apiKey
        }
      });
      
      const status = response.status;
      const text = await response.text();
      
      // Try with Bearer if first failed
      let bearerStatus = null;
      let bearerText = null;
      
      if (status === 401) {
        const bearerResponse = await fetch('https://api.infinitepay.io/invoices/public/checkout/links?limit=1', {
          method: 'GET',
          headers: {
            'Authorization': apiKey.toLowerCase().startsWith('bearer ') ? apiKey : `Bearer ${apiKey}`
          }
        });
        bearerStatus = bearerResponse.status;
        bearerText = await bearerResponse.text();
      }
      
      res.json({
        config: {
          tag,
          apiKeyLength: apiKey.length,
          apiKeyPrefix: apiKey.substring(0, 4),
          apiKeySuffix: apiKey.substring(apiKey.length - 4),
          hasBearerPrefix: apiKey.toLowerCase().startsWith('bearer '),
          isUrlError: apiKey.startsWith('http')
        },
        warning: apiKey.startsWith('http') ? 'A INFINITEPAY_API_KEY parece ser uma URL. Ela deve ser uma chave alfanumérica.' : null,
        infinitePayResponse: {
          status,
          body: text.substring(0, 500)
        },
        bearerRetry: bearerStatus ? {
          status: bearerStatus,
          body: bearerText?.substring(0, 500)
        } : null
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });



  // Calendar Feed Route
  app.get('/api/calendar/feed', async (req, res) => {
    console.log('Calendar feed requested');
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*');

      if (error) throw error;

      const foldLine = (line: string) => {
        const parts = [];
        let current = line;
        while (current.length > 70) {
          parts.push(current.slice(0, 70));
          current = ' ' + current.slice(70);
        }
        parts.push(current);
        return parts.join('\r\n');
      };

      const escapeString = (str: string) => {
        if (!str) return '';
        return str.replace(/[\\,;]/g, (match) => `\\${match}`).replace(/\n/g, '\\n');
      };

      const formatICSDate = (date: Date, isUTC: boolean = false) => {
        if (isUTC) {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        }
        // Format as "floating time" (no Z at the end)
        // This tells the calendar client to use the exact numbers provided in whatever timezone the user is in
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
      };

      let ics = 'BEGIN:VCALENDAR\r\n';
      ics += 'VERSION:2.0\r\n';
      ics += 'PRODID:-//Tattoo App//PT\r\n';
      ics += 'CALSCALE:GREGORIAN\r\n';
      ics += 'METHOD:PUBLISH\r\n';
      ics += 'X-WR-CALNAME:Agenda Tattoo\r\n';
      ics += 'X-WR-CALDESC:Agendamentos do Tattoo App\r\n';
      ics += 'X-WR-TIMEZONE:America/Sao_Paulo\r\n';
      ics += 'X-PUBLISHED-TTL:PT15M\r\n';
      ics += 'REFRESH-INTERVAL;VALUE=DURATION:PT15M\r\n';

      const now = formatICSDate(new Date(), true);

      appointments?.forEach(app => {
        const date = app.date || app.data;
        const time = app.time || app.hora;
        const service = app.service || app.servico || 'Serviço';
        const clientName = app.client_name || app.clientname || app.nomeCliente || 'Cliente';
        const professionalName = app.professional_name || app.professionalname || 'N/A';
        const value = app.value || app.valor || app.total_value || 0;

        if (!date || !time) return;

        try {
          const [year, month, day] = date.split('-').map(Number);
          const [hours, minutes] = time.split(':').map(Number);
          
          // Create a local date object using the exact numbers from the database
          const startDate = new Date(year, month - 1, day, hours, minutes);
          
          if (isNaN(startDate.getTime())) return;

          const durationMinutes = app.duration || 60;
          const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

          // Use floating time for start and end (no Z)
          const dtstart = formatICSDate(startDate);
          const dtend = formatICSDate(endDate);
          
          // Use UTC for stamps
          const dtstamp = app.created_at ? formatICSDate(new Date(app.created_at), true) : now;
          const lastModified = app.updated_at ? formatICSDate(new Date(app.updated_at), true) : now;
          
          // Generate a sequence number based on updated_at to force Google Calendar to recognize updates
          const sequence = app.updated_at ? Math.floor(new Date(app.updated_at).getTime() / 1000) : 0;

          let status = 'TENTATIVE';
          if (app.status === 'Confirmado' || app.status === 'Finalizado' || app.status === 'Pago') status = 'CONFIRMED';
          if (app.status === 'Cancelado' || app.status === 'Falta') status = 'CANCELLED';

          ics += 'BEGIN:VEVENT\r\n';
          ics += `UID:${app.id}@tattooapp.local\r\n`;
          ics += `DTSTAMP:${dtstamp}\r\n`;
          ics += `LAST-MODIFIED:${lastModified}\r\n`;
          ics += `DTSTART:${dtstart}\r\n`;
          ics += `DTEND:${dtend}\r\n`;
          ics += foldLine(`SUMMARY:${escapeString(`${service} - ${clientName}`)}`) + '\r\n';
          ics += foldLine(`DESCRIPTION:${escapeString(`Profissional: ${professionalName}\nStatus: ${app.status}\nValor: R$ ${value}`)}`) + '\r\n';
          ics += `STATUS:${status}\r\n`;
          ics += 'TRANSP:OPAQUE\r\n';
          ics += `SEQUENCE:${sequence}\r\n`;
          ics += 'END:VEVENT\r\n';
        } catch (e) {
          console.error('Error formatting event for ICS:', e);
        }
      });

      ics += 'END:VCALENDAR\r\n';

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="agenda.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.send(ics);
    } catch (error) {
      console.error('Error generating ICS feed:', error);
      res.status(500).send('Error generating calendar feed');
    }
  });

  app.post('/api/whatsapp/notify-creation', async (req, res) => {
    console.log('WHATSAPP: Received notification request');
    try {
      const { phone, clientName, service, professionalName, date, time } = req.body;
      
      if (!phone || !clientName) {
        console.warn('WHATSAPP: Missing required fields:', { phone, clientName });
        return res.status(400).json({ error: 'Missing phone or clientName' });
      }

      console.log(`WHATSAPP: Notifying ${clientName} (${phone}) for ${service} on ${date} at ${time}`);

      const message = `Olá ${clientName}! Seu agendamento de ${service} com ${professionalName} para o dia ${date} às ${time} foi recebido com sucesso. Aguardamos você!`;
      
      console.log('WHATSAPP MESSAGE CONTENT:', message);

      // Return success to the frontend immediately to avoid blocking
      res.status(200).json({ success: true, message: 'Notification received by Valhalla server' });
    } catch (error: any) {
      console.error('WHATSAPP ROUTE ERROR:', error);
      res.status(500).json({ error: error.message || 'Internal server error in notification route' });
    }
  });

  // Catch-all for API routes that didn't match
  app.all('/api/*', (req, res) => {
    console.log(`API 404: ${req.method} ${req.url}`);
    res.status(404).json({ error: 'API route not found', path: req.url });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('SERVER: Encerrando servidor...');
    server.close(() => {
      console.log('SERVER: Servidor HTTP encerrado.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();
