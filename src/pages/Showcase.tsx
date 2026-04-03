import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Package, Sparkles, ShoppingCart, Plus, Minus, Trash2, CheckCircle,
  SlidersHorizontal, Flame, Zap, Star, Store, ClipboardList, User, ChevronRight,
  Clock, MapPin, Phone, Edit2, Save, ShoppingBag, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// ─── Types ───
interface Product {
  id: string; name: string; sku: string | null; selling_price: number | null;
  discount_price: number | null; image_url: string | null; category_id: string | null;
  brand: string | null; description: string | null; weight: number | null;
  location: string | null; color: string | null; material: string | null;
  dimensions: string | null; is_new: boolean; is_featured: boolean;
  created_at: string; categories: { name: string } | null;
}
interface Category { id: string; name: string; }
interface CartItem { product: Product; qty: number; }
interface LiffProfile { displayName?: string; pictureUrl?: string; userId?: string; }
interface OrderCount { product_id: string; order_count: number; }
interface OrderRow {
  id: string; status: string; total_amount: number | null;
  note: string | null; created_at: string;
  monthly_amount?: number | null; installment_months?: number | null;
  status_reason?: string | null;
  order_items: { id: string; quantity: number; unit_price: number | null; products: { name: string; sku: string | null; image_url: string | null } | null }[];
}
interface CustomerRow {
  id: string; display_name: string; phone: string | null; address: string | null;
  picture_url: string | null; line_user_id: string | null;
}

type SortOption = "popular" | "newest" | "price_asc" | "price_desc" | "discount";
type TabKey = "shop" | "orders" | "profile";

const formatPrice = (price: number | null) => {
  if (price == null) return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);
};

const statusConfig: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-500", step: 1 },
  credit_check: { label: "รอฝ่ายสินเชื่อติดต่อ", color: "bg-blue-400", step: 2 },
  credit_approved: { label: "อนุมัติสินเชื่อ", color: "bg-indigo-500", step: 3 },
  shipping: { label: "รอจัดส่ง", color: "bg-purple-500", step: 4 },
  completed: { label: "จัดส่งสำเร็จ", color: "bg-green-500", step: 5 },
  credit_rejected: { label: "ไม่อนุมัติสินเชื่อ", color: "bg-destructive", step: 0 },
};

