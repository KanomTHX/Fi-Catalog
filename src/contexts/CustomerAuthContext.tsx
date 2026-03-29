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

  const fetchCustomer = useCallback(async (userId: string, email: string | undefined) => {
    // Try to find customer by auth_user_id first
    let { data } = await supabase
      .from("customers")
      .select("id, display_name, phone, address, picture_url")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (!data && email) {
      // Try matching by phone (fallback)
      // No match — customer will be created at checkout
    }

    setCustomer(data as CustomerProfile | null);
  }, []);

  const refreshCustomer = useCallback(async () => {
    if (user) await fetchCustomer(user.id, user.email);
  }, [user, fetchCustomer]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchCustomer(session.user.id, session.user.email);
      } else {
        setCustomer(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCustomer(session.user.id, session.user.email);
      }
      setLoading(false);
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
