import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Package, Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number | null;
  image_url: string | null;
  category_id: string | null;
  brand: string | null;
  description: string | null;
  weight: number | null;
  location: string | null;
  categories: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const formatPrice = (price: number | null) => {
  if (price == null) return "-";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);
};

function ProductCard({ product, onClick, index }: { product: Product; onClick: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        {product.categories?.name && (
          <Badge className="absolute top-2.5 left-2.5 text-[10px] backdrop-blur-sm bg-background/80 text-foreground border-border/50" variant="outline">
            {product.categories.name}
          </Badge>
        )}
      </div>
      <div className="p-3.5">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-[11px] text-muted-foreground mt-0.5">{product.brand}</p>
        )}
        <p className="text-primary font-bold text-lg mt-1.5">
          {formatPrice(product.selling_price)}
        </p>
      </div>
    </motion.div>
  );
}

function ProductDetailDialog({ product, open, onClose }: { product: Product | null; open: boolean; onClose: () => void }) {
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        <div className="relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
          {product.categories?.name && (
            <Badge className="absolute top-4 left-4 backdrop-blur-sm bg-background/80 text-foreground" variant="outline">
              {product.categories.name}
            </Badge>
          )}
        </div>
        <div className="p-6 space-y-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-primary">{formatPrice(product.selling_price)}</span>
          </div>
          {(product.weight || product.location) && (
            <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              {product.weight && <span>น้ำหนัก: {product.weight} กก.</span>}
              {product.location && <span>ตำแหน่ง: {product.location}</span>}
            </div>
          )}
          {product.sku && (
            <p className="text-[11px] text-muted-foreground/60">SKU: {product.sku}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Showcase() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [liffProfile, setLiffProfile] = useState<{ displayName?: string; pictureUrl?: string } | null>(null);

  useEffect(() => {
    async function initLiff() {
      try {
        const { data } = await supabase.from("line_settings").select("liff_id").limit(1).single();
        if (data?.liff_id) {
          const liff = (await import("@line/liff")).default;
          await liff.init({ liffId: data.liff_id });
          if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            setLiffProfile({ displayName: profile.displayName, pictureUrl: profile.pictureUrl });
          }
        }
      } catch { }
    }
    initLiff();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, selling_price, image_url, category_id, brand, description, weight, location, categories(name)").order("name"),
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
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.3),transparent_70%)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-primary-foreground">StockFlow</h1>
            </motion.div>
            {liffProfile && (
              <div className="flex items-center gap-2">
                {liffProfile.pictureUrl && (
                  <img src={liffProfile.pictureUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-primary-foreground/30" />
                )}
                <span className="text-sm text-primary-foreground/90">{liffProfile.displayName}</span>
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
              สินค้าของเรา
            </h2>
            <p className="text-primary-foreground/70 text-sm">ค้นหาและเลือกดูสินค้าทั้งหมด</p>
          </motion.div>

          {/* Floating Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md mx-auto relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า หรือแบรนด์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-10 h-12 rounded-2xl bg-background/95 backdrop-blur-md border-0 shadow-lg text-base"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-20">
        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide"
        >
          <button
            onClick={() => setSelectedCat("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
              selectedCat === "all"
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${
                selectedCat === cat.id
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </motion.div>

        {/* Product Grid */}
        <div className="py-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-border">
                  <Skeleton className="aspect-square" />
                  <div className="p-3.5 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">ไม่พบสินค้า</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedCat + search}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                >
                  {filtered.map((product, i) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={i}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="pb-8 pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
          <p className="text-center text-xs text-muted-foreground">
            {filtered.length} สินค้า • Powered by <span className="font-semibold text-gradient">StockFlow</span>
          </p>
        </div>
      </div>

      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
