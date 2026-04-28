import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        if (app.status === 'Confirmado' || app.status === 'Finalizado') status = 'CONFIRMED';
        if (app.status === 'Cancelado' || app.status === 'Falta') status = 'CANCELLED';

        ics += 'BEGIN:VEVENT\r\n';
        ics += `UID:${app.id}@tattooapp.local\r\n`;
        ics += `DTSTAMP:${dtstamp}\r\n`;
        ics += `LAST-MODIFIED:${lastModified}\r\n`;
        // Use absolute UTC time (Z) instead of TZID to prevent timezone shifting bugs
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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return res.status(200).send(ics);
  } catch (error) {
    console.error('Error generating ICS feed:', error);
    return res.status(500).send('Error generating calendar feed');
  }
}
