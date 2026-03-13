import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Package, Sparkles, ShoppingCart, Plus, Minus, Trash2, CheckCircle, SlidersHorizontal, Flame, Zap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  selling_price: number | null;
  discount_price: number | null;
  image_url: string | null;
  category_id: string | null;
  brand: string | null;
  description: string | null;
  weight: number | null;
  location: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  is_new: boolean;
  is_featured: boolean;
  created_at: string;
  categories: { name: string } | null;
}

interface Category { id: string; name: string; }
interface CartItem { product: Product; qty: number; }
interface LiffProfile { displayName?: string; pictureUrl?: string; userId?: string; }
interface OrderCount { product_id: string; order_count: number; }

type SortOption = "popular" | "newest" | "price_asc" | "price_desc" | "discount";

const formatPrice = (price: number | null) => {
  if (price == null) return "—";
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(price);
};

function ProductCard({ product, onClick, onAddCart, index }: { product: Product; onClick: () => void; onAddCart: () => void; index: number }) {
  const hasDiscount = product.discount_price != null && product.discount_price < (product.selling_price || 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300"
    >
      <div onClick={onClick} className="aspect-square bg-muted relative overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/10">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.categories?.name && (
            <Badge className="text-[10px] backdrop-blur-sm bg-background/80 text-foreground border-border/50" variant="outline">
              {product.categories.name}
            </Badge>
          )}
          {product.is_new && <Badge className="text-[10px] bg-green-500 text-white border-0">ใหม่</Badge>}
          {hasDiscount && <Badge className="text-[10px] bg-red-500 text-white border-0">ลด {Math.round((1 - product.discount_price! / (product.selling_price || 1)) * 100)}%</Badge>}
        </div>
      </div>
      <div className="p-3.5">
        <h3 onClick={onClick} className="font-semibold text-sm text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.brand && <p className="text-[11px] text-muted-foreground mt-0.5">{product.brand}</p>}
        <div className="flex items-center justify-between mt-1.5">
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-1.5">
                <p className="text-primary font-bold text-lg">{formatPrice(product.discount_price)}</p>
                <p className="text-muted-foreground text-xs line-through">{formatPrice(product.selling_price)}</p>
              </div>
            ) : (
              <p className="text-primary font-bold text-lg">{formatPrice(product.selling_price)}</p>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={(e) => { e.stopPropagation(); onAddCart(); }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

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
            {product.categories?.name && (
              <Badge className="backdrop-blur-sm bg-background/80 text-foreground" variant="outline">{product.categories.name}</Badge>
            )}
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
          {(product.weight || product.location) && (
            <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              {product.weight && <span>น้ำหนัก: {product.weight} กก.</span>}
              {product.location && <span>ตำแหน่ง: {product.location}</span>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Horizontal scroll section
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
          <div key={p.id} className="w-44 shrink-0">
            <ProductCard product={p} index={i} onClick={() => onProductClick(p)} onAddCart={() => onAddCart(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Showcase() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);

  // Site settings
  const [siteName, setSiteName] = useState("StockFlow");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>("popular");

  // Filtering
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [filterBrands, setFilterBrands] = useState<string[]>([]);
  const [filterMaterials, setFilterMaterials] = useState<string[]>([]);
  const [filterColors, setFilterColors] = useState<string[]>([]);
  const [maxWidth, setMaxWidth] = useState<string>("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Checkout form
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custNote, setCustNote] = useState("");

  const cartTotal = cart.reduce((sum, c) => sum + (c.product.discount_price ?? c.product.selling_price ?? 0) * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  // Extract unique filter values
  const allBrands = useMemo(() => [...new Set(products.map(p => p.brand).filter(Boolean))] as string[], [products]);
  const allMaterials = useMemo(() => [...new Set(products.map(p => p.material).filter(Boolean))] as string[], [products]);
  const allColors = useMemo(() => [...new Set(products.map(p => p.color).filter(Boolean))] as string[], [products]);
  const maxPrice = useMemo(() => Math.max(...products.map(p => p.selling_price || 0), 100000), [products]);

  // LIFF init
  useEffect(() => {
    async function initLiff() {
      try {
        const { data } = await supabase.from("line_settings").select("liff_id").limit(1).single();
        if (data?.liff_id) {
          const liff = (await import("@line/liff")).default;
          await liff.init({ liffId: data.liff_id });
          if (!liff.isLoggedIn()) {
            liff.login();
            return;
          }
          const profile = await liff.getProfile();
          setLiffProfile({ displayName: profile.displayName, pictureUrl: profile.pictureUrl, userId: profile.userId });
          setCustName(profile.displayName || "");
        }
      } catch { }
    }
    initLiff();
  }, []);

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

  const getOrderCount = (id: string) => orderCounts.find(o => o.product_id === id)?.order_count || 0;

  // Special sections
  const bestSellers = useMemo(() => {
    return [...products].sort((a, b) => getOrderCount(b.id) - getOrderCount(a.id)).filter(p => getOrderCount(p.id) > 0).slice(0, 10);
  }, [products, orderCounts]);

  const newArrivals = useMemo(() => {
    return products.filter(p => p.is_new).slice(0, 10);
  }, [products]);

  const specialOffers = useMemo(() => {
    return products.filter(p => p.discount_price != null && p.discount_price < (p.selling_price || 0));
  }, [products]);

  // Filtered + sorted products
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

    // Sort
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => getOrderCount(b.id) - getOrderCount(a.id));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price_asc":
        result.sort((a, b) => (a.discount_price ?? a.selling_price ?? 0) - (b.discount_price ?? b.selling_price ?? 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b.discount_price ?? b.selling_price ?? 0) - (a.discount_price ?? a.selling_price ?? 0));
        break;
      case "discount":
        result.sort((a, b) => {
          const dA = (a.selling_price || 0) - (a.discount_price ?? a.selling_price ?? 0);
          const dB = (b.selling_price || 0) - (b.discount_price ?? b.selling_price ?? 0);
          return dB - dA;
        });
        break;
    }
    return result;
  }, [products, selectedCat, search, sortBy, priceRange, filterBrands, filterMaterials, filterColors, maxWidth, orderCounts]);

  const activeFilterCount = [filterBrands.length > 0, filterMaterials.length > 0, filterColors.length > 0, !!maxWidth, priceRange[0] > 0 || priceRange[1] < maxPrice].filter(Boolean).length;

  function clearFilters() {
    setFilterBrands([]);
    setFilterMaterials([]);
    setFilterColors([]);
    setMaxWidth("");
    setPriceRange([0, maxPrice]);
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

  async function handleCheckout() {
    if (!custName.trim()) { toast({ title: "กรุณากรอกชื่อ", variant: "destructive" }); return; }
    if (cart.length === 0) return;

    setSubmitting(true);
    try {
      let customerId: string;
      if (liffProfile?.userId) {
        const { data: existing, error: existingErr } = await supabase
          .from("customers")
          .select("id")
          .eq("line_user_id", liffProfile.userId)
          .maybeSingle();

        if (existingErr) throw existingErr;

        if (existing) {
          customerId = existing.id;
          const { error: updateErr } = await supabase
            .from("customers")
            .update({
              display_name: custName,
              phone: custPhone || null,
              address: custAddress || null,
              picture_url: liffProfile.pictureUrl || null,
            })
            .eq("id", existing.id);
          if (updateErr) console.warn("Customer update skipped:", updateErr.message);
        } else {
          customerId = crypto.randomUUID();
          const { error } = await supabase.from("customers").insert({
            id: customerId,
            line_user_id: liffProfile.userId,
            display_name: custName,
            phone: custPhone || null,
            address: custAddress || null,
            picture_url: liffProfile.pictureUrl || null,
          });
          if (error) throw error;
        }
      } else {
        customerId = crypto.randomUUID();
        const { error } = await supabase.from("customers").insert({
          id: customerId,
          display_name: custName,
          phone: custPhone || null,
          address: custAddress || null,
        });
        if (error) throw error;
      }

      const orderId = crypto.randomUUID();
      const { error: orderErr } = await supabase.from("orders").insert({
        id: orderId,
        customer_id: customerId,
        total_amount: cartTotal,
        note: custNote || null,
      });
      if (orderErr) throw orderErr;

      const items = cart.map((c) => ({ order_id: orderId, product_id: c.product.id, quantity: c.qty, unit_price: c.product.discount_price ?? c.product.selling_price ?? 0 }));
      const { error: itemErr } = await supabase.from("order_items").insert(items);
      if (itemErr) throw itemErr;

      setOrderSuccess(orderId);
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  }

  function toggleFilter(arr: string[], val: string, setter: (v: string[]) => void) {
    setter(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.3),transparent_70%)]" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <h1 className="text-xl font-bold text-primary-foreground">{siteName}</h1>
            </motion.div>
            <div className="flex items-center gap-3">
              {liffProfile && (
                <div className="flex items-center gap-2">
                  {liffProfile.pictureUrl && <img src={liffProfile.pictureUrl} alt="" className="h-8 w-8 rounded-full ring-2 ring-primary-foreground/30" />}
                  <span className="text-sm text-primary-foreground/90 hidden sm:inline">{liffProfile.displayName}</span>
                </div>
              )}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">สินค้าของเรา</h2>
            <p className="text-primary-foreground/70 text-sm">ค้นหาและเลือกดูสินค้าทั้งหมด</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="ค้นหาสินค้า หรือแบรนด์..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-11 pr-10 h-12 rounded-2xl bg-background/95 backdrop-blur-md border-0 shadow-lg text-base" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-4 relative z-20">
        {/* Category Pills + Sort + Filter */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-3 mb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSelectedCat("all")} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${selectedCat === "all" ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"}`}>
              ทั้งหมด
            </button>
            {categories.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shadow-sm ${selectedCat === cat.id ? "bg-primary text-primary-foreground shadow-md scale-105" : "bg-card text-muted-foreground border border-border hover:bg-accent hover:text-accent-foreground"}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-44 h-9 text-sm rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">🔥 ยอดนิยม</SelectItem>
                <SelectItem value="newest">✨ สินค้าใหม่</SelectItem>
                <SelectItem value="price_asc">ราคา ต่ำ → สูง</SelectItem>
                <SelectItem value="price_desc">ราคา สูง → ต่ำ</SelectItem>
                <SelectItem value="discount">⚡ ส่วนลดสูงสุด</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 rounded-xl relative" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-1" /> ตัวกรอง
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{activeFilterCount}</span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Special Sections */}
        {!search && selectedCat === "all" && (
          <div className="py-4">
            <ProductSection title="สินค้าขายดี" icon={<Flame className="h-5 w-5 text-orange-500" />} products={bestSellers} onProductClick={setSelectedProduct} onAddCart={addToCart} />
            <ProductSection title="สินค้ามาใหม่" icon={<Star className="h-5 w-5 text-green-500" />} products={newArrivals} onProductClick={setSelectedProduct} onAddCart={addToCart} />
            <ProductSection title="ดีลพิเศษ" icon={<Zap className="h-5 w-5 text-red-500" />} products={specialOffers} onProductClick={setSelectedProduct} onAddCart={addToCart} />
          </div>
        )}

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
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <Package className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">ไม่พบสินค้า</p>
                </motion.div>
              ) : (
                <motion.div key={selectedCat + search + sortBy} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filtered.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} onClick={() => setSelectedProduct(product)} onAddCart={() => addToCart(product)} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Footer */}
        <div className="pb-24 pt-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />
          <p className="text-center text-xs text-muted-foreground">
            {filtered.length} สินค้า • Powered by <span className="font-semibold">{siteName}</span>
          </p>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
        >
          <ShoppingCart className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" /> ตัวกรองสินค้า
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-6">
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="font-semibold">ช่วงราคา</Label>
              <Slider
                min={0}
                max={maxPrice}
                step={100}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>

            {/* Brand */}
            {allBrands.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">แบรนด์</Label>
                <div className="space-y-1.5">
                  {allBrands.map(b => (
                    <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={filterBrands.includes(b)} onCheckedChange={() => toggleFilter(filterBrands, b, setFilterBrands)} />
                      {b}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Material */}
            {allMaterials.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">วัสดุ</Label>
                <div className="space-y-1.5">
                  {allMaterials.map(m => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={filterMaterials.includes(m)} onCheckedChange={() => toggleFilter(filterMaterials, m, setFilterMaterials)} />
                      {m}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Color */}
            {allColors.length > 0 && (
              <div className="space-y-2">
                <Label className="font-semibold">สี</Label>
                <div className="flex flex-wrap gap-2">
                  {allColors.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleFilter(filterColors, c, setFilterColors)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterColors.includes(c) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:bg-accent"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Max Width */}
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

      {/* Cart Sheet */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> ตะกร้าสินค้า ({cartCount})
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {cart.map((item) => {
              const price = item.product.discount_price ?? item.product.selling_price;
              return (
                <div key={item.product.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  {item.product.image_url ? (
                    <img src={item.product.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-sm text-primary font-semibold">{formatPrice(price)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive ml-1" onClick={() => removeFromCart(item.product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {cart.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">ตะกร้าว่างเปล่า</div>
            )}
          </div>
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">ยอดรวม</span>
                  <span className="text-xl font-bold text-primary">{formatPrice(cartTotal)}</span>
                </div>
                <Button className="w-full" size="lg" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                  สั่งจองสินค้า
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ข้อมูลสำหรับสั่งจอง</DialogTitle>
            <DialogDescription>กรอกข้อมูลติดต่อเพื่อจองสินค้า</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ *</Label>
              <Input value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทร</Label>
              <Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="08x-xxx-xxxx" type="tel" />
            </div>
            <div className="space-y-2">
              <Label>ที่อยู่จัดส่ง</Label>
              <Textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)} placeholder="ที่อยู่สำหรับจัดส่ง..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea value={custNote} onChange={(e) => setCustNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." rows={2} />
            </div>
            <div className="bg-muted rounded-lg p-3 space-y-1.5">
              {cart.map((c) => {
                const price = c.product.discount_price ?? c.product.selling_price ?? 0;
                return (
                  <div key={c.product.id} className="flex justify-between text-sm">
                    <span className="truncate mr-2">{c.product.name} x{c.qty}</span>
                    <span className="font-mono shrink-0">{formatPrice(price * c.qty)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-1.5 flex justify-between font-medium">
                <span>ยอดรวม</span>
                <span className="text-primary font-bold">{formatPrice(cartTotal)}</span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={submitting}>
              {submitting ? "กำลังส่งคำสั่งจอง..." : "ยืนยันสั่งจอง"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={!!orderSuccess} onOpenChange={(o) => !o && setOrderSuccess(null)}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6 space-y-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            </motion.div>
            <h2 className="text-xl font-bold text-foreground">สั่งจองสำเร็จ!</h2>
            <p className="text-sm text-muted-foreground">หมายเลข: #{orderSuccess?.slice(0, 8)}</p>
            <p className="text-sm text-muted-foreground">ทางร้านจะติดต่อกลับเพื่อยืนยันคำสั่งจอง</p>
            <Button onClick={() => setOrderSuccess(null)} className="w-full">ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProductDetailDialog product={selectedProduct} open={!!selectedProduct} onClose={() => setSelectedProduct(null)} onAddCart={addToCart} />
    </div>
  );
}
