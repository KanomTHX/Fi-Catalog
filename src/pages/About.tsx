import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { Users, Clock, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function About() {
  const { data: settings } = useSiteSettings();
  const { cartCount } = useCart();
  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h1 className="text-3xl sm:text-4xl font-bold font-heading">เกี่ยวกับเรา</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">รู้จัก {siteName} ร้านเฟอร์นิเจอร์คุณภาพที่ลูกค้าไว้วางใจ</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="rounded-3xl shadow-lg w-full max-w-md mx-auto object-cover aspect-[4/3]" />
              ) : (
                <div className="rounded-3xl bg-gradient-to-br from-primary/15 to-accent/20 w-full max-w-md mx-auto aspect-[4/3] flex items-center justify-center">
                  <Users className="h-24 w-24 text-primary/30" />
                </div>
              )}
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">เรื่องราวของเรา</h2>
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

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-background/50">
          © {new Date().getFullYear()} {siteName}
        </div>
      </footer>
    </div>
  );
}
