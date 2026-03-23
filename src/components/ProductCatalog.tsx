import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ShoppingBag, Search, SlidersHorizontal } from "lucide-react";
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
  brand: string | null;
}

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

interface InstallmentPlan {
  id: string;
  months: number;
  interest_rate: number | null;
}

interface ProductCatalogProps {
  onAddToCart: (product: any) => void;
}

const formatPrice = (price: number | null) =>
  price != null ? `฿${price.toLocaleString()}` : "";

export function ProductCatalog({ onAddToCart }: ProductCatalogProps) {
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCat, setSelectedCat] = useState<string | null>(searchParams.get("category") || null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const navigate = useNavigate();
  const { data: siteSettings } = useSiteSettings();

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && cat !== selectedCat) setSelectedCat(cat);
  }, [searchParams]);

  const handleCategoryChange = (catId: string | null) => {
    setSelectedCat(catId);
    if (catId) setSearchParams({ category: catId });
    else setSearchParams({});
  };

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, selling_price, discount_price, is_new, is_featured, category_id, description, brand")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
    staleTime: 30_000,
  });

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, image_url").order("name");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 60_000,
  });

  const { data: installmentPlans } = useQuery({
    queryKey: ["public-installment-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installment_plans")
        .select("id, months, interest_rate")
        .eq("is_active", true)
        .order("months", { ascending: false });
      if (error) throw error;
      return data as InstallmentPlan[];
    },
    staleTime: 60_000,
  });

  const maxMonthsPlan = useMemo(() => {
    if (!installmentPlans || installmentPlans.length === 0) return null;
    return installmentPlans[0];
  }, [installmentPlans]);

  const featured = useMemo(
    () => products?.filter((p) => p.is_featured || p.is_new)?.slice(0, 8) ?? [],
    [products]
  );

  const allBrands = useMemo(() => {
    if (!products) return [];
    const brands = products.map((p) => p.brand).filter(Boolean) as string[];
    return [...new Set(brands)].sort();
  }, [products]);

  const maxProductPrice = useMemo(() => {
    if (!products) return 500000;
    const prices = products.map((p) => p.discount_price ?? p.selling_price ?? 0);
    return Math.max(...prices, 10000);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products ?? [];
    if (selectedCat) list = list.filter((p) => p.category_id === selectedCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (selectedBrands.length > 0) {
      list = list.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }
    list = list.filter((p) => {
      const price = p.discount_price ?? p.selling_price ?? 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });
    return list;
  }, [products, selectedCat, search, selectedBrands, priceRange]);

  const getMonthlyPrice = (product: Product) => {
    if (!maxMonthsPlan) return null;
    const price = product.discount_price ?? product.selling_price;
    if (!price || price <= 0) return null;
    return Math.ceil(price * (1 + (maxMonthsPlan.interest_rate || 0) / 100) / maxMonthsPlan.months);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const hasActiveFilter = selectedBrands.length > 0 || priceRange[0] > 0 || priceRange[1] < maxProductPrice;

  const hasCategoryImages = categories?.some((c) => c.image_url);

  return (
    <>
      {/* Featured — hidden when category is selected */}
      {!selectedCat && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {siteSettings?.featured_banner_url ? (
            <img src={siteSettings.featured_banner_url} alt="สินค้าแนะนำ" className="w-full rounded-2xl mb-8 object-cover" style={{ maxHeight: 224 }} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
              <div>
                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-primary/20">แนะนำ</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าแนะนำ</h2>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} monthlyPrice={getMonthlyPrice(p)} maxMonths={maxMonthsPlan?.months} />
            ))}
          </div>
        </section>
      )}

      {/* All products with filter */}
      <section id="products" className="bg-secondary/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {siteSettings?.all_products_banner_url ? (
            <img src={siteSettings.all_products_banner_url} alt="สินค้าทั้งหมด" className="w-full rounded-2xl mb-10 object-cover" style={{ maxHeight: 224 }} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าทั้งหมด</h2>
            </motion.div>
          )}

          {/* Category image grid */}
          {hasCategoryImages && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(selectedCat === c.id ? null : c.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedCat === c.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-foreground text-center line-clamp-2">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              {!hasCategoryImages && (
                <>
                  <Button variant={selectedCat === null ? "default" : "outline"} size="sm" onClick={() => handleCategoryChange(null)}>ทั้งหมด</Button>
                  {categories?.map((c) => (
                    <Button key={c.id} variant={selectedCat === c.id ? "default" : "outline"} size="sm" onClick={() => handleCategoryChange(c.id)}>{c.name}</Button>
                  ))}
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)} className="gap-1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                ตัวกรอง
                {hasActiveFilter && <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px]">!</Badge>}
              </Button>
            </div>
          </div>

          {/* Product grid */}
          <div className="flex gap-6">
            {/* Desktop sidebar filters */}
            <aside className="hidden lg:block w-56 shrink-0 space-y-6">
              {allBrands.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold text-sm">แบรนด์</Label>
                  <div className="space-y-1.5">
                    {allBrands.map((b) => (
                      <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={selectedBrands.includes(b)} onCheckedChange={() => toggleBrand(b)} />
                        {b}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="font-semibold text-sm">ช่วงราคา</Label>
                <Slider min={0} max={maxProductPrice} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} monthlyPrice={getMonthlyPrice(p)} maxMonths={maxMonthsPlan?.months} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile filter sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-sm">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> ตัวกรอง</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {allBrands.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">แบรนด์</Label>
                <div className="space-y-1.5">
                  {allBrands.map((b) => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={selectedBrands.includes(b)} onCheckedChange={() => toggleBrand(b)} />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-semibold">ช่วงราคา</Label>
              <Slider min={0} max={maxProductPrice} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={() => { setSelectedBrands([]); setPriceRange([0, maxProductPrice]); }} className="flex-1">ล้างตัวกรอง</Button>
            <Button onClick={() => setFilterOpen(false)} className="flex-1">ดูผลลัพธ์ ({filtered.length})</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ProductCard({
  product: p,
  index,
  monthlyPrice,
  maxMonths,
}: {
  product: Product;
  index: number;
  monthlyPrice: number | null;
  maxMonths?: number;
}) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.03, duration: 0.4 }}
    >
      <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/60 shadow-sm bg-card h-full flex flex-col cursor-pointer" onClick={() => navigate(`/products/${p.id}`)}>
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
        </div>
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="font-medium text-sm line-clamp-2 text-foreground font-heading min-h-[2.5rem]">{p.name}</h3>
          <div className="mt-auto pt-2">
            {monthlyPrice ? (
              <div>
                <p className="text-xs text-muted-foreground">เริ่มต้น</p>
                <span className="text-primary font-bold text-sm sm:text-base">{formatPrice(monthlyPrice)}</span>
                <span className="text-xs text-muted-foreground">/เดือน</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
