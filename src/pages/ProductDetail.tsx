import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ShoppingCart, ShoppingBag, Package, Store, Truck, ChevronRight, Plus, Minus, Eye, X,
} from "lucide-react";
import { motion } from "framer-motion";

const formatPrice = (n: number | null) => n != null ? `฿${n.toLocaleString()}` : "—";

const RECENTLY_VIEWED_KEY = "recently-viewed-products";
const MAX_RECENT = 8;

function getRecentlyViewed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]");
  } catch { return []; }
}

function addToRecentlyViewed(id: string) {
  const ids = getRecentlyViewed().filter((i) => i !== id);
  ids.unshift(id);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [qty, setQty] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fetch product
  const { data: product, isLoading } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch extra images
  const { data: extraImages } = useQuery({
    queryKey: ["product-images", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", id!)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!id,
  });

  // Fetch variants
  const { data: variants } = useQuery({
    queryKey: ["product-variants", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id!)
        .order("variant_name");
      return data ?? [];
    },
    enabled: !!id,
  });

  // Fetch installment plans
  const { data: installmentPlans } = useQuery({
    queryKey: ["installment-plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("installment_plans")
        .select("*")
        .eq("is_active", true)
        .order("months");
      return data ?? [];
    },
  });

  // Fetch fixed installment prices for this product
  const { data: productInstallmentPrices } = useQuery({
    queryKey: ["product-installment-prices", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_installment_prices" as any)
        .select("plan_id, monthly_price")
        .eq("product_id", id!);
      return (data as unknown) as { plan_id: string; monthly_price: number }[] ?? [];
    },
    enabled: !!id,
  });

  // Similar products (same category)
  const { data: similarProducts } = useQuery({
    queryKey: ["similar-products", product?.category_id, id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, image_url, is_new")
        .eq("category_id", product!.category_id!)
        .neq("id", id!)
        .limit(8);
      return data ?? [];
    },
    enabled: !!product?.category_id,
  });

  // Recently viewed products
  const recentIds = useMemo(() => getRecentlyViewed().filter((i) => i !== id), [id]);
  const { data: recentProducts } = useQuery({
    queryKey: ["recent-products", recentIds],
    queryFn: async () => {
      if (recentIds.length === 0) return [];
      const { data } = await supabase
        .from("products")
        .select("id, name, image_url, is_new")
        .in("id", recentIds)
        .limit(8);
      return (data ?? []).sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
    },
    enabled: recentIds.length > 0,
  });

  // Track recently viewed
  useEffect(() => {
    if (id) addToRecentlyViewed(id);
  }, [id]);

  // Build image gallery
  const allImages = useMemo(() => {
    const imgs: string[] = [];
    if (product?.image_url) imgs.push(product.image_url);
    if (extraImages) imgs.push(...extraImages.map((i: any) => i.image_url));
    return imgs.length > 0 ? imgs : [];
  }, [product, extraImages]);

  // Group variants by name
  const variantGroups = useMemo(() => {
    if (!variants || variants.length === 0) return [];
    const groups: Record<string, typeof variants> = {};
    variants.forEach((v: any) => {
      if (!groups[v.variant_name]) groups[v.variant_name] = [];
      groups[v.variant_name].push(v);
    });
    return Object.entries(groups);
  }, [variants]);

  // Get fixed monthly price for a plan
  const getFixedMonthlyPrice = (planId: string): number | null => {
    if (!productInstallmentPrices) return null;
    const found = productInstallmentPrices.find(p => p.plan_id === planId);
    return found?.monthly_price || null;
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < qty; i++) {
      addToCart(product);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />
        <div className="pt-28 max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-12 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />
        <div className="pt-32 text-center">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold mb-2">ไม่พบสินค้า</h2>
          <Button onClick={() => navigate("/products")}>กลับไปหน้าสินค้า</Button>
        </div>
      </div>
    );
  }

  const categoryName = (product as any).categories?.name;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <div className="pt-24 sm:pt-28 pb-16 mx-auto max-w-7xl px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">หน้าแรก</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/products">สินค้า</Link></BreadcrumbLink></BreadcrumbItem>
            {categoryName && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink asChild><Link to={`/products?category=${product.category_id}`}>{categoryName}</Link></BreadcrumbLink></BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem><span className="text-foreground font-medium">{product.name}</span></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex gap-3">
              {/* Vertical thumbnails */}
              {allImages.length > 1 && (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px]">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-border hover:border-primary/50"}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {/* Main image */}
              <div className="flex-1 aspect-square rounded-2xl overflow-hidden bg-white border border-border cursor-pointer" onClick={() => setLightboxOpen(true)}>
                {allImages.length > 0 ? (
                  <img src={allImages[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-20 w-20 text-muted-foreground/20" />
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-5">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {product.is_new && <Badge className="bg-green-500 text-white border-0">ใหม่</Badge>}
                {product.brand && <Badge variant="secondary">{product.brand}</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading">{product.name}</h1>
              {product.sku && <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>}
            </div>

            {/* Installment Plans - Fixed Prices */}
            {installmentPlans && installmentPlans.length > 0 && productInstallmentPrices && productInstallmentPrices.length > 0 && (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">แผนผ่อนชำระ</p>
                <div className="flex flex-wrap gap-2">
                  {installmentPlans.map((plan: any) => {
                    const monthly = getFixedMonthlyPrice(plan.id);
                    if (!monthly) return null;
                    return (
                      <div key={plan.id} className="bg-card border border-border rounded-lg px-3 py-2 text-center min-w-[80px]">
                        <p className="text-xs text-muted-foreground">{plan.months} เดือน</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(monthly)}</p>
                        <p className="text-[10px] text-muted-foreground">/เดือน</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variants */}
            {variantGroups.length > 0 && (
              <div className="space-y-3">
                {variantGroups.map(([name, items]) => (
                  <div key={name}>
                    <p className="text-sm font-medium mb-2">{name}</p>
                    <div className="flex flex-wrap gap-2">
                      {(items as any[]).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v.id)}
                          className={`px-4 py-2 rounded-lg border text-sm transition-colors ${selectedVariant === v.id ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:border-primary/50"}`}
                        >
                          {v.variant_value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Delivery Method */}
            <div>
              <p className="text-sm font-medium mb-3">วิธีรับสินค้า</p>
              <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Store className="h-4 w-4 text-primary" /> รับหน้าร้าน
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <Truck className="h-4 w-4 text-primary" /> จัดส่งถึงบ้าน
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Quantity + Buttons */}
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-border rounded-lg">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQty(Math.max(1, qty - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQty(qty + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="flex-1 gap-2" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" /> เพิ่มใส่ตะกร้า
              </Button>
              <Button size="lg" className="flex-1 gap-2" onClick={handleBuyNow}>
                <ShoppingBag className="h-5 w-5" /> ซื้อเลย
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Product Details */}
        <div className="mt-12">
          <h2 className="text-xl font-bold font-heading mb-4">รายละเอียดสินค้า</h2>
          <div className="bg-card border border-border rounded-xl p-6">
            {product.description && <div className="text-muted-foreground mb-4 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {product.material && (
                <div><span className="text-muted-foreground">วัสดุ:</span> <span className="font-medium">{product.material}</span></div>
              )}
              {product.dimensions && (
                <div><span className="text-muted-foreground">ขนาด:</span> <span className="font-medium">{product.dimensions}</span></div>
              )}
              {product.weight && (
                <div><span className="text-muted-foreground">น้ำหนัก:</span> <span className="font-medium">{product.weight} kg</span></div>
              )}
              {product.color && (
                <div><span className="text-muted-foreground">สี:</span> <span className="font-medium">{product.color}</span></div>
              )}
              {product.brand && (
                <div><span className="text-muted-foreground">แบรนด์:</span> <span className="font-medium">{product.brand}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold font-heading mb-6">สินค้าที่คล้ายกัน</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarProducts.map((p: any) => (
                <MiniProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentProducts && recentProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold font-heading mb-6 flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> สินค้าที่ดูล่าสุด
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentProducts.map((p: any) => (
                <MiniProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95 border-0">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-2 right-2 z-50 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
          {allImages.length > 0 && (
            <div className="flex items-center justify-center h-full">
              <img src={allImages[selectedImage]} alt="" className="max-w-full max-h-[85vh] object-contain" />
            </div>
          )}
          {allImages.length > 1 && (
            <div className="flex justify-center gap-2 mt-2">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 ${selectedImage === i ? "border-primary" : "border-white/20"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MiniProductCard({ product: p }: { product: any }) {
  const navigate = useNavigate();

  // Fetch min monthly price from fixed installment prices
  const { data: minPrice } = useQuery({
    queryKey: ["mini-installment-price", p.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_installment_prices" as any)
        .select("monthly_price")
        .eq("product_id", p.id)
        .gt("monthly_price", 0)
        .order("monthly_price", { ascending: true })
        .limit(1);
      return data && data.length > 0 ? (data[0] as any).monthly_price : null;
    },
    staleTime: 60_000,
  });

  return (
    <Card
      className="overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer bg-card h-full flex flex-col"
      onClick={() => navigate(`/products/${p.id}`)}
    >
      <div className="aspect-square bg-white relative overflow-hidden">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <Package className="h-10 w-10" />
          </div>
        )}
        {p.is_new && <Badge className="absolute top-2 left-2 bg-green-500 text-white border-0 text-xs">ใหม่</Badge>}
      </div>
      <CardContent className="p-3 flex flex-col flex-1">
        <h3 className="font-medium text-sm line-clamp-2 font-heading min-h-[2.5rem]">{p.name}</h3>
        <div className="mt-auto pt-2">
          {minPrice ? (
            <div>
              <p className="text-xs text-muted-foreground">เริ่มต้น</p>
              <span className="text-primary font-bold text-sm">{formatPrice(minPrice)}</span>
              <span className="text-xs text-muted-foreground">/เดือน</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
