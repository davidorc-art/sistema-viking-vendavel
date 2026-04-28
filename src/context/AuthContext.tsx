import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Subscription {
  id: string;
  status: string;
  trial_ends_at: string;
  current_period_end: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  client: { id: string; name: string; cpf: string } | null;
  loading: boolean;
  subscription: Subscription | null;
  signOut: () => Promise<void>;
  clientLogin: (client: { id: string; name: string; cpf: string }) => void;
  clientLogout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<{ id: string; name: string; cpf: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (data) {
        setSubscription(data);
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 is row not found
        console.error('Error fetching subscription:', error);
      }
    } catch (err) {
      console.error('Failed to fetch subscription', err);
    }
  };

  useEffect(() => {
    // Check for saved client session
    const savedClient = localStorage.getItem('viking_client_session');
    if (savedClient) {
      try {
        setClient(JSON.parse(savedClient));
      } catch (e) {
        console.error('Failed to parse client session');
        localStorage.removeItem('viking_client_session');
      }
    }

    // Get initial session with safety timeout
    const timeout = setTimeout(() => {
      console.warn('AUTH: getSession timed out');
      setLoading(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      clearTimeout(timeout);
      console.error('AUTH: Error getting session:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  // Separate effect for subscription realtime updates
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      return;
    }

    fetchSubscription(user.id);

    const subChannel = supabase
      .channel(`sub_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (insert/update)
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('REALTIME: Subscription changed:', payload.new);
          setSubscription(payload.new as Subscription);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subChannel);
    };
  }, [user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const clientLogin = (clientData: { id: string; name: string; cpf: string }) => {
    setClient(clientData);
    localStorage.setItem('viking_client_session', JSON.stringify(clientData));
  };

  const clientLogout = () => {
    setClient(null);
    localStorage.removeItem('viking_client_session');
  };

  return (
    <AuthContext.Provider value={{ session, user, client, loading, subscription, signOut, clientLogin, clientLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
