import { useState, useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { PromoBanners } from "@/components/PromoBanners";
import { ProductCatalog } from "@/components/ProductCatalog";
import { WebOrderCart, type CartItem } from "@/components/WebOrderCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag, MessageCircle, Truck, Shield, ArrowRight, MapPin, Phone, Mail,
  Clock, Star, Users, Package,
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const formatPrice = (price: number | null) =>
  price != null ? `฿${price.toLocaleString()}` : "";

const features = [
  { icon: Star, num: "01", title: "ให้คำปรึกษา", desc: "ทีมงานพร้อมให้คำปรึกษาเกี่ยวกับสินค้าที่เหมาะกับคุณ" },
  { icon: Package, num: "02", title: "เลือกสินค้า", desc: "คัดสรรสินค้าคุณภาพดี ได้มาตรฐาน ตรงตามความต้องการ" },
  { icon: Truck, num: "03", title: "จัดส่งรวดเร็ว", desc: "บริการจัดส่งรวดเร็ว ทั่วประเทศ ปลอดภัยทุกชิ้น" },
  { icon: Shield, num: "04", title: "รับประกันคุณภาพ", desc: "มั่นใจในคุณภาพสินค้าทุกชิ้น พร้อมบริการหลังการขาย" },
];

function CounterAnimation({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  if (inView && count < target) {
    setTimeout(() => {
      setCount(Math.min(count + Math.ceil(target / 30), target));
    }, 30);
  }

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  const addToCart = useCallback((product: { id: string; name: string; image_url: string | null; selling_price: number | null; discount_price: number | null }) => {
    const price = product.discount_price || product.selling_price || 0;
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: product.id, name: product.name, image_url: product.image_url, price, quantity: 1 }];
    });
    toast({ title: "เพิ่มสินค้าลงตะกร้าแล้ว", description: product.name });
  }, [toast]);

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart((p) => p.filter((i) => i.id !== id)); return; }
    setCart((p) => p.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeItem = (id: string) => setCart((p) => p.filter((i) => i.id !== id));
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      {/* Hero */}
      <section id="hero" className="relative overflow-hidden pt-20 sm:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Star className="h-4 w-4" />
                เฟอร์นิเจอร์คุณภาพ รับประกัน
              </div>
              {settingsLoading ? (
                <Skeleton className="h-16 w-80" />
              ) : (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight font-heading">
                  ยินดีต้อนรับสู่
                  <br />
                  <span className="text-primary">{siteName}</span>
                </h1>
              )}
              <p className="text-lg text-muted-foreground max-w-lg">
                {settings?.company_description || "เลือกชมเฟอร์นิเจอร์คุณภาพและสั่งจองได้ง่ายๆ ผ่านหน้าเว็บไซต์ของเรา"}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="gap-2 text-base px-8"
                  onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}
                >
                  <ShoppingBag className="h-5 w-5" />
                  ดูสินค้าทั้งหมด
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 text-base px-8"
                  onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                >
                  ติดต่อเรา
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading">
                    <CounterAnimation target={500} suffix="+" />
                  </div>
                  <p className="text-sm text-muted-foreground">สินค้าพร้อมขาย</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading">
                    <CounterAnimation target={1000} suffix="+" />
                  </div>
                  <p className="text-sm text-muted-foreground">ลูกค้าที่ไว้วางใจ</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading">
                    <CounterAnimation target={99} suffix="%" />
                  </div>
                  <p className="text-sm text-muted-foreground">ความพึงพอใจ</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {logoUrl ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl blur-2xl scale-105" />
                  <img
                    src={logoUrl}
                    alt={siteName}
                    className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl object-cover aspect-square"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl blur-2xl scale-105" />
                  <div className="relative w-full max-w-md mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/70 aspect-square flex items-center justify-center shadow-2xl">
                    <span className="text-7xl font-bold text-primary-foreground font-heading">{siteName.slice(0, 3).toUpperCase()}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Promo banners */}
      <PromoBanners />

      {/* Product catalog (featured + all) */}
      <ProductCatalog onAddToCart={addToCart} />

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">ทำไมต้องเลือกเรา</h2>
          <p className="text-muted-foreground mt-2">ขั้นตอนการบริการของเรา</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 group h-full relative overflow-hidden bg-card shadow-sm">
                <span className="absolute top-4 right-4 text-5xl font-extrabold text-muted/50 group-hover:text-primary/15 transition-colors font-heading">
                  {f.num}
                </span>
                <CardContent className="p-0 flex flex-col gap-4 relative">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-semibold text-lg font-heading">{f.title}</h3>
                  <p className="text-muted-foreground text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About us */}
      <section id="about" className="bg-secondary/40 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="rounded-3xl shadow-lg w-full max-w-md mx-auto object-cover aspect-[4/3]" />
              ) : (
                <div className="rounded-3xl bg-gradient-to-br from-primary/15 to-accent/20 w-full max-w-md mx-auto aspect-[4/3] flex items-center justify-center">
                  <Users className="h-24 w-24 text-primary/30" />
                </div>
              )}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">เกี่ยวกับเรา</h2>
              <p className="text-muted-foreground leading-relaxed">
                {settings?.company_description || `${siteName} คือร้านเฟอร์นิเจอร์ที่มุ่งมั่นให้บริการสินค้าคุณภาพ พร้อมทีมงานมืออาชีพที่พร้อมให้คำปรึกษาและบริการหลังการขายอย่างครบวงจร เราใส่ใจในทุกรายละเอียดเพื่อความพึงพอใจสูงสุดของลูกค้า`}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm">เปิดให้บริการทุกวัน</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="text-sm">ให้คำปรึกษาฟรี</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact + Map */}
      <section id="contact" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">ติดต่อเรา</h2>
            <p className="text-muted-foreground mt-2">ยินดีให้บริการ</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {settings?.address && (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <MapPin className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold font-heading">ที่อยู่</h4>
                    <p className="text-muted-foreground text-sm mt-1">{settings.address}</p>
                  </div>
                </div>
              )}
              {settings?.phone && (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <Phone className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold font-heading">โทรศัพท์</h4>
                    <a href={`tel:${settings.phone}`} className="text-muted-foreground text-sm mt-1 hover:text-primary transition-colors duration-300">
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}
              {settings?.email && (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <Mail className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold font-heading">อีเมล</h4>
                    <a href={`mailto:${settings.email}`} className="text-muted-foreground text-sm mt-1 hover:text-primary transition-colors duration-300">
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
              {settings?.line_id && (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <MessageCircle className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold font-heading">LINE</h4>
                    <p className="text-muted-foreground text-sm mt-1">{settings.line_id}</p>
                  </div>
                </div>
              )}
              {!settings?.address && !settings?.phone && !settings?.email && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>กรุณาเพิ่มข้อมูลติดต่อในหน้าตั้งค่าระบบ</p>
                </div>
              )}
            </motion.div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {settings?.google_map_embed ? (
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg aspect-[4/3]"
                  dangerouslySetInnerHTML={{ __html: settings.google_map_embed }}
                />
              ) : (
                <div className="rounded-2xl bg-card border border-border aspect-[4/3] flex items-center justify-center shadow-sm">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>เพิ่ม Google Map embed ในหน้าตั้งค่า</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 sm:p-12 text-center shadow-xl"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-heading">พร้อมสั่งจองแล้วหรือยัง?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
            เลือกเฟอร์นิเจอร์ที่ต้องการแล้วสั่งจองได้เลย เราจะติดต่อกลับเพื่อยืนยัน
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base px-8"
            onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}
          >
            เลือกสินค้าเลย
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-10 w-10 rounded-xl object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm font-heading">
                    {siteName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-lg font-bold font-heading">{siteName}</span>
              </div>
              <p className="text-background/60 text-sm">
                {settings?.company_description?.slice(0, 100) || "เฟอร์นิเจอร์คุณภาพ บริการครบวงจร"}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-primary font-heading">ลิงก์ด่วน</h4>
              <ul className="space-y-2 text-sm text-background/60">
                <li><button onClick={() => document.querySelector("#hero")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors duration-300">หน้าแรก</button></li>
                <li><button onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors duration-300">สินค้า</button></li>
                <li><button onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors duration-300">เกี่ยวกับเรา</button></li>
                <li><button onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })} className="hover:text-primary transition-colors duration-300">ติดต่อ</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-primary font-heading">ติดต่อ</h4>
              <ul className="space-y-2 text-sm text-background/60">
                {settings?.phone && <li>{settings.phone}</li>}
                {settings?.email && <li>{settings.email}</li>}
                {settings?.line_id && <li>LINE: {settings.line_id}</li>}
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-background/50">
            <span>© {new Date().getFullYear()} {siteName}</span>
            <a href="/admin/auth" className="hover:text-primary transition-colors duration-300">ผู้ดูแลระบบ</a>
          </div>
        </div>
      </footer>

      {/* Cart sheet */}
      <WebOrderCart
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart}
        onUpdate={updateQty}
        onRemove={removeItem}
        onClear={() => setCart([])}
      />
    </div>
  );
}
