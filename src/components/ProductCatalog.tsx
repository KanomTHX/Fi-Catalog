import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ShoppingBag, Plus, Search } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

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

  return (
    <>
      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <Badge variant="secondary" className="mb-3">แนะนำ</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">สินค้าแนะนำ</h2>
            <p className="text-muted-foreground mt-2">คัดสรรสินค้าคุณภาพดีเยี่ยมสำหรับคุณ</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section id="products" className="bg-muted/30 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">สินค้าทั้งหมด</h2>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCat === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCat(null)}
              >
                ทั้งหมด
              </Button>
              {categories?.map((c) => (
                <Button
                  key={c.id}
                  variant={selectedCat === c.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCat(c.id)}
                >
                  {c.name}
                </Button>
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index}
    >
      <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50">
        <div className="aspect-square bg-muted relative overflow-hidden">
          {p.image_url ? (
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <ShoppingBag className="h-16 w-16" />
            </div>
          )}
          {p.is_new && (
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs">
              ใหม่
            </Badge>
          )}
          {p.discount_price && p.selling_price && p.discount_price < p.selling_price && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
              -{Math.round(((p.selling_price - p.discount_price) / p.selling_price) * 100)}%
            </Badge>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 flex items-center justify-center">
            <Button
              size="sm"
              className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 gap-1"
              onClick={() => onAdd(p)}
            >
              <Plus className="h-4 w-4" />
              สั่งจอง
            </Button>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 text-foreground">{p.name}</h3>
          <div className="mt-1.5 flex items-baseline gap-2">
            {p.discount_price ? (
              <>
                <span className="text-primary font-bold text-base">{formatPrice(p.discount_price)}</span>
                <span className="text-muted-foreground text-xs line-through">{formatPrice(p.selling_price)}</span>
              </>
            ) : (
              <span className="text-primary font-bold text-base">{formatPrice(p.selling_price)}</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 gap-1 text-xs"
            onClick={() => onAdd(p)}
          >
            <Plus className="h-3.5 w-3.5" />
            เพิ่มลงตะกร้า
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
