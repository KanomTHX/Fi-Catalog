import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Search, Package, Loader2, ClipboardList, CheckCircle2, Clock, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; step: number; icon: any }> = {
  pending: { label: "รอดำเนินการ", color: "text-yellow-600", step: 1, icon: Clock },
  confirmed: { label: "ยืนยันแล้ว", color: "text-blue-600", step: 2, icon: CheckCircle2 },
  completed: { label: "เสร็จสิ้น", color: "text-green-600", step: 3, icon: CheckCircle2 },
  cancelled: { label: "ยกเลิก", color: "text-destructive", step: 0, icon: XCircle },
};

export default function OrderTracking() {
  const { data: settings } = useSiteSettings();
  const { cartCount } = useCart();
  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const code = trackingCode.trim();
    if (code.length < 4) {
      setError("กรุณากรอกเลขใบจองอย่างน้อย 4 ตัวอักษร");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      // Use RPC to cast UUID to text for partial search
      const { data: rpcData, error: rpcErr } = await supabase.rpc("search_order_by_code", { code });
      if (rpcErr) throw rpcErr;
      const matchedOrder = Array.isArray(rpcData) ? rpcData[0] : rpcData;

      let data = null;
      if (matchedOrder) {
        const { data: fullOrder, error: fetchErr } = await supabase
          .from("orders")
          .select("id, status, total_amount, note, created_at, delivery_method, installment_months, customers(display_name), order_items(id, quantity, unit_price, products(name, image_url))")
          .eq("id", matchedOrder.id)
          .single();
        if (fetchErr) throw fetchErr;
        data = fullOrder;
      }

      const err = null;
      if (!data) {
        setError("ไม่พบใบจองที่ตรงกับเลขที่ระบุ");
      } else {
        setOrder(data);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const cfg = order ? (statusConfig[order.status] || statusConfig.pending) : null;
  const steps = [
    { label: "รอดำเนินการ", step: 1 },
    { label: "ยืนยันแล้ว", step: 2 },
    { label: "เสร็จสิ้น", step: 3 },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <div className="pt-28 sm:pt-32 pb-16 mx-auto max-w-2xl px-4">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/">หน้าแรก</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><span className="text-foreground font-medium">ตรวจสอบใบจอง</span></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="text-center mb-8">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">ตรวจสอบสถานะใบจอง</h1>
            <p className="text-muted-foreground mt-2">กรอกเลขใบจองเพื่อตรวจสอบสถานะ</p>
          </div>

          <div className="flex gap-2 mb-8">
            <Input
              placeholder="กรอกเลขใบจอง เช่น A1B2C3D4"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="text-center font-mono text-lg tracking-wider uppercase"
            />
            <Button onClick={handleSearch} disabled={loading} className="gap-2 px-6">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              ค้นหา
            </Button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">{error}</p>
            </motion.div>
          )}

          {order && cfg && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-5">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">เลขใบจอง</p>
                      <p className="font-mono font-bold text-lg">{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <Badge className={`${cfg.color} border-0`} variant="secondary">
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  {order.status !== "cancelled" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        {steps.map((s, i) => (
                          <div key={s.step} className="flex items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${cfg!.step >= s.step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {cfg!.step >= s.step ? "✓" : s.step}
                            </div>
                            {i < steps.length - 1 && (
                              <div className={`h-1 w-12 sm:w-20 rounded transition-colors ${cfg!.step > s.step ? "bg-primary" : "bg-muted"}`} />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {steps.map((s) => <span key={s.step}>{s.label}</span>)}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">วันที่สั่งจอง</p>
                      <p className="font-medium">{format(new Date(order.created_at), "d MMM yyyy HH:mm", { locale: th })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">ชื่อผู้จอง</p>
                      <p className="font-medium">{(order as any).customers?.display_name || "-"}</p>
                    </div>
                    {order.delivery_method && (
                      <div>
                        <p className="text-muted-foreground text-xs">วิธีรับสินค้า</p>
                        <p className="font-medium">{order.delivery_method === "delivery" ? "จัดส่งถึงบ้าน" : "รับหน้าร้าน"}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Order Items */}
                  <div>
                    <p className="text-sm font-medium mb-3">รายการสินค้า</p>
                    <div className="space-y-2">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.products?.image_url ? (
                            <img src={item.products.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.products?.name || "สินค้า"}</p>
                            <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">฿{((item.unit_price || 0) * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>รวมทั้งหมด</span>
                    <span className="text-primary">฿{(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
