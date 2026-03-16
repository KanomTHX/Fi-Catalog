import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, Loader2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface CartItem {
  id: string;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

interface WebOrderCartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

const formatPrice = (n: number) => `฿${n.toLocaleString()}`;

export function WebOrderCart({ open, onOpenChange, items, onUpdate, onRemove, onClear }: WebOrderCartProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: "กรุณากรอกชื่อและเบอร์โทร", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      // Create customer
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .insert({ display_name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim() || null })
        .select("id")
        .single();
      if (custErr) throw custErr;

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          total_amount: total,
          note: form.note.trim() || null,
          status: "pending",
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      // Create order items
      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        quantity: i.quantity,
        unit_price: i.price,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      setSuccess(true);
      onClear();
      setStep("cart");
      setForm({ name: "", phone: "", address: "", note: "" });
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setStep("cart"); }}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {step === "cart" ? `ตะกร้าสินค้า (${items.length})` : "ข้อมูลการสั่งจอง"}
            </SheetTitle>
          </SheetHeader>

          {step === "cart" ? (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {items.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>ตะกร้าว่างเปล่า</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-sm text-primary font-semibold">{formatPrice(item.price)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdate(item.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onUpdate(item.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onRemove(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-base font-bold">
                    <span>รวมทั้งหมด</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                  <Button className="w-full" size="lg" onClick={() => setStep("checkout")}>
                    ดำเนินการสั่งจอง
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                <div className="space-y-2">
                  <Label>ชื่อ-นามสกุล *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="กรอกชื่อ-นามสกุล"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label>เบอร์โทรศัพท์ *</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="0xx-xxx-xxxx"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ที่อยู่จัดส่ง</Label>
                  <Textarea
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="ที่อยู่สำหรับจัดส่งสินค้า"
                    rows={3}
                    maxLength={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="ข้อความเพิ่มเติม (ถ้ามี)"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  {items.map((i) => (
                    <div key={i.id} className="flex justify-between">
                      <span className="text-muted-foreground">{i.name} x{i.quantity}</span>
                      <span>{formatPrice(i.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                    <span>รวม</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep("cart")} disabled={submitting}>
                  ย้อนกลับ
                </Button>
                <Button className="flex-1" onClick={handleCheckout} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  ยืนยันสั่งจอง
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Success dialog */}
      <Dialog open={success} onOpenChange={setSuccess}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              สั่งจองสำเร็จ!
            </DialogTitle>
            <DialogDescription>
              ขอบคุณที่สั่งจองสินค้า เราจะติดต่อกลับเพื่อยืนยันคำสั่งจองของคุณ
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setSuccess(false)} className="mt-4">ปิด</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