// ─── Product Card ───
function ProductCard({ product, onClick, onAddCart, index, monthlyPrice, maxMonths }: { product: Product; onClick: () => void; onAddCart: () => void; index: number; monthlyPrice?: number | null; maxMonths?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div onClick={onClick} className="aspect-square bg-white relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && <Badge className="text-[10px] bg-green-500 text-white border-0 shadow-sm">ใหม่</Badge>}
        </div>
      </div>
      <div className="p-3" onClick={onClick}>
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        {product.brand && <p className="text-[11px] text-muted-foreground mb-1.5">{product.brand}</p>}
        <div>
          {monthlyPrice ? (
            <div>
              <p className="text-[10px] text-muted-foreground">เริ่มต้น</p>
              <p className="text-primary font-bold text-base leading-none">{formatPrice(monthlyPrice)}<span className="text-[11px] text-muted-foreground font-normal">/เดือน</span></p>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Detail Dialog ───
function ProductDetailDialog({ product, open, onClose, onAddCart, installmentPlans, installmentPrices }: { product: Product | null; open: boolean; onClose: () => void; onAddCart: (p: Product) => void; installmentPlans: { id: string; months: number; interest_rate: number | null }[]; installmentPrices: { product_id: string; plan_id: string; monthly_price: number }[] }) {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!product) return;
    (async () => {
      const imgs: string[] = [];
      if (product.image_url) imgs.push(product.image_url);
      const { data } = await supabase.from("product_images").select("image_url").eq("product_id", product.id).order("sort_order");
      if (data) imgs.push(...data.map((d: any) => d.image_url));
      setImages(imgs);
      setSelectedImg(0);
    })();
  }, [product?.id]);

  if (!product) return null;

  return (
    <>
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl">
        {/* Sticky close button */}
        <button onClick={onClose} className="absolute top-3 right-3 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow-lg hover:bg-background transition-colors">
          <X className="h-5 w-5" />
        </button>
        <div className="max-h-[85vh] overflow-y-auto">
        {/* Image area — compact with side thumbnails */}
        <div className="flex gap-2 p-3">
          {images.length > 1 && (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[200px]">
              {images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)} className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${selectedImg === i ? "border-primary" : "border-border"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div className="flex-1 relative">
            {images.length > 0 ? (
              <img src={images[selectedImg]} alt={product.name} className="w-full aspect-[4/3] object-cover bg-white rounded-xl cursor-pointer" onClick={() => setLightboxOpen(true)} />
            ) : product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full aspect-[4/3] object-cover bg-white rounded-xl cursor-pointer" onClick={() => setLightboxOpen(true)} />
            ) : (
              <div className="w-full aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center rounded-xl">
                <Package className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-2">
              {product.categories?.name && <Badge className="backdrop-blur-sm bg-background/80 text-foreground" variant="outline">{product.categories.name}</Badge>}
              {product.is_new && <Badge className="bg-green-500 text-white border-0">ใหม่</Badge>}
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-3">
          <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
          {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
          {product.description && <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />}
          <div className="flex flex-wrap gap-2">
            {product.material && <Badge variant="secondary">วัสดุ: {product.material}</Badge>}
            {product.color && <Badge variant="secondary">สี: {product.color}</Badge>}
            {product.dimensions && <Badge variant="secondary">ขนาด: {product.dimensions}</Badge>}
          </div>
          {/* Installment plans from product_installment_prices — only show plans with data */}
          {(() => {
            const plansWithPrice = installmentPlans.filter(plan => {
              const fp = installmentPrices.find(ip => ip.product_id === product.id && ip.plan_id === plan.id);
              return fp && fp.monthly_price > 0;
            });
            if (plansWithPrice.length === 0) return null;
            return (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">แผนผ่อนชำระ</p>
                <div className="flex flex-wrap gap-2">
                  {plansWithPrice.map((plan) => {
                    const fixedPrice = installmentPrices.find(ip => ip.product_id === product.id && ip.plan_id === plan.id)!;
                    return (
                      <div key={plan.id} className="bg-muted rounded-lg px-3 py-2 text-center min-w-[70px]">
                        <p className="text-[10px] text-muted-foreground">{plan.months} เดือน</p>
                        <p className="text-sm font-bold text-primary">{formatPrice(fixedPrice.monthly_price)}</p>
                        <p className="text-[9px] text-muted-foreground">/เดือน</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          {(() => {
            const hasAnyPlan = installmentPrices.some(ip => ip.product_id === product.id && ip.monthly_price > 0);
            return (
              <div className="flex items-center justify-end pt-1">
                {hasAnyPlan ? (
                  <Button onClick={() => { onAddCart(product); onClose(); }}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> เพิ่มลงตะกร้า
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">สินค้ายังไม่มีแผนผ่อนชำระ</p>
                )}
              </div>
            );
          })()}
        </div>
        </div>
      </DialogContent>
    </Dialog>
    {/* Lightbox */}
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 bg-black/95 border-0">
        <button onClick={() => setLightboxOpen(false)} className="absolute top-2 right-2 z-50 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X className="h-5 w-5 text-white" />
        </button>
        {images.length > 0 && (
          <div className="flex items-center justify-center h-full">
            <img src={images[selectedImg]} alt="" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        )}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-2">
            {images.map((img, i) => (
              <button key={i} onClick={() => setSelectedImg(i)} className={`w-12 h-12 rounded-lg overflow-hidden border-2 ${selectedImg === i ? "border-primary" : "border-white/20"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

// ─── Horizontal Product Section ───
function ProductSection({ title, icon, products, onProductClick, onAddCart }: { title: string; icon: React.ReactNode; products: Product[]; onProductClick: (p: Product) => void; onAddCart: (p: Product) => void }) {
  if (products.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.slice(0, 10).map((p, i) => (
          <div key={p.id} className="w-40 shrink-0">
            <ProductCard product={p} index={i} onClick={() => onProductClick(p)} onAddCart={() => onAddCart(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Order Status Progress ───
function OrderStatusProgress({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  if (status === "credit_rejected") {
    return <Badge variant="destructive" className="text-xs">ไม่อนุมัติสินเชื่อ</Badge>;
  }
  const steps = [
    { label: "รอดำเนินการ", step: 1 },
    { label: "รอสินเชื่อ", step: 2 },
    { label: "อนุมัติ", step: 3 },
    { label: "รอจัดส่ง", step: 4 },
    { label: "สำเร็จ", step: 5 },
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center gap-1">
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${cfg.step >= s.step ? `${cfg.color} text-white` : "bg-muted text-muted-foreground"}`}>
              {cfg.step >= s.step ? "✓" : s.step}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 transition-colors ${cfg.step > s.step ? cfg.color : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {steps.map(s => <span key={s.step}>{s.label}</span>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// ─── Main Showcase Component ───
// ═══════════════════════════════════════
export default function Showcase() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("shop");

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<{ id: string; months: number; interest_rate: number | null }[]>([]);
  const [installmentPrices, setInstallmentPrices] = useState<{ product_id: string; plan_id: string; monthly_price: number }[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [liffId, setLiffId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("StockFlow");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Sorting & Filtering
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [filterMaterials, setFilterMaterials] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [maxWidth, setMaxWidth] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");
  const [liffDeliveryMethod, setLiffDeliveryMethod] = useState("pickup");
  const [liffSelectedPlan, setLiffSelectedPlan] = useState<number | null>(null);
  const [stockMap, setStockMap] = useState<Map<string, number>>(new Map());

  // Customer portal
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [myOrders, setMyOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Link order from web
  const [linkOrderOpen, setLinkOrderOpen] = useState(false);
  const [linkOrderCode, setLinkOrderCode] = useState("");
  const [linkingOrder, setLinkingOrder] = useState(false);

  const cartTotal = 0; // Prices determined at checkout via installment plan selection
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const liffLaunchUrl = liffId ? `https://liff.line.me/${liffId}` : null;

  const allBrands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))] as string[], [products]);
  const allMaterials = useMemo(() => [...new Set(products.map(p => p.material).filter(Boolean))] as string[], [products]);
  const allColors = useMemo(() => [...new Set(products.map(p => p.color).filter(Boolean))] as string[], [products]);
  const maxPrice = useMemo(() => Math.max(...products.map(p => p.selling_price || 0), 100000), [products]);

  // ─── LIFF Init ───
  useEffect(() => {
    async function initLiff() {
      try {
        const { data } = await supabase.from("line_settings").select("liff_id").limit(1).single();
        if (!data?.liff_id) {
          console.warn("[LIFF] No liff_id found in line_settings");
          return;
        }
        setLiffId(data.liff_id);
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: data.liff_id });
        console.log("[LIFF] Init success, isInClient:", liff.isInClient(), "isLoggedIn:", liff.isLoggedIn());

        if (!liff.isLoggedIn()) {
          // When opened outside LINE browser, login with redirect back
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        console.log("[LIFF] Got profile:", profile.displayName, profile.userId);
        setLiffProfile({ displayName: profile.displayName, pictureUrl: profile.pictureUrl, userId: profile.userId });
        setCustName(profile.displayName || "");
      } catch (err) {
        console.error("[LIFF] Init error:", err);
      }
    }
    initLiff();
  }, []);

  // ─── Fetch products & site settings ───
  useEffect(() => {
    async function fetchData() {
      const [prodRes, catRes, orderCountRes, siteRes, planRes, priceRes, stockRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, selling_price, discount_price, image_url, category_id, brand, description, weight, location, color, material, dimensions, is_new, is_featured, created_at, categories(name)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("product_order_counts" as any).select("*"),
        supabase.from("site_settings").select("*").limit(1).single(),
        supabase.from("installment_plans").select("id, months, interest_rate").eq("is_active", true).order("months", { ascending: false }),
        supabase.from("product_installment_prices").select("product_id, plan_id, monthly_price"),
        supabase.from("product_stock").select("product_id, current_stock"),
      ]);
      if (prodRes.data) setProducts(prodRes.data as any);
      if (catRes.data) setCategories(catRes.data);
      if (orderCountRes.data) setOrderCounts(orderCountRes.data as any);
      if (planRes.data) setInstallmentPlans(planRes.data as any);
      if (priceRes.data) setInstallmentPrices(priceRes.data as any);
      if (stockRes.data) setStockMap(new Map((stockRes.data as any[]).map(s => [s.product_id, s.current_stock ?? 0])));
      if (siteRes.data) {
        setSiteName((siteRes.data as any).site_name || "StockFlow");
        setLogoUrl((siteRes.data as any).logo_url || null);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // ─── Fetch customer & orders when switching to orders/profile tab ───
  const fetchCustomerOrders = useCallback(async () => {
    if (!liffProfile?.userId) return;
    setOrdersLoading(true);
    try {
      const { data: cust } = await supabase
        .from("customers")
        .select("*")
        .eq("line_user_id", liffProfile.userId)
        .maybeSingle();
      if (cust) {
        setCustomer(cust);
        setEditPhone(cust.phone || "");
        setEditAddress(cust.address || "");
        const { data: orders } = await supabase
          .from("orders")
          .select("id, status, total_amount, note, created_at, monthly_amount, installment_months, status_reason, order_items(id, quantity, unit_price, products(name, sku, image_url))")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: false });
        if (orders) setMyOrders(orders as any);
      }
    } catch { }
    setOrdersLoading(false);
  }, [liffProfile?.userId]);

  useEffect(() => {
    if ((activeTab === "orders" || activeTab === "profile") && liffProfile?.userId) {
      fetchCustomerOrders();
    }
  }, [activeTab, liffProfile?.userId, fetchCustomerOrders]);

  const getOrderCount = (id: string) => orderCounts.find(o => o.product_id === id)?.order_count || 0;

  const bestSellers = useMemo(() => [...products].sort((a, b) => getOrderCount(b.id) - getOrderCount(a.id)).filter(p => getOrderCount(p.id) > 0).slice(0, 10), [products, orderCounts]);
  const newArrivals = useMemo(() => products.filter(p => p.is_new).slice(0, 10), [products]);
  const specialOffers = useMemo(() => products.filter(p => p.discount_price != null && p.discount_price < (p.selling_price || 0)), [products]);

  const maxMonthsPlan = useMemo(() => installmentPlans.length > 0 ? installmentPlans[0] : null, [installmentPlans]);

  const getMinMonthlyPrice = (productId: string): number | null => {
    const prices = installmentPrices.filter(p => p.product_id === productId && p.monthly_price > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices.map(p => p.monthly_price));
  };

  const getMonthlyPrice = (p: Product) => {
    if (!maxMonthsPlan) return getMinMonthlyPrice(p.id);
    const price = installmentPrices.find(ip => ip.product_id === p.id && ip.plan_id === maxMonthsPlan.id);
    return price?.monthly_price || getMinMonthlyPrice(p.id);
  };

  const getMonthlyPriceForPlan = (productId: string, planId: string): number | null => {
    const price = installmentPrices.find(ip => ip.product_id === productId && ip.plan_id === planId);
    return price?.monthly_price || null;
  };

  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      const matchCat = selectedCat === "all" || p.category_id === selectedCat;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand ?? "").toLowerCase().includes(search.toLowerCase());
      const price = p.discount_price ?? p.selling_price ?? 0;
      const matchPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchBrand = filterBrands.length === 0 || (p.brand && filterBrands.includes(p.brand));
      const matchMaterial = filterMaterials.length === 0 || (p.material && filterMaterials.includes(p.material));
      const matchColor = filterColors.length === 0 || (p.color && filterColors.includes(p.color));
      const matchWidth = !maxWidth || (() => {
        if (!p.dimensions) return true;
        const w = parseFloat(p.dimensions);
        return !isNaN(w) && w <= parseFloat(maxWidth);
      })();
      return matchCat && matchSearch && matchPrice && matchBrand && matchMaterial && matchColor && matchWidth;
    });
    switch (sortBy) {
      case "popular": result.sort((a, b) => getOrderCount(b.id) - getOrderCount(a.id)); break;
      case "newest": result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case "price_asc": result.sort((a, b) => (a.discount_price ?? a.selling_price ?? 0) - (b.discount_price ?? b.selling_price ?? 0)); break;
      case "price_desc": result.sort((a, b) => (b.discount_price ?? b.selling_price ?? 0) - (a.discount_price ?? a.selling_price ?? 0)); break;
      case "discount": result.sort((a, b) => ((b.selling_price || 0) - (b.discount_price ?? b.selling_price ?? 0)) - ((a.selling_price || 0) - (a.discount_price ?? a.selling_price ?? 0))); break;
    }
    return result;
  }, [products, selectedCat, search, sortBy, priceRange, filterBrands, filterMaterials, filterColors, maxWidth, orderCounts]);

  const activeFilterCount = [filterBrands.length > 0, filterMaterials.length > 0, filterColors.length > 0, !!maxWidth, priceRange[0] > 0 || priceRange[1] < maxPrice].filter(Boolean).length;

  function clearFilters() {
    setFilterBrands([]); setFilterMaterials([]); setFilterColors([]); setMaxWidth(""); setPriceRange([0, maxPrice]);
  }
  function addToCart(product: Product) {
    const hasAnyPlan = installmentPrices.some(ip => ip.product_id === product.id && ip.monthly_price > 0);
    if (!hasAnyPlan) {
      toast({ title: "สินค้ายังไม่มีแผนผ่อนชำระ", description: "ไม่สามารถจองได้ในขณะนี้", variant: "destructive" });
      return;
    }
    const stock = stockMap.get(product.id) ?? 0;
    if (stock <= 0) {
      toast({ title: "สินค้าหมด", description: `${product.name} ไม่มีสินค้าในสต็อก`, variant: "destructive" });
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
    toast({ title: "เพิ่มลงตะกร้าแล้ว", description: product.name });
  }
  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map((c) => c.product.id === productId ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  }
  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  }
  function toggleFilter(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  // Check if all cart items have installment pricing for any plan
  const cartHasPlans = useMemo(() => {
    return cart.every(c => installmentPrices.some(ip => ip.product_id === c.product.id && ip.monthly_price > 0));
  }, [cart, installmentPrices]);

  async function handleCheckout() {
    if (!custName.trim()) { toast({ title: "กรุณากรอกชื่อ", variant: "destructive" }); return; }
    if (cart.length === 0) return;
    if (!liffSelectedPlan) { toast({ title: "กรุณาเลือกแผนผ่อนชำระ", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      let customerId: string;
      if (liffProfile?.userId) {
        const { data: existing } = await supabase.from("customers").select("id").eq("line_user_id", liffProfile.userId).maybeSingle();
        if (existing) {
          customerId = existing.id;
          await supabase.from("customers").update({ display_name: custName, phone: custPhone || null, address: custAddress || null, picture_url: liffProfile.pictureUrl || null }).eq("id", existing.id);
        } else {
          customerId = crypto.randomUUID();
          const { error } = await supabase.from("customers").insert({ id: customerId, line_user_id: liffProfile.userId, display_name: custName, phone: custPhone || null, address: custAddress || null, picture_url: liffProfile.pictureUrl || null });
          if (error) throw error;
        }
      } else {
        customerId = crypto.randomUUID();
        const { error } = await supabase.from("customers").insert({ id: customerId, display_name: custName, phone: custPhone || null, address: custAddress || null });
        if (error) throw error;
      }
      const orderId = crypto.randomUUID();
      const selectedPlanObj = installmentPlans.find(p => p.months === liffSelectedPlan);
      const monthlyAmt = selectedPlanObj ? cart.reduce((sum, c) => {
        const mp = getMonthlyPriceForPlan(c.product.id, selectedPlanObj.id);
        return sum + (mp || 0) * c.qty;
      }, 0) : null;
      const { error: orderErr } = await supabase.from("orders").insert({ id: orderId, customer_id: customerId, total_amount: 0, note: custNote || null, delivery_method: liffDeliveryMethod, installment_months: liffSelectedPlan, monthly_amount: monthlyAmt } as any);
      if (orderErr) throw orderErr;
      const items = cart.map((c) => {
        const unitPrice = selectedPlanObj ? (getMonthlyPriceForPlan(c.product.id, selectedPlanObj.id) || 0) : 0;
        return { order_id: orderId, product_id: c.product.id, quantity: c.qty, unit_price: unitPrice };
      });
      const { error: itemErr } = await supabase.from("order_items").insert(items);
      if (itemErr) throw itemErr;
      // Send LINE notification (fire-and-forget)
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      fetch(`https://${projectId}.supabase.co/functions/v1/line-notify-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          customer_name: custName.trim(),
          total_amount: monthlyAmt || 0,
          item_count: cart.length,
          delivery_method: liffDeliveryMethod,
          monthly_amount: monthlyAmt,
          installment_months: liffSelectedPlan,
          product_names: cart.map((c) => c.product.name),
        }),
      }).catch(() => {});

      setOrderSuccess(orderId);
      setCart([]); setCheckoutOpen(false); setCartOpen(false);
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  async function handleSaveProfile() {
    if (!customer) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("customers").update({ phone: editPhone || null, address: editAddress || null }).eq("id", customer.id);
      if (error) throw error;
      setCustomer({ ...customer, phone: editPhone || null, address: editAddress || null });
      setEditingProfile(false);
      toast({ title: "บันทึกข้อมูลแล้ว" });
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSavingProfile(false);
  }

  async function handleLinkOrder() {
    if (!liffProfile?.userId || linkOrderCode.trim().length < 4) {
      toast({ title: "กรุณากรอกเลขใบจองอย่างน้อย 4 ตัว", variant: "destructive" });
      return;
    }
    setLinkingOrder(true);
    try {
      const { data: rpcData } = await supabase.rpc("search_order_by_code", { code: linkOrderCode.trim() });
      const matched = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      if (!matched) { toast({ title: "ไม่พบคำสั่งจอง", variant: "destructive" }); setLinkingOrder(false); return; }
      const { data: cust } = await supabase.from("customers").select("id, line_user_id").eq("id", matched.customer_id).single();
      if (!cust) { toast({ title: "ไม่พบข้อมูลลูกค้า", variant: "destructive" }); setLinkingOrder(false); return; }
      if (cust.line_user_id && cust.line_user_id !== liffProfile.userId) {
        toast({ title: "คำสั่งจองนี้ผูกกับบัญชี LINE อื่นแล้ว", variant: "destructive" }); setLinkingOrder(false); return;
      }
      await supabase.from("customers").update({ line_user_id: liffProfile.userId, picture_url: liffProfile.pictureUrl || null }).eq("id", cust.id);
      toast({ title: "ผูกคำสั่งจองสำเร็จ!" });
      setLinkOrderOpen(false);
      setLinkOrderCode("");
      fetchCustomerOrders();
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setLinkingOrder(false);
  }

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* ─── Compact Header ─── */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/85 backdrop-blur-lg shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <span className="text-lg font-bold text-primary-foreground">{siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            {liffProfile?.pictureUrl && (
              <img src={liffProfile.pictureUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-primary-foreground/30" />
            )}
            {cartCount > 0 && (
              <button onClick={() => setCartOpen(true)} className="relative p-2">
                <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{cartCount}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Tab Content ─── */}
      <AnimatePresence mode="wait">
        {activeTab === "shop" && (
          <motion.div key="shop" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            {/* Search Bar */}
            <div className="max-w-5xl mx-auto px-4 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 pr-9 h-10 rounded-xl bg-card border-border" />
                {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
              </div>
            </div>

            {/* Hero Carousel for special offers */}
            {!search && specialOffers.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 py-3">
                <Carousel opts={{ loop: true }} className="w-full">
                  <CarouselContent>
                    {specialOffers.slice(0, 5).map((p) => (
                      <CarouselItem key={p.id}>
                        <div
                          onClick={() => setSelectedProduct(p)}
                          className="relative h-40 sm:h-48 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-r from-primary/10 to-accent/20"
                        >
                          {p.image_url && <img src={p.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            <Badge className="bg-red-500 text-white border-0 mb-1.5 text-xs">
                              <Zap className="h-3 w-3 mr-1" /> ลด {Math.round((1 - (p.discount_price || 0) / (p.selling_price || 1)) * 100)}%
                            </Badge>
                            <h3 className="font-bold text-base line-clamp-1">{p.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-bold">{formatPrice(p.discount_price)}</span>
                              <span className="text-sm text-white/60 line-through">{formatPrice(p.selling_price)}</span>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            <div className="max-w-5xl mx-auto px-4">
              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => setSelectedCat("all")} className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCat === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border"}`}>ทั้งหมด</button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${selectedCat === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground border border-border"}`}>{cat.name}</button>
                ))}
              </div>

              {/* Sort + Filter */}
              <div className="flex items-center gap-2 py-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-40 h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">🔥 ยอดนิยม</SelectItem>
                    <SelectItem value="newest">✨ สินค้าใหม่</SelectItem>
                    <SelectItem value="price_asc">ราคา ต่ำ → สูง</SelectItem>
                    <SelectItem value="price_desc">ราคา สูง → ต่ำ</SelectItem>
                    <SelectItem value="discount">⚡ ส่วนลดสูงสุด</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg relative" onClick={() => setFilterOpen(true)}>
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" /> ตัวกรอง
                  {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">{activeFilterCount}</span>}
                </Button>
              </div>

              {/* Special Sections */}
              {!search && selectedCat === "all" && (
                <div className="py-2">
                  <ProductSection title="สินค้าขายดี" icon={<Flame className="h-5 w-5 text-orange-500" />} products={bestSellers} onProductClick={setSelectedProduct} onAddCart={addToCart} />
                  <ProductSection title="สินค้ามาใหม่" icon={<Star className="h-5 w-5 text-green-500" />} products={newArrivals} onProductClick={setSelectedProduct} onAddCart={addToCart} />
                </div>
              )}

              {/* Product Grid */}
              <div className="py-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">สินค้าทั้งหมด</h3>
                  <span className="text-xs text-muted-foreground">{filtered.length} รายการ</span>
                </div>
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-2xl overflow-hidden border border-border">
                        <Skeleton className="aspect-square" />
                        <div className="p-3 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-1/3" /></div>
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="h-14 w-14 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">ไม่พบสินค้า</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {filtered.map((product, i) => (
                      <ProductCard key={product.id} product={product} index={i} onClick={() => setSelectedProduct(product)} onAddCart={() => addToCart(product)} monthlyPrice={getMonthlyPrice(product)} maxMonths={maxMonthsPlan?.months} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Orders Tab ─── */}
        {activeTab === "orders" && (
          <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="max-w-5xl mx-auto px-4 py-4">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" /> คำสั่งจองของฉัน
            </h2>

            {!liffProfile ? (
              <div className="text-center py-20">
                <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-1">ยังไม่ได้เชื่อม LINE LIFF</p>
                <p className="text-sm text-muted-foreground/70 mb-4">กรุณาเปิดผ่านลิงก์ LIFF เพื่อดูคำสั่งจองของคุณ</p>
                {liffLaunchUrl && (
                  <Button asChild variant="outline">
                    <a href={liffLaunchUrl}>เปิดผ่าน LINE LIFF</a>
                  </Button>
                )}
              </div>
            ) : ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : (
              <>
                {/* Link Order Button */}
                <Button variant="outline" size="sm" className="mb-4 gap-2" onClick={() => setLinkOrderOpen(true)}>
                  <ClipboardList className="h-4 w-4" /> ผูกคำสั่งจองจากเว็บ
                </Button>

                {myOrders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium mb-1">ยังไม่มีคำสั่งจอง</p>
                    <p className="text-sm text-muted-foreground/70 mb-4">เริ่มสั่งจองสินค้าได้เลย!</p>
                    <Button variant="outline" onClick={() => setActiveTab("shop")}>
                      <Store className="h-4 w-4 mr-2" /> ดูสินค้า
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((order) => {
                      const cfg = statusConfig[order.status] || statusConfig.pending;
                      return (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(order.created_at), "d MMM yyyy HH:mm", { locale: th })}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">#{order.id.slice(0, 8)}</p>
                            </div>
                            <Badge className={`${cfg.color} text-white border-0 text-[10px]`}>{cfg.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{order.order_items.length} รายการ</p>
                            {order.monthly_amount ? (
                              <p className="font-bold text-primary">{formatPrice(order.monthly_amount)}/เดือน</p>
                            ) : (
                              <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-end mt-1">
                            <span className="text-xs text-primary flex items-center gap-0.5">ดูรายละเอียด <ChevronRight className="h-3 w-3" /></span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ─── Profile Tab ─── */}
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="max-w-5xl mx-auto px-4 py-4">
            {!liffProfile ? (
              <div className="text-center py-20">
                <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-1">ยังไม่ได้เชื่อม LINE LIFF</p>
                <p className="text-sm text-muted-foreground/70 mb-4">กรุณาเปิดผ่านลิงก์ LIFF เพื่อดูโปรไฟล์ของคุณ</p>
                {liffLaunchUrl && (
                  <Button asChild variant="outline">
                    <a href={liffLaunchUrl}>เปิดผ่าน LINE LIFF</a>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Profile Header */}
                <div className="bg-card rounded-2xl border border-border p-6 text-center">
                  {liffProfile.pictureUrl ? (
                    <img src={liffProfile.pictureUrl} alt="" className="h-20 w-20 rounded-full mx-auto mb-3 ring-4 ring-primary/20 shadow-lg" />
                  ) : (
                    <div className="h-20 w-20 rounded-full mx-auto mb-3 bg-primary/10 flex items-center justify-center">
                      <User className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                  <h2 className="text-lg font-bold text-foreground">{liffProfile.displayName}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">LINE Account</p>
                </div>

                {/* Contact Info */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">ข้อมูลติดต่อ</h3>
                    {!editingProfile ? (
                      <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)} className="text-xs">
                        <Edit2 className="h-3.5 w-3.5 mr-1" /> แก้ไข
                      </Button>
                    ) : (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingProfile(false)} className="text-xs">ยกเลิก</Button>
                        <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="text-xs">
                          <Save className="h-3.5 w-3.5 mr-1" /> บันทึก
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingProfile ? (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">เบอร์โทร</Label>
                        <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ที่อยู่จัดส่ง</Label>
                        <Textarea value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="ที่อยู่สำหรับจัดส่ง..." rows={3} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">เบอร์โทร</p>
                          <p className="text-sm text-foreground">{customer?.phone || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">ที่อยู่จัดส่ง</p>
                          <p className="text-sm text-foreground">{customer?.address || "—"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Summary */}
                <div className="bg-card rounded-2xl border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3">สรุปคำสั่งจอง</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-2xl font-bold text-foreground">{myOrders.length}</p>
                      <p className="text-[10px] text-muted-foreground">ทั้งหมด</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-2xl font-bold text-yellow-600">{myOrders.filter(o => o.status === "pending").length}</p>
                      <p className="text-[10px] text-muted-foreground">รอดำเนินการ</p>
                    </div>
                    <div className="bg-muted rounded-xl p-3">
                      <p className="text-2xl font-bold text-green-600">{myOrders.filter(o => o.status === "completed").length}</p>
                      <p className="text-[10px] text-muted-foreground">สำเร็จ</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Navigation ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg">
        <div className="max-w-5xl mx-auto flex">
          {([
            { key: "shop" as TabKey, icon: Store, label: "ร้านค้า" },
            { key: "orders" as TabKey, icon: ClipboardList, label: "คำสั่งจอง" },
            { key: "profile" as TabKey, icon: User, label: "โปรไฟล์" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}
            >
              <tab.icon className={`h-5 w-5 ${activeTab === tab.key ? "text-primary" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Order Detail Dialog ─── */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">คำสั่งจอง #{selectedOrder.id.slice(0, 8)}</DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedOrder.created_at), "d MMMM yyyy เวลา HH:mm น.", { locale: th })}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <OrderStatusProgress status={selectedOrder.status} />
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted">
                      {item.products?.image_url ? (
                        <img src={item.products.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.products?.name || "สินค้า"}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-primary">{formatPrice((item.unit_price || 0) * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                {selectedOrder.note && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                    <span className="font-medium">หมายเหตุ:</span> {selectedOrder.note}
                  </div>
                )}
                {selectedOrder.status_reason && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
                    <span className="font-medium">เหตุผลจากเจ้าหน้าที่:</span> {selectedOrder.status_reason}
                  </div>
                )}
                {selectedOrder.monthly_amount ? (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">ยอดผ่อน/เดือน</span>
                      <span className="text-lg font-bold text-primary">{formatPrice(selectedOrder.monthly_amount)}/เดือน</span>
                    </div>
                    {selectedOrder.installment_months && (
                      <p className="text-sm text-muted-foreground text-right">ผ่อนชำระ {selectedOrder.installment_months} เดือน</p>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-medium">ยอดรวม</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Filter Sheet ─── */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-sm">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" /> ตัวกรองสินค้า</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            <div className="space-y-3">
              <Label className="font-semibold">ช่วงราคา</Label>
              <Slider min={0} max={maxPrice} step={100} value={priceRange} onValueChange={(v) => setPriceRange(v as [number, number])} />
              <div className="flex justify-between text-sm text-muted-foreground"><span>{formatPrice(priceRange[0])}</span><span>{formatPrice(priceRange[1])}</span></div>
            </div>
            {allBrands.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">แบรนด์</Label>
                <div className="space-y-1.5">{allBrands.map(b => (<label key={b} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={filterBrands.includes(b)} onCheckedChange={() => toggleFilter(filterBrands, b, setFilterBrands)} />{b}</label>))}</div>
              </div>
            )}
            {allMaterials.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">วัสดุ</Label>
                <div className="space-y-1.5">{allMaterials.map(m => (<label key={m} className="flex items-center gap-2 text-sm cursor-pointer"><Checkbox checked={filterMaterials.includes(m)} onCheckedChange={() => toggleFilter(filterMaterials, m, setFilterMaterials)} />{m}</label>))}</div>
              </div>
            )}
            {allColors.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">สี</Label>
                <div className="flex flex-wrap gap-2">{allColors.map(c => (<button key={c} onClick={() => toggleFilter(filterColors, c, setFilterColors)} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterColors.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}>{c}</button>))}</div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="font-semibold">ความกว้างสูงสุด (เมตร)</Label>
              <Input type="number" min={0} step={0.1} value={maxWidth} onChange={e => setMaxWidth(e.target.value)} placeholder="เช่น 1.20" />
            </div>
          </div>
          <SheetFooter className="border-t pt-4 gap-2">
            <Button variant="outline" onClick={clearFilters} className="flex-1">ล้างตัวกรอง</Button>
            <Button onClick={() => setFilterOpen(false)} className="flex-1">ดูผลลัพธ์ ({filtered.length})</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Cart Sheet ─── */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> ตะกร้าสินค้า ({cartCount})</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                {item.product.image_url ? <img src={item.product.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/30" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">x{item.qty}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive ml-1" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            {cart.length === 0 && <div className="text-center py-12 text-muted-foreground">ตะกร้าว่างเปล่า</div>}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <Button className="w-full" size="lg" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>สั่งจองสินค้า</Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Checkout Dialog ─── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ข้อมูลสำหรับสั่งจอง</DialogTitle>
            <DialogDescription>กรอกข้อมูลติดต่อเพื่อจองสินค้า</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2"><Label>ชื่อ *</Label><Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
            <div className="space-y-2"><Label>เบอร์โทร</Label><Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" /></div>
            <div className="space-y-2"><Label>ที่อยู่จัดส่ง</Label><Textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="ที่อยู่สำหรับจัดส่ง..." rows={3} /></div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label className="font-semibold">วิธีรับสินค้า</Label>
              <div className="flex gap-2">
                <Button type="button" variant={liffDeliveryMethod === "pickup" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setLiffDeliveryMethod("pickup")}>
                  <Store className="h-4 w-4 mr-1" /> รับหน้าร้าน
                </Button>
                <Button type="button" variant={liffDeliveryMethod === "delivery" ? "default" : "outline"} size="sm" className="flex-1" onClick={() => setLiffDeliveryMethod("delivery")}>
                  <MapPin className="h-4 w-4 mr-1" /> จัดส่งถึงบ้าน
                </Button>
              </div>
            </div>

            {/* Installment Plan — only show plans that have pricing for all cart items */}
            {installmentPlans.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">แผนผ่อนชำระ *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {installmentPlans.map((plan) => {
                    const totalMonthly = cart.reduce((sum, c) => {
                      const mp = getMonthlyPriceForPlan(c.product.id, plan.id);
                      return sum + (mp || 0) * c.qty;
                    }, 0);
                    if (totalMonthly <= 0) return null;
                    return (
                      <Button key={plan.months} type="button" variant={liffSelectedPlan === plan.months ? "default" : "outline"} size="sm" className="flex flex-col h-auto py-2" onClick={() => setLiffSelectedPlan(plan.months)}>
                        <span className="text-xs">{plan.months} เดือน</span>
                        <span className="text-xs font-bold">{formatPrice(totalMonthly)}/เดือน</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2"><Label>หมายเหตุ</Label><Textarea value={custNote} onChange={(e) => setCustNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." rows={2} /></div>
            <div className="bg-muted rounded-lg p-3 space-y-1.5">
              {cart.map((c) => {
                const selectedPlanObj = installmentPlans.find(p => p.months === liffSelectedPlan);
                const monthlyP = selectedPlanObj ? getMonthlyPriceForPlan(c.product.id, selectedPlanObj.id) : getMonthlyPrice(c.product);
                return (<div key={c.product.id} className="flex justify-between text-sm"><span className="truncate mr-2">{c.product.name} x{c.qty}</span><span className="font-mono shrink-0">{monthlyP ? `${formatPrice(monthlyP * c.qty)}/เดือน` : "—"}</span></div>);
              })}
              {(() => {
                const selectedPlanObj = installmentPlans.find(p => p.months === liffSelectedPlan);
                const totalMonthly = selectedPlanObj ? cart.reduce((sum, c) => {
                  const mp = getMonthlyPriceForPlan(c.product.id, selectedPlanObj.id);
                  return sum + (mp || 0) * c.qty;
                }, 0) : 0;
                return (
                  <div className="border-t pt-1.5 flex justify-between font-medium">
                    <span>ยอดผ่อน/เดือน</span>
                    <span className="text-primary font-bold">{totalMonthly > 0 ? `${formatPrice(totalMonthly)}/เดือน` : "—"}</span>
                  </div>
                );
              })()}
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={submitting}>{submitting ? "กำลังส่งคำสั่งจอง..." : "ยืนยันสั่งจอง"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Order Success ─── */}
      <Dialog open={!!orderSuccess} onOpenChange={(o) => !o && setOrderSuccess(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground">สั่งจองสำเร็จ!</h2>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-xs text-muted-foreground">เลขใบจอง</p>
              <p className="font-mono text-sm font-bold text-foreground mt-1">#{orderSuccess?.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-left">
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">📌 กรุณาจดหรือ screenshot เลขใบจองนี้ไว้เพื่อตรวจสอบสถานะ</p>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={() => { if (orderSuccess) { navigator.clipboard.writeText(orderSuccess.slice(0, 8).toUpperCase()); toast({ title: "คัดลอกเลขใบจองแล้ว" }); } }}>
              คัดลอกเลขใบจอง
            </Button>
            <p className="text-sm text-muted-foreground">📞 รอฝ่ายสินเชื่อติดต่อกลับ</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setOrderSuccess(null); setActiveTab("orders"); }} className="flex-1">
                <Eye className="h-4 w-4 mr-1" /> ดูคำสั่งจอง
              </Button>
              <Button onClick={() => setOrderSuccess(null)} className="flex-1">ปิด</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAddCart={addToCart} installmentPlans={installmentPlans} installmentPrices={installmentPrices} />

      {/* Link Order Dialog */}
      <Dialog open={linkOrderOpen} onOpenChange={setLinkOrderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>ผูกคำสั่งจองจากเว็บ</DialogTitle>
            <DialogDescription>กรอกเลขใบจองที่ได้รับจากการสั่งจองผ่านเว็บไซต์ เพื่อเชื่อมกับบัญชี LINE ของคุณ</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="กรอกเลขใบจอง เช่น A1B2C3D4"
              value={linkOrderCode}
              onChange={(e) => setLinkOrderCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg tracking-wider uppercase"
              maxLength={36}
            />
            <Button className="w-full" onClick={handleLinkOrder} disabled={linkingOrder || linkOrderCode.trim().length < 4}>
              {linkingOrder ? "กำลังผูก..." : "ผูกคำสั่งจอง"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
