import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number | null;
  image_url: string | null;
  category_id: string | null;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

export default function Showcase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [liffReady, setLiffReady] = useState(false);
  const [liffProfile, setLiffProfile] = useState<{ displayName?: string; pictureUrl?: string } | null>(null);

  // Initialize LIFF
  useEffect(() => {
    async function initLiff() {
      try {
        const { data } = await supabase.from("line_settings").select("liff_id").limit(1).single();
        if (data?.liff_id) {
          const liff = (await import("@line/liff")).default;
          await liff.init({ liffId: data.liff_id });
          setLiffReady(true);
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLiffProfile({ displayName: profile.displayName, pictureUrl: profile.pictureUrl });
          }
        }
      } catch {
        // LIFF not configured or not in LINE browser — continue without it
      }
    }
    initLiff();
  }, []);

  // Fetch products and categories
  useEffect(() => {
    async function fetchData() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, selling_price, image_url, category_id, categories(name)").order("name"),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (prodRes.data) setProducts(prodRes.data as Product[]);
      if (catRes.data) setCategories(catRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === "all" || p.category_id === selectedCat;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  const formatPrice = (price: number | null) => {
    if (price == null) return "-";
    return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/20 font-bold text-sm">
            SF
          </div>
          <h1 className="text-lg font-bold flex-1">StockFlow Showcase</h1>
          {liffProfile && (
            <div className="flex items-center gap-2">
              {liffProfile.pictureUrl && (
                <img src={liffProfile.pictureUrl} alt="" className="h-7 w-7 rounded-full" />
              )}
              <span className="text-sm opacity-90">{liffProfile.displayName}</span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCat === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCat === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border border-border animate-pulse">
                <div className="aspect-square bg-muted rounded-t-xl" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">ไม่พบสินค้า</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-muted relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-3xl">
                      📦
                    </div>
                  )}
                  {product.categories?.name && (
                    <Badge className="absolute top-2 left-2 text-[10px]" variant="secondary">
                      {product.categories.name}
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">SKU: {product.sku}</p>
                  )}
                  <p className="text-primary font-bold text-base mt-1">
                    {formatPrice(product.selling_price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          {filtered.length} สินค้า • Powered by StockFlow
        </p>
      </div>
    </div>
  );
}
