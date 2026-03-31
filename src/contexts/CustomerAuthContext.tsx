import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface CustomerProfile {
  id: string;
  display_name: string;
  phone: string | null;
  address: string | null;
  picture_url: string | null;
}

interface CustomerAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  customer: CustomerProfile | null;
  signOut: () => Promise<void>;
  refreshCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);

  const fetchCustomer = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("customers")
        .select("id, display_name, phone, address, picture_url")
        .eq("auth_user_id", userId)
        .maybeSingle();
      setCustomer(data as CustomerProfile | null);
    } catch {
      // silently fail — customer data is optional
    }
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id);
  }, [user, fetchCustomer]);

  useEffect(() => {
    // 1. Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchCustomer(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for changes — NON-ASYNC callback, fire-and-forget fetchCustomer
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void fetchCustomer(session.user.id);
      } else {
        setCustomer(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCustomer]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, session, loading, customer, signOut, refreshCustomer }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
