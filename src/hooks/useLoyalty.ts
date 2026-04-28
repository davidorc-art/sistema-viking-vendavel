import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Client } from '../types';

export interface LoyaltyStats {
  totalSpent: number;
  earnedPointsFromSpend: number;
  manualGains: number;
  totalRedeemed: number;
  availablePoints: number;
  level: 'Bronze' | 'Prata' | 'Ouro' | 'Viking';
  appointmentsCount: number;
  nextLevelPoints: number | null;
  progress: number;
}

export type ClientWithLoyalty = Client & {
  computedFirstVisit: string | null;
  computedLastVisit: string | null;
  loyaltyStats: LoyaltyStats;
};

export function useLoyalty(): ClientWithLoyalty[];
export function useLoyalty(clientId: string): ClientWithLoyalty | null;
export function useLoyalty(clientId?: string): ClientWithLoyalty[] | ClientWithLoyalty | null {
  const { clients, appointments, transactions, loyaltyTransactions } = useData();

  return useMemo(() => {
    const clientsWithStats: ClientWithLoyalty[] = clients.map(client => {
      // 1. Get all client appointments just for count and dates
      const clientAppts = appointments.filter(
        a => a.clientId === client.id && (a.status === 'Finalizado' || a.paymentStatus === 'Pago' || a.status === 'Confirmado')
      );
      
      const allApptDates = clientAppts
        .map(a => a.date)
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // 2. Calculate Total Spent FROM PAID VALUES ONLY (Transactions)
      const clientTransactions = transactions.filter(
        t => {
          const trans = t as any;
          const matchesClient = trans.clientId === client.id || trans.description?.toLowerCase().includes(client.name?.toLowerCase());
          return matchesClient && t.type === 'Receita';
        }
      );
      
      const spentOnStore = clientTransactions.reduce((acc, t) => acc + Number(t.value || 0), 0);

      // Check transaction dates to enrich first/last visit
      const allTxDates = clientTransactions
        .map(t => t.date?.split('T')[0])
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      // Legacy fallback: In the past, totalSpent was accumulated directly onto the client object. 
      // If our recount is smaller than what is stored on the client, it means they have legacy appointments that were purged.
      const calculatedSpent = spentOnStore;
      const legacySpent = Number(client.totalSpent || 0);
      const totalSpent = Math.max(calculatedSpent, legacySpent);

      const earnedPointsFromSpend = Math.floor(totalSpent); // 1 point per 1 BRL

      // 3. Calculate Manual Gains (Referrals, Bonus, Manual Adjustments)
      const manualGains = loyaltyTransactions
        .filter(t => 
          t.clientId === client.id && 
          t.type === 'Ganho' && 
          !t.description.startsWith('Agendamento') && 
          !t.description.startsWith('Reparo') && 
          !t.description.startsWith('Venda')
        )
        .reduce((acc, t) => acc + Number(t.points || 0), 0);

      // In case the user never registered appointments and ONLY used loyaltyTransactions directly in the past:
      const legacyLoyaltyEarned = loyaltyTransactions
        .filter(t => t.clientId === client.id && t.type === 'Ganho' && (t.description.startsWith('Agendamento') || t.description.startsWith('Reparo')))
        .reduce((acc, t) => acc + Number(t.points || 0), 0);

      // Final Earned Points is whichever is largest: what we calculate strictly from spend, OR what was historically given as points.
      // E.g., Adelmo spent money but doesn't have totalSpent saved properly, BUT he has legacy 'Agendamento:' transactions.
      const effectiveEarnedPoints = Math.max(earnedPointsFromSpend, legacyLoyaltyEarned);

      // 4. Calculate Redemptions
      const totalRedeemed = loyaltyTransactions
        .filter(t => t.clientId === client.id && t.type === 'Resgate')
        .reduce((acc, t) => acc + Number(t.points || 0), 0);

      // 5. Final Balance
      const availablePoints = Math.max(0, effectiveEarnedPoints + manualGains - totalRedeemed);

      // 6. Calculate Level
      let level: LoyaltyStats['level'] = 'Bronze';
      if (totalSpent >= 5000 || availablePoints >= 5000) level = 'Viking';
      else if (totalSpent >= 2500 || availablePoints >= 2500) level = 'Ouro';
      else if (totalSpent >= 1000 || availablePoints >= 1000) level = 'Prata';

      const nextLevelPoints = level === 'Bronze' ? 1000 : level === 'Prata' ? 2500 : level === 'Ouro' ? 5000 : null;
      let progress = 100;
      if (nextLevelPoints) {
        const currentTierBase = level === 'Ouro' ? 2500 : level === 'Prata' ? 1000 : 0;
        const tierRange = nextLevelPoints - currentTierBase;
        const pointsInTier = totalSpent - currentTierBase;
        progress = Math.max(0, Math.min(100, (pointsInTier / tierRange) * 100));
      }

      // Robust dates
      const allDates = [...allApptDates, ...allTxDates].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      const computedFirstVisit = allDates.length > 0 ? allDates[0] : (client.createdAt || null);
      const computedLastVisit = allDates.length > 0 ? allDates[allDates.length - 1] : (client.lastVisit || null);

      return {
        ...client,
        computedFirstVisit,
        computedLastVisit,
        loyaltyStats: {
          totalSpent,
          earnedPointsFromSpend,
          manualGains,
          totalRedeemed,
          availablePoints,
          level,
          appointmentsCount: clientAppts.length,
          nextLevelPoints,
          progress
        }
      };
    });

    if (clientId) {
      return clientsWithStats.find(c => c.id === clientId) || null;
    }

    // Return all clients sorted by best (Highest Total Spent)
    return clientsWithStats.sort((a, b) => b.loyaltyStats.totalSpent - a.loyaltyStats.totalSpent);
  }, [clients, appointments, transactions, loyaltyTransactions, clientId]);
};
