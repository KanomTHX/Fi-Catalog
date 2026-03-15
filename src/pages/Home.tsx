import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, MessageCircle, Truck, Shield, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const formatPrice = (price: number | null) =>
  price != null ? `฿${price.toLocaleString()}` : "";

const features = [
  { icon: ShoppingBag, title: "สินค้าคุณภาพ", desc: "คัดสรรสินค้าคุณภาพดี ได้มาตรฐาน" },
  { icon: MessageCircle, title: "สั่งง่ายผ่าน LINE", desc: "เพิ่มเพื่อน LINE แล้วสั่งซื้อได้ทันที" },
  { icon: Truck, title: "จัดส่งรวดเร็ว", desc: "บริการจัดส่งรวดเร็ว ทั่วประเทศ" },
  { icon: Shield, title: "รับประกันคุณภาพ", desc: "มั่นใจในคุณภาพสินค้าทุกชิ้น" },
];

function useFeaturedProducts() {
  return useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, selling_price, discount_price, is_new, is_featured")
        .or("is_featured.eq.true,is_new.eq.true")
        .limit(8);
      if (error) throw error;
      return data;
    },
  });
}

function useLiffUrl() {
  return useQuery({
    queryKey: ["liff-url-home"],
    queryFn: async () => {
      const { data } = await supabase
        .from("line_settings")
        .select("liff_id")
        .limit(1)
        .single();
      if (data?.liff_id) return `https://liff.line.me/${data.liff_id}`;
      return "/liff";
    },
    staleTime: 60_000,
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const { data: products, isLoading: productsLoading } = useFeaturedProducts();
  const { data: liffUrl } = useLiffUrl();

  const siteName = settings?.site_name || "StockFlow";
  const logoUrl = settings?.logo_url;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            {settingsLoading ? (
              <Skeleton className="h-20 w-20 rounded-2xl" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={siteName} className="h-20 w-20 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                {siteName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              {settingsLoading ? <Skeleton className="h-14 w-64" /> : siteName}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl">
              ยินดีต้อนรับ! เลือกชมสินค้าคุณภาพและสั่งจองได้ง่ายๆ ผ่าน LINE
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <a href={liffUrl || "/liff"} target="_blank" rel="noopener noreferrer">
                  <ShoppingBag className="h-5 w-5" />
                  ดูสินค้าและสั่งจอง
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      {(productsLoading || (products && products.length > 0)) && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            สินค้าแนะนำ
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {productsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="aspect-square w-full" />
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              : products?.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    custom={i}
                  >
                    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                            <ShoppingBag className="h-12 w-12" />
                          </div>
                        )}
                        {p.is_new && (
                          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                            ใหม่
                          </span>
                        )}
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="font-medium text-sm sm:text-base line-clamp-2">{p.name}</h3>
                        <div className="mt-1 flex items-baseline gap-2">
                          {p.discount_price ? (
                            <>
                              <span className="text-primary font-bold">{formatPrice(p.discount_price)}</span>
                              <span className="text-muted-foreground text-xs line-through">{formatPrice(p.selling_price)}</span>
                            </>
                          ) : (
                            <span className="text-primary font-bold">{formatPrice(p.selling_price)}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section className="bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-2xl sm:text-3xl font-bold text-center mb-10"
          >
            ทำไมต้องเลือกเรา
          </motion.h2>
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
                <Card className="text-center p-6 hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-0 flex flex-col items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <f.icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-semibold text-lg">{f.title}</h3>
                    <p className="text-muted-foreground text-sm">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="rounded-3xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 sm:p-12 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">พร้อมสั่งจองแล้วหรือยัง?</h2>
          <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
            เพิ่มเพื่อนทาง LINE แล้วเลือกชมสินค้าพร้อมสั่งจองได้เลย!
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 text-base px-8"
            asChild
          >
            <a href={liffUrl || "/liff"} target="_blank" rel="noopener noreferrer">
              เปิด LINE เพื่อสั่งจอง
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {siteName}</span>
          <a href="/admin/auth" className="hover:text-foreground transition-colors">
            ผู้ดูแลระบบ
          </a>
        </div>
      </footer>
    </div>
  );
}
