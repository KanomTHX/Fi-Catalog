import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { PromoBanners } from "@/components/PromoBanners";
import { WebOrderCart } from "@/components/WebOrderCart";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag, Truck, Shield, ArrowRight, Star, Package,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

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
    setTimeout(() => setCount(Math.min(count + Math.ceil(target / 30), target)), 30);
  }
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const } }),
};

export default function Home() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { items, updateQty, removeItem, clearCart, cartCount } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();

  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 sm:pt-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Star className="h-4 w-4" />
                เฟอร์นิเจอร์คุณภาพ รับประกัน
              </div>
              {settingsLoading ? (
                <Skeleton className="h-16 w-80" />
              ) : (
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight font-heading">
                  ยินดีต้อนรับสู่<br />
                  <span className="text-primary">{siteName}</span>
                </h1>
              )}
              <p className="text-lg text-muted-foreground max-w-lg">
                {settings?.company_description || "เลือกชมเฟอร์นิเจอร์คุณภาพและสั่งจองได้ง่ายๆ ผ่านหน้าเว็บไซต์ของเรา"}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2 text-base px-8" onClick={() => navigate("/products")}>
                  <ShoppingBag className="h-5 w-5" />
                  ดูสินค้าทั้งหมด
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base px-8" onClick={() => navigate("/contact")}>
                  ติดต่อเรา
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex gap-8 pt-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading"><CounterAnimation target={500} suffix="+" /></div>
                  <p className="text-sm text-muted-foreground">สินค้าพร้อมขาย</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading"><CounterAnimation target={1000} suffix="+" /></div>
                  <p className="text-sm text-muted-foreground">ลูกค้าที่ไว้วางใจ</p>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary font-heading"><CounterAnimation target={99} suffix="%" /></div>
                  <p className="text-sm text-muted-foreground">ความพึงพอใจ</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative hidden lg:block">
              {logoUrl ? (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-accent/15 rounded-3xl blur-2xl scale-105" />
                  <img src={logoUrl} alt={siteName} className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl object-cover aspect-square" />
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

      <PromoBanners />

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">ทำไมต้องเลือกเรา</h2>
          <p className="text-muted-foreground mt-2">ขั้นตอนการบริการของเรา</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 group h-full relative overflow-hidden bg-card shadow-sm">
                <span className="absolute top-4 right-4 text-5xl font-extrabold text-muted/50 group-hover:text-primary/15 transition-colors font-heading">{f.num}</span>
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 sm:p-12 text-center shadow-xl"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 font-heading">พร้อมสั่งจองแล้วหรือยัง?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">เลือกเฟอร์นิเจอร์ที่ต้องการแล้วสั่งจองได้เลย เราจะติดต่อกลับเพื่อยืนยัน</p>
          <Button size="lg" variant="secondary" className="gap-2 text-base px-8" onClick={() => navigate("/products")}>
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
                <li><button onClick={() => navigate("/")} className="hover:text-primary transition-colors duration-300">หน้าแรก</button></li>
                <li><button onClick={() => navigate("/products")} className="hover:text-primary transition-colors duration-300">สินค้า</button></li>
                <li><button onClick={() => navigate("/about")} className="hover:text-primary transition-colors duration-300">เกี่ยวกับเรา</button></li>
                <li><button onClick={() => navigate("/contact")} className="hover:text-primary transition-colors duration-300">ติดต่อ</button></li>
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

      <WebOrderCart open={cartOpen} onOpenChange={setCartOpen} items={items} onUpdate={updateQty} onRemove={removeItem} onClear={clearCart} />
    </div>
  );
}
