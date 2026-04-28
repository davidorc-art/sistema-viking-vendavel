import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';

const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#eab308'];
const TATTOO_COLOR = '#f97316'; // Orange
const PIERCING_COLOR = '#3b82f6'; // Blue

export function DemographicsCharts() {
  const { clients, appointments } = useData();

  const cityData = useMemo(() => {
    const rawCounts: Record<string, { count: number, original: string }> = {};

    clients.forEach(c => {
      if (!c.city) return;
      let city = c.city.trim();
      let key = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Basic grouping intelligence for DF regions
      if (key.includes('samambaia')) key = 'samambaia';
      else if (key.includes('taguatinga')) key = 'taguatinga';
      else if (key.includes('ceilandia')) key = 'ceilandia';
      else if (key.includes('guara')) key = 'guara';
      else if (key === 'bsb' || key === 'df') key = 'brasilia';

      if (!rawCounts[key]) {
        rawCounts[key] = { count: 0, original: city };
      }
      rawCounts[key].count += 1;
    });

    const PRETTY_NAMES: Record<string, string> = {
      'brasilia': 'Brasília',
      'samambaia': 'Samambaia',
      'taguatinga': 'Taguatinga',
      'ceilandia': 'Ceilândia',
      'guara': 'Guará',
      'aguas claras': 'Águas Claras',
      'vicente pires': 'Vicente Pires',
      'gama': 'Gama',
      'planaltina': 'Planaltina',
      'recanto das emas': 'Recanto das Emas',
      'riacho fundo': 'Riacho Fundo',
      'sobradinho': 'Sobradinho',
      'cruzeiro': 'Cruzeiro',
      'lago sul': 'Lago Sul',
      'lago norte': 'Lago Norte',
      'sudoeste': 'Sudoeste',
      'noroeste': 'Noroeste',
      'sao sebastiao': 'São Sebastião',
      'santa maria': 'Santa Maria',
    };

    return Object.entries(rawCounts)
      .map(([key, data]) => {
        // Fallback title case if not in PRETTY_NAMES
        const name = PRETTY_NAMES[key] || data.original.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        return { name, count: data.count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [clients]);

  const ageData = useMemo(() => {
    // Determine age ranges including minors
    const ranges = [
      { id: '<18', min: 0, max: 17, label: '<18', piercing: 0, tattoo: 0 },
      { id: '18-24', min: 18, max: 24, label: '18-24', piercing: 0, tattoo: 0 },
      { id: '25-34', min: 25, max: 34, label: '25-34', piercing: 0, tattoo: 0 },
      { id: '35-44', min: 35, max: 44, label: '35-44', piercing: 0, tattoo: 0 },
      { id: '45+', min: 45, max: 200, label: '45+', piercing: 0, tattoo: 0 },
    ];

    clients.forEach(client => {
      if (!client.birthDate) return;
      
      const birth = new Date(client.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
        age--;
      }

      const clientAppointments = appointments.filter(a => a.clientId === client.id);
      let hasTattoo = clientAppointments.some(a => a.service.toLowerCase().includes('tatuagem') || a.service.toLowerCase().includes('tattoo'));
      let hasPiercing = clientAppointments.some(a => a.service.toLowerCase().includes('piercing') || a.service.toLowerCase().includes('perfuração') || a.service.toLowerCase().includes('joia'));

      if (!hasTattoo && !hasPiercing) return; 

      const range = ranges.find(r => age >= r.min && age <= r.max);
      if (range) {
        if (hasTattoo) range.tattoo += 1;
        if (hasPiercing) range.piercing += 1;
      }
    });

    return ranges;
  }, [clients, appointments]);

  if(cityData.length === 0 && ageData.every(d => d.tattoo === 0 && d.piercing === 0)) return null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card rounded-[2rem] p-6 space-y-6 min-w-0"
      >
        <div className="flex items-center gap-2">
           <h3 className="text-xl font-bold tracking-tight">Top Cidades</h3>
        </div>
        <div className="h-[250px] w-full min-w-0 text-sm font-medium">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={cityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {cityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.1)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '1rem', color: '#fff' }}
                 itemStyle={{ color: '#fff' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="glass-card rounded-[2rem] p-6 space-y-6 min-w-0"
      >
        <div className="flex items-center gap-2">
           <h3 className="text-xl font-bold tracking-tight">Faixa Etária por Serviço</h3>
        </div>
        <div className="h-[250px] w-full min-w-0 text-sm font-medium">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
              <XAxis dataKey="label" stroke="#ffffff40" tick={{ fill: '#ffffff80' }} interval={0} />
              <Tooltip 
                 contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '1rem', color: '#fff' }}
                 cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                 itemStyle={{ color: '#fff' }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="tattoo" name="Tatuagem" fill={TATTOO_COLOR} radius={[4, 4, 0, 0]} />
              <Bar dataKey="piercing" name="Piercing" fill={PIERCING_COLOR} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
