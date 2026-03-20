import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShoppingBag, Loader2, CheckCircle2, ArrowLeft, User, Trash2, Minus, Plus, Store, Truck } from "lucide-react";
import { motion } from "framer-motion";

const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

export default function Checkout() {
  const { data: settings } = useSiteSettings();
  const { items, updateQty, removeItem, clearCart, cartCount, total } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<"summary" | "form">("summary");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");

  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  const handleGuestCheckout = () => setStep("form");

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "กรุณากรอกชื่อและเบอร์โทร", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .insert({ display_name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || null })
        .select("id")
        .single();
      if (custErr) throw custErr;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({ customer_id: customer.id, total_amount: total, note: form.note.trim() || null, status: "pending", delivery_method: deliveryMethod })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      setOrderId(order.id);
      clearCart();
      setForm({ name: "", phone: "", address: "", note: "" });
      setStep("summary");
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (items.length === 0 && !orderId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={0} />
        <div className="pt-32 text-center max-w-md mx-auto px-4">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h2 className="text-xl font-bold font-heading mb-2">ตะกร้าว่างเปล่า</h2>
          <p className="text-muted-foreground mb-6">กรุณาเลือกสินค้าก่อนทำการสั่งจอง</p>
          <Button onClick={() => navigate("/products")} className="gap-2">
            <ShoppingBag className="h-4 w-4" /> ดูสินค้า
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <div className="pt-28 sm:pt-32 pb-16 mx-auto max-w-4xl px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate("/products")}>
            <ArrowLeft className="h-4 w-4" /> กลับไปหน้าสินค้า
          </Button>

          <h1 className="text-2xl sm:text-3xl font-bold font-heading mb-8">สรุปรายการสั่งจอง</h1>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-3 space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-primary font-semibold text-sm">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm sticky top-28">
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2 text-sm">
                    {items.map((i) => (
                      <div key={i.id} className="flex justify-between">
                        <span className="text-muted-foreground truncate max-w-[60%]">{i.name} x{i.quantity}</span>
                        <span>{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>รวมทั้งหมด</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>

                  {step === "summary" ? (
                    <div className="space-y-3 pt-2">
                      <Button size="lg" className="w-full text-base gap-2" onClick={handleGuestCheckout}>
                        <User className="h-5 w-5" />
                        จองเลย (ไม่ต้องสมัคร)
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">ชื่อ-นามสกุล *</Label>
                        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="กรอกชื่อ-นามสกุล" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">เบอร์โทรศัพท์ *</Label>
                        <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0xx-xxx-xxxx" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">วิธีรับสินค้า</Label>
                        <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="flex gap-3">
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="pickup" id="ch-pickup" />
                            <Label htmlFor="ch-pickup" className="flex items-center gap-1 text-xs cursor-pointer">
                              <Store className="h-3.5 w-3.5 text-primary" /> รับหน้าร้าน
                            </Label>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <RadioGroupItem value="delivery" id="ch-delivery" />
                            <Label htmlFor="ch-delivery" className="flex items-center gap-1 text-xs cursor-pointer">
                              <Truck className="h-3.5 w-3.5 text-primary" /> จัดส่งถึงบ้าน
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">ที่อยู่จัดส่ง</Label>
                        <Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="ที่อยู่" rows={2} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">หมายเหตุ</Label>
                        <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="ข้อความเพิ่มเติม" rows={2} />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setStep("summary")} disabled={submitting}>ย้อนกลับ</Button>
                        <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                          {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          ยืนยันสั่งจอง
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Success dialog */}
      <Dialog open={!!orderId} onOpenChange={(v) => { if (!v) { setOrderId(null); navigate("/"); } }}>
        <DialogContent className="text-center max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              สั่งจองสำเร็จ!
            </DialogTitle>
            <DialogDescription className="space-y-3">
              <p>ขอบคุณที่สั่งจองสินค้า เราจะติดต่อกลับเพื่อยืนยัน</p>
              {orderId && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">เลขใบจอง</p>
                  <p className="font-mono text-sm font-bold text-foreground mt-1">{orderId.slice(0, 8).toUpperCase()}</p>
                </div>
              )}
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-left">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">📌 กรุณาจดหรือ screenshot เลขใบจองนี้ไว้เพื่อตรวจสอบสถานะ</p>
              </div>
              {orderId && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(orderId.slice(0, 8).toUpperCase());
                    toast({ title: "คัดลอกเลขใบจองแล้ว" });
                  }}
                >
                  คัดลอกเลขใบจอง
                </Button>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <Button className="w-full" onClick={() => { setOrderId(null); navigate("/"); }}>
              กลับหน้าแรก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
