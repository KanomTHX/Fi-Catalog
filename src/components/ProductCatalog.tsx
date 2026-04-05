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
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { ShoppingBag, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  image_url: string | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  category_id: string | null;
  description: string | null;
  brand: string | null;
  color: string | null;
  material: string | null;
}

interface Category {
  id: string;
  name: string;
  image_url: string | null;
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
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [showAll, setShowAll] = useState(false);
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

  const { data: products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, is_new, is_featured, category_id, description, brand, color, material")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
    staleTime: 30_000,
    retry: 2,
  });

  const { data: productStock } = useQuery({
    queryKey: ["public-product-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_stock").select("product_id, current_stock");
      if (error) throw error;
      return (data ?? []) as { product_id: string; current_stock: number | null }[];
    },
    staleTime: 30_000,
    retry: 2,
  });

  const getStock = (productId: string): number => {
    const s = productStock?.find(s => s.product_id === productId);
    return s?.current_stock ?? 0;
  };

  const { data: categories } = useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, image_url").order("name");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
    staleTime: 60_000,
    retry: 2,
  });

  const { data: installmentPrices } = useQuery({
    queryKey: ["public-installment-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_installment_prices")
        .select("product_id, plan_id, monthly_price");
      if (error) throw error;
      return (data ?? []) as { product_id: string; plan_id: string; monthly_price: number }[];
    },
    staleTime: 30_000,
    retry: 2,
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
      return (data ?? []) as { id: string; months: number; interest_rate: number | null }[];
    },
    staleTime: 60_000,
    retry: 2,
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

  const allColors = useMemo(() => {
    if (!products) return [];
    const colors = products.map((p) => p.color).filter(Boolean) as string[];
    return [...new Set(colors)].sort();
  }, [products]);

  const allMaterials = useMemo(() => {
    if (!products) return [];
    const materials = products.map((p) => p.material).filter(Boolean) as string[];
    return [...new Set(materials)].sort();
  }, [products]);

  const getMinMonthlyPrice = (productId: string): number | null => {
    if (!installmentPrices) return null;
    const prices = installmentPrices.filter(p => p.product_id === productId && p.monthly_price > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices.map(p => p.monthly_price));
  };

  const getMonthlyPrice = (product: Product): number | null => {
    if (!installmentPrices || !maxMonthsPlan) return null;
    const price = installmentPrices.find(p => p.product_id === product.id && p.plan_id === maxMonthsPlan.id);
    return price?.monthly_price || getMinMonthlyPrice(product.id);
  };

  const maxProductPrice = useMemo(() => {
    if (!installmentPrices || installmentPrices.length === 0) return 50000;
    const prices = installmentPrices.map(p => p.monthly_price);
    return Math.max(...prices, 10000);
  }, [installmentPrices]);

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
    if (selectedColors.length > 0) {
      list = list.filter((p) => p.color && selectedColors.includes(p.color));
    }
    if (selectedMaterials.length > 0) {
      list = list.filter((p) => p.material && selectedMaterials.includes(p.material));
    }
    if (installmentPrices) {
      list = list.filter((p) => {
        const minPrice = getMinMonthlyPrice(p.id);
        if (minPrice === null) return true;
        return minPrice >= priceRange[0] && minPrice <= priceRange[1];
      });
    }
    return list;
  }, [products, selectedCat, search, selectedBrands, selectedColors, selectedMaterials, priceRange, installmentPrices]);

  const displayedProducts = showAll ? filtered : filtered.slice(0, 12);

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) => prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]);
  };
  const toggleColor = (color: string) => {
    setSelectedColors((prev) => prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]);
  };
  const toggleMaterial = (material: string) => {
    setSelectedMaterials((prev) => prev.includes(material) ? prev.filter((m) => m !== material) : [...prev, material]);
  };

  const hasActiveFilter = selectedBrands.length > 0 || selectedColors.length > 0 || selectedMaterials.length > 0 || priceRange[0] > 0 || priceRange[1] < maxProductPrice;

  const hasCategoryImages = categories?.some((c) => c.image_url);

  const clearAllFilters = () => {
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setPriceRange([0, maxProductPrice]);
  };

  const FilterCheckboxGroup = ({ label, items, selected, onToggle }: { label: string; items: string[]; selected: string[]; onToggle: (v: string) => void }) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <Label className="font-semibold text-sm">{label}</Label>
        <div className="space-y-1.5">
          {items.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selected.includes(item)} onCheckedChange={() => onToggle(item)} />
              {item}
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Featured */}
      {!selectedCat && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {siteSettings?.featured_banner_url ? (
            <img src={siteSettings.featured_banner_url} alt="สินค้าแนะนำ" className="w-full rounded-2xl mb-8" style={{ maxHeight: 224, objectFit: (siteSettings as any).featured_banner_fit || "cover", objectPosition: "center" }} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="flex items-center justify-between mb-8">
              <div>
                <Badge variant="secondary" className="mb-2 bg-primary/10 text-primary border-primary/20">แนะนำ</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าแนะนำ</h2>
              </div>
            </motion.div>
          )}
          <Carousel opts={{ align: "start", loop: featured.length > 4 }} className="w-full">
            <CarouselContent className="-ml-4">
              {featured.map((p, i) => (
                <CarouselItem key={p.id} className="pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4">
                  <ProductCard product={p} index={i} monthlyPrice={getMonthlyPrice(p)} maxMonths={maxMonthsPlan?.months} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {featured.length > 4 && (
              <>
                <CarouselPrevious className="-left-4 hidden sm:flex" />
                <CarouselNext className="-right-4 hidden sm:flex" />
              </>
            )}
          </Carousel>
        </section>
      )}

      {/* All products */}
      <section id="products" className="bg-secondary/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
          {siteSettings?.all_products_banner_url ? (
            <img src={siteSettings.all_products_banner_url} alt="สินค้าทั้งหมด" className="w-full rounded-2xl mb-10" style={{ maxHeight: 224, objectFit: (siteSettings as any).all_products_banner_fit || "cover", objectPosition: "center" }} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">สินค้าทั้งหมด</h2>
            </motion.div>
          )}

          {hasCategoryImages && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
              {categories?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(selectedCat === c.id ? null : c.id)}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${selectedCat === c.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}
                >
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="w-full aspect-square object-contain bg-card" />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex flex-col items-center justify-center gap-1 p-2">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/30" />
                      <span className="text-xs font-medium text-foreground text-center line-clamp-2">{c.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

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

          <div className="flex gap-6">
            {/* Desktop sidebar filters */}
            <aside className="hidden lg:block w-56 shrink-0 space-y-6">
              <FilterCheckboxGroup label="แบรนด์" items={allBrands} selected={selectedBrands} onToggle={toggleBrand} />
              <FilterCheckboxGroup label="สี" items={allColors} selected={selectedColors} onToggle={toggleColor} />
              <FilterCheckboxGroup label="วัสดุ" items={allMaterials} selected={selectedMaterials} onToggle={toggleMaterial} />
              <div className="space-y-2">
                <Label className="font-semibold text-sm">ช่วงราคา (ผ่อน/เดือน)</Label>
                <Slider min={0} max={maxProductPrice} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
              {hasActiveFilter && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-full text-xs">ล้างตัวกรองทั้งหมด</Button>
              )}
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
              ) : productsError ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="mb-4">เกิดข้อผิดพลาดในการโหลดสินค้า</p>
                  <Button variant="outline" onClick={() => refetchProducts()}>ลองใหม่</Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>ไม่พบสินค้า</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6">
                    {displayedProducts.map((p, i) => (
                      <ProductCard key={p.id} product={p} index={i} monthlyPrice={getMonthlyPrice(p)} maxMonths={maxMonthsPlan?.months} outOfStock={getStock(p.id) <= 0} />
                    ))}
                  </div>
                  {!showAll && filtered.length > 12 && (
                    <div className="text-center mt-8">
                      <Button variant="outline" size="lg" onClick={() => setShowAll(true)} className="gap-2">
                        <ChevronDown className="h-4 w-4" /> ดูเพิ่มเติม ({filtered.length - 12} รายการ)
                      </Button>
                    </div>
                  )}
                </>
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
            <FilterCheckboxGroup label="แบรนด์" items={allBrands} selected={selectedBrands} onToggle={toggleBrand} />
            <FilterCheckboxGroup label="สี" items={allColors} selected={selectedColors} onToggle={toggleColor} />
            <FilterCheckboxGroup label="วัสดุ" items={allMaterials} selected={selectedMaterials} onToggle={toggleMaterial} />
            <div className="space-y-2">
              <Label className="font-semibold">ช่วงราคา (ผ่อน/เดือน)</Label>
              <Slider min={0} max={maxProductPrice} step={500} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>
          <SheetFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={clearAllFilters} className="flex-1">ล้างตัวกรอง</Button>
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
  outOfStock,
}: {
  product: Product;
  index: number;
  monthlyPrice: number | null;
  maxMonths?: number;
  outOfStock?: boolean;
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
        <div className="aspect-square bg-white relative overflow-hidden">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${outOfStock ? "opacity-50" : ""}`} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
              <ShoppingBag className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {outOfStock && (
              <Badge variant="destructive" className="text-xs shadow-sm">สินค้าหมด</Badge>
            )}
            {p.is_new && !outOfStock && (
              <Badge className="bg-primary text-primary-foreground text-xs shadow-sm">ใหม่</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
          <h3 className="font-medium text-sm line-clamp-2 text-foreground font-heading min-h-[2.5rem]">{p.name}</h3>
          <div className="mt-auto pt-2">
            {outOfStock ? (
              <p className="text-sm font-medium text-destructive">สินค้าหมด</p>
            ) : monthlyPrice ? (
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
