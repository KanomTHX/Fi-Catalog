import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  const { data: settings } = useSiteSettings();
  const { cartCount } = useCart();
  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <section className="pt-28 sm:pt-32 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-14">
            <h1 className="text-3xl sm:text-4xl font-bold font-heading">ติดต่อเรา</h1>
            <p className="text-muted-foreground mt-3">ยินดีให้บริการ</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-6">
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
                    <a href={`tel:${settings.phone}`} className="text-muted-foreground text-sm mt-1 hover:text-primary transition-colors">{settings.phone}</a>
                  </div>
                </div>
              )}
              {settings?.email && (
                <div className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border shadow-sm">
                  <Mail className="h-6 w-6 text-primary mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-semibold font-heading">อีเมล</h4>
                    <a href={`mailto:${settings.email}`} className="text-muted-foreground text-sm mt-1 hover:text-primary transition-colors">{settings.email}</a>
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

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              {settings?.google_map_embed ? (
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg aspect-[4/3]" dangerouslySetInnerHTML={{ __html: settings.google_map_embed }} />
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

      <footer className="border-t border-border bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center text-sm text-background/50">
          © {new Date().getFullYear()} {siteName}
        </div>
      </footer>
    </div>
  );
}
