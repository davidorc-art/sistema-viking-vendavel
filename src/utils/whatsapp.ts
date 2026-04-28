export const openWhatsApp = (phone: string, text: string = '') => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const encodedText = encodeURIComponent(text);
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (isAndroid) {
    const fallbackUrl = encodeURIComponent(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`);
    window.open(`intent://send?phone=${cleanPhone}&text=${encodedText}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;S.browser_fallback_url=${fallbackUrl};end`, '_blank');
  } else {
    // Para iOS e Web, usamos a API oficial que geralmente permite escolher ou abre o WA Business se for o único instalado
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
  }
};
