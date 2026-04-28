import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Cleanup old large datasets from localStorage to free up space for Supabase session
const keysToRemove = [
  'viking_clients',
  'viking_professionals',
  'viking_appointments',
  'viking_transactions',
  'viking_inventory',
  'viking_products',
  'viking_drinks',
  'viking_rewards',
  'viking_loyalty_transactions',
  'viking_blocked_times',
  'viking_management_transactions',
  'viking_management_categories'
];
keysToRemove.forEach(key => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Failed to remove ${key} from localStorage`, e);
  }
});

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e) {
  console.error('Failed to render app:', e);
  document.getElementById('root')!.innerHTML = '<div style="color: white; padding: 20px;">Erro crítico ao carregar aplicação.</div>';
}
