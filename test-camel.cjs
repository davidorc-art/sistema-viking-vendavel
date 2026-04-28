const toCamelCase = (obj) => {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

const raw = {
    id: '2f03c291-67ac-4c92-afc5-c341e78a9627',
    clientid: null,
    clientname: null,
    professionalid: null,
    professionalname: null,
    service: 'Serviço',
    date: '2026-04-13',
    time: '15:00',
    status: 'Finalizado',
    value: 200,
    duration: 60,
    created_at: '2026-03-27T05:54:27.795447+00:00',
    approval_status: 'Aprovado',
    client_id: '7221173f-7ed7-4b4a-9d0e-6624754ed22b',
    client_name: 'Jorge André Lobo da Silva',
    professional_id: '1235e171-02ac-4425-b348-ee10330e42f5',
    professional_name: 'David',
    cliente_id: null,
    data: '2026-04-13',
    hora: '15:00',
    servico: null,
    valor: null,
    consent_sent: false,
    consent_signed: false,
    consent_data: null,
    payment_status: 'Pago',
    payment_link_id: null,
    total_value: 0,
    deposit_percentage: 100,
    valor_total: 0,
    porcentagem_sinal: 100,
    totalvalue: 0,
    depositpercentage: 100,
    materials_used: [],
    stock_deducted: false,
    paid_value: 0,
    payment_url: null,
    user_id: null
  };

const camel = toCamelCase(raw);
console.log(camel);

const a = camel;
const professionalId = String(a.professionalId || a.professionalid || a.professional_id || a.profissionalId || a.profissional_id || '');
console.log('professionalId:', professionalId);
