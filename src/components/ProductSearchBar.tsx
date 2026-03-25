import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";

const formatPrice = (n: number | null) => n != null ? `฿${n.toLocaleString()}` : "";

export function ProductSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ["search-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, image_url, selling_price, discount_price").order("created_at", { ascending: false });
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const results = query.trim().length >= 1
    ? (products ?? []).filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative hidden md:block w-64 lg:w-80">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="ค้นหาสินค้า..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        className="pl-10 h-9 text-sm bg-secondary/50 border-border/50"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-accent text-left transition-colors"
              onClick={() => { navigate(`/products/${p.id}`); setOpen(false); setQuery(""); }}
            >
              {p.image_url ? (
                <img src={p.image_url} alt="" className="w-10 h-10 rounded-md object-contain bg-muted shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-foreground">{p.name}</p>
                <p className="text-xs text-primary font-medium">{formatPrice(p.discount_price ?? p.selling_price)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
