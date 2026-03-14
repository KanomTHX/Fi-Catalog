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
  confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-500", step: 2 },
  completed: { label: "เบิกสินค้าแล้ว", color: "bg-green-500", step: 3 },
  cancelled: { label: "ยกเลิก", color: "bg-destructive", step: 0 },
};

// ─── Product Card ───
function ProductCard({ product, onClick, onAddCart, index }: { product: Product; onClick: () => void; onAddCart: () => void; index: number }) {
  const hasDiscount = product.discount_price != null && product.discount_price < (product.selling_price || 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div onClick={onClick} className="aspect-square bg-muted relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_new && <Badge className="text-[10px] bg-green-500 text-white border-0 shadow-sm">ใหม่</Badge>}
          {hasDiscount && <Badge className="text-[10px] bg-red-500 text-white border-0 shadow-sm">-{Math.round((1 - product.discount_price! / (product.selling_price || 1)) * 100)}%</Badge>}
        </div>
      </div>
      <div className="p-3">
        <h3 onClick={onClick} className="font-medium text-sm text-foreground line-clamp-2 leading-snug mb-1">
          {product.name}
        </h3>
        {product.brand && <p className="text-[11px] text-muted-foreground mb-1.5">{product.brand}</p>}
        <div className="flex items-end justify-between">
          <div>
            {hasDiscount ? (
              <>
                <p className="text-primary font-bold text-base leading-none">{formatPrice(product.discount_price)}</p>
                <p className="text-muted-foreground text-[11px] line-through">{formatPrice(product.selling_price)}</p>
              </>
            ) : (
              <p className="text-primary font-bold text-base leading-none">{formatPrice(product.selling_price)}</p>
            )}
          </div>
          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full shrink-0" onClick={(e) => { e.stopPropagation(); onAddCart(); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product Detail Dialog ───
function ProductDetailDialog({ product, open, onClose, onAddCart }: { product: Product | null; open: boolean; onClose: () => void; onAddCart: (p: Product) => void }) {
  if (!product) return null;
  const hasDiscount = product.discount_price != null && product.discount_price < (product.selling_price || 0);
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
          <div className="absolute top-4 left-4 flex gap-2">
            {product.categories?.name && <Badge className="backdrop-blur-sm bg-background/80 text-foreground" variant="outline">{product.categories.name}</Badge>}
            {product.is_new && <Badge className="bg-green-500 text-white border-0">ใหม่</Badge>}
            {hasDiscount && <Badge className="bg-red-500 text-white border-0">ลดราคา</Badge>}
          </div>
        </div>
        <div className="p-6 space-y-3">
          <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
          {product.brand && <p className="text-sm text-muted-foreground">{product.brand}</p>}
          {product.description && <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>}
          <div className="flex flex-wrap gap-2">
            {product.material && <Badge variant="secondary">วัสดุ: {product.material}</Badge>}
            {product.color && <Badge variant="secondary">สี: {product.color}</Badge>}
            {product.dimensions && <Badge variant="secondary">ขนาด: {product.dimensions}</Badge>}
          </div>
          <div className="flex items-center justify-between pt-1">
            {hasDiscount ? (
              <div>
                <span className="text-2xl font-bold text-primary">{formatPrice(product.discount_price)}</span>
                <span className="text-sm text-muted-foreground line-through ml-2">{formatPrice(product.selling_price)}</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-primary">{formatPrice(product.selling_price)}</span>
            )}
            <Button onClick={() => { onAddCart(product); onClose(); }}>
              <ShoppingCart className="h-4 w-4 mr-2" /> เพิ่มลงตะกร้า
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  if (status === "cancelled") {
    return <Badge variant="destructive" className="text-xs">ยกเลิก</Badge>;
  }
  const steps = [
    { label: "รอดำเนินการ", step: 1 },
    { label: "ยืนยันแล้ว", step: 2 },
    { label: "เบิกสินค้าแล้ว", step: 3 },
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
              <div className={`h-0.5 w-8 sm:w-12 transition-colors ${cfg.step > s.step ? cfg.color : "bg-muted"}`} />
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

  const cartTotal = cart.reduce((sum, c) => sum + (c.product.discount_price ?? c.product.selling_price ?? 0) * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

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
      const [prodRes, catRes, orderCountRes, siteRes] = await Promise.all([
        supabase.from("products").select("id, name, sku, selling_price, discount_price, image_url, category_id, brand, description, weight, location, color, material, dimensions, is_new, is_featured, created_at, categories(name)").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("product_order_counts" as any).select("*"),
        supabase.from("site_settings").select("*").limit(1).single(),
      ]);
      if (prodRes.data) setProducts(prodRes.data as any);
      if (catRes.data) setCategories(catRes.data);
      if (orderCountRes.data) setOrderCounts(orderCountRes.data as any);
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
          .select("id, status, total_amount, note, created_at, order_items(id, quantity, unit_price, products(name, sku, image_url))")
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

  async function handleCheckout() {
    if (!custName.trim()) { toast({ title: "กรุณากรอกชื่อ", variant: "destructive" }); return; }
    if (cart.length === 0) return;
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
      const { error: orderErr } = await supabase.from("orders").insert({ id: orderId, customer_id: customerId, total_amount: cartTotal, note: custNote || null });
      if (orderErr) throw orderErr;
      const items = cart.map((c) => ({ order_id: orderId, product_id: c.product.id, quantity: c.qty, unit_price: c.product.discount_price ?? c.product.selling_price ?? 0 }));
      const { error: itemErr } = await supabase.from("order_items").insert(items);
      if (itemErr) throw itemErr;
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
                      <ProductCard key={product.id} product={product} index={i} onClick={() => setSelectedProduct(product)} onAddCart={() => addToCart(product)} />
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
                <p className="text-muted-foreground font-medium mb-1">กรุณาเปิดผ่าน LINE</p>
                <p className="text-sm text-muted-foreground/70">เพื่อดูคำสั่งจองของคุณ</p>
              </div>
            ) : ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
              </div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-20">
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
                        <p className="font-bold text-primary">{formatPrice(order.total_amount)}</p>
                      </div>
                      <div className="flex items-center justify-end mt-1">
                        <span className="text-xs text-primary flex items-center gap-0.5">ดูรายละเอียด <ChevronRight className="h-3 w-3" /></span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Profile Tab ─── */}
        {activeTab === "profile" && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="max-w-5xl mx-auto px-4 py-4">
            {!liffProfile ? (
              <div className="text-center py-20">
                <User className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-1">กรุณาเปิดผ่าน LINE</p>
                <p className="text-sm text-muted-foreground/70">เพื่อดูโปรไฟล์ของคุณ</p>
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
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="font-medium">ยอดรวม</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
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
            {cart.map((item) => {
              const price = item.product.discount_price ?? item.product.selling_price;
              return (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  {item.product.image_url ? <img src={item.product.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/30" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-primary font-semibold">{formatPrice(price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive ml-1" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
            {cart.length === 0 && <div className="text-center py-12 text-muted-foreground">ตะกร้าว่างเปล่า</div>}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">ยอดรวม</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
                </div>
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
          <div className="space-y-4">
            <div className="space-y-2"><Label>ชื่อ *</Label><Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="ชื่อ-นามสกุล" /></div>
            <div className="space-y-2"><Label>เบอร์โทร</Label><Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" /></div>
            <div className="space-y-2"><Label>ที่อยู่จัดส่ง</Label><Textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="ที่อยู่สำหรับจัดส่ง..." rows={3} /></div>
            <div className="space-y-2"><Label>หมายเหตุ</Label><Textarea value={custNote} onChange={(e) => setCustNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." rows={2} /></div>
            <div className="bg-muted rounded-lg p-3 space-y-1.5">
              {cart.map((c) => {
                const price = c.product.discount_price ?? c.product.selling_price ?? 0;
                return (<div key={c.product.id} className="flex justify-between text-sm"><span className="truncate mr-2">{c.product.name} x{c.qty}</span><span className="font-mono shrink-0">{formatPrice(price * c.qty)}</span></div>);
              })}
              <div className="border-t pt-1.5 flex justify-between font-medium"><span>ยอดรวม</span><span className="text-primary font-bold">{formatPrice(cartTotal)}</span></div>
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
            <p className="text-sm text-muted-foreground">หมายเลข: #{orderSuccess?.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">ทางร้านจะติดต่อกลับเพื่อยืนยันคำสั่งจอง</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setOrderSuccess(null); setActiveTab("orders"); }} className="flex-1">
                <Eye className="h-4 w-4 mr-1" /> ดูคำสั่งจอง
              </Button>
              <Button onClick={() => setOrderSuccess(null)} className="flex-1">ปิด</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAddCart={addToCart} />
    </div>
  );
}
