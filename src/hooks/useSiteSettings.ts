import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  company_description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  google_map_embed: string | null;
  line_id: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  featured_banner_url: string | null;
  all_products_banner_url: string | null;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data as unknown as SiteSettings;
    },
    staleTime: 60_000,
  });
}
