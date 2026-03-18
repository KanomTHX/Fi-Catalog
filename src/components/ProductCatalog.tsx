import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Plus, Search, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  selling_price: number | null;
  discount_price: number | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  description: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ProductCatalogProps {
  onAddToCart: (product: Product) => void;
}

const formatPrice = (price: number | null) =>
  price != null ? `฿${price.toLocaleString()}` : "";

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, selling_price, discount_price, is_new, is_featured, category_id, description")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 30_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 60_000,
  });

  const featured = useMemo(
    () => products?.filter((p) => p.is_featured || p.is_new)?.slice(0, 8) ?? [],
    [products]
  );

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (selectedCat) list = list.filter((p) => p.category_id === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedCat, search]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    if (!categories || !products) return [];
    return categories
      .map((cat) => ({
        ...cat,
        items: products.filter((p) => p.category_id === cat.id),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, products]);

  return (
    <>
      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
            <div>
              <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-primary/20">แนะนำ</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าแนะนำ</h2>
            </div>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* Category sections */}
      {!selectedCat && !search.trim() && productsByCategory.map((cat) => (
        <section key={cat.id} className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold font-heading">{cat.name}</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => setSelectedCat(cat.id)}>
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {cat.items.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      ))}

      {/* All products with filter */}
      <section id="products" className="bg-secondary/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าทั้งหมด</h2>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant={selectedCat === null ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(null)}>ทั้งหมด</Button>
              {categories?.map((c) => (
                <Button key={c.id} variant={selectedCat === c.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(c.id)}>{c.name}</Button>
              ))}
            </div>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>ไม่พบสินค้า</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onAdd={onAddToCart} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function ProductCard({
  product: p,
  index,
  onAdd,
}: {
  product: Product;
  index: number;
  onAdd: (p: Product) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60 shadow-sm bg-card h-full flex flex-col">
        <div className="aspect-square bg-secondary/30 relative overflow-hidden">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
          {p.is_new && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs shadow-sm">ใหม่</Badge>
          )}
          {p.discount_price && p.selling_price && p.discount_price < p.selling_price && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
              -{Math.round(((p.selling_price - p.discount_price) / p.selling_price) * 100)}%
            </Badge>
          )}
        </div>
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="font-medium text-sm line-clamp-2 text-foreground font-heading min-h-[2.5rem]">{p.name}</h3>
          <div className="mt-auto pt-2">
            <div className="flex items-baseline gap-2">
              {p.discount_price ? (
                <>
                  <span className="text-primary font-bold text-sm sm:text-base">{formatPrice(p.discount_price)}</span>
                  <span className="text-muted-foreground text-xs line-through">{formatPrice(p.selling_price)}</span>
                </>
              ) : (
                <span className="text-primary font-bold text-sm sm:text-base">{formatPrice(p.selling_price)}</span>
              )}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2 gap-1 text-xs" onClick={() => onAdd(p)}>
              <Plus className="h-3.5 w-3.5" />
              เพิ่มลงตะกร้า
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
