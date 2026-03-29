import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Package, User, LogOut } from "lucide-react";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "รอดำเนินการ", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  confirmed: { label: "ยืนยันแล้ว", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  processing: { label: "กำลังจัดเตรียม", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  completed: { label: "สำเร็จ", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
};

const formatPrice = (n: number | null) => (n != null ? `฿${n.toLocaleString()}` : "—");

export default function CustomerPortal() {
  const { user, customer, loading: authLoading, signOut, refreshCustomer } = useCustomerAuth();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { cartCount } = useCart();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ display_name: "", phone: "", address: "" });

  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  // Fetch orders for this customer
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(name, image_url))")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!customer?.id,
  });

  const handleEditProfile = () => {
    if (customer) {
      setProfileForm({
        display_name: customer.display_name,
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    if (!customer) return;
    const { error } = await supabase
      .from("customers")
      .update({
        display_name: profileForm.display_name,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
      })
      .eq("id", customer.id);
    if (error) {
      toast({ title: "บันทึกล้มเหลว", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "บันทึกข้อมูลสำเร็จ" });
      await refreshCustomer();
      setEditMode(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />
        <div className="pt-32 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <div className="pt-28 sm:pt-32 pb-16 mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-heading">บัญชีของฉัน</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4" /> ออกจากระบบ
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" /> ข้อมูลส่วนตัว</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!customer ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลลูกค้า — จะถูกสร้างเมื่อทำการจองครั้งแรก</p>
              ) : editMode ? (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">ชื่อ</Label><Input value={profileForm.display_name} onChange={(e) => setProfileForm((f) => ({ ...f, display_name: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">เบอร์โทร</Label><Input value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} /></div>
                  <div className="space-y-1"><Label className="text-xs">ที่อยู่</Label><Input value={profileForm.address} onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))} /></div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>บันทึก</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>ยกเลิก</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div><span className="text-xs text-muted-foreground">ชื่อ:</span> <span className="text-sm font-medium">{customer.display_name}</span></div>
                  <div><span className="text-xs text-muted-foreground">เบอร์โทร:</span> <span className="text-sm">{customer.phone || "—"}</span></div>
                  <div><span className="text-xs text-muted-foreground">ที่อยู่:</span> <span className="text-sm">{customer.address || "—"}</span></div>
                  <Button size="sm" variant="outline" onClick={handleEditProfile}>แก้ไขข้อมูล</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Orders */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold font-heading flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> คำสั่งจองของฉัน</h2>
            {ordersLoading ? (
              <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
            ) : !orders || orders.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>ยังไม่มีคำสั่งจอง</p>
                <Button className="mt-4" onClick={() => navigate("/products")}>ดูสินค้า</Button>
              </CardContent></Card>
            ) : (
              orders.map((order: any) => {
                const s = statusMap[order.status] || { label: order.status, color: "bg-muted text-muted-foreground" };
                return (
                  <Card key={order.id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">เลขใบจอง</p>
                          <p className="font-mono text-sm font-bold">{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <Badge className={`${s.color} border-0`}>{s.label}</Badge>
                      </div>
                      <Separator />
                      <div className="space-y-1.5">
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            {item.products?.image_url && <img src={item.products.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                            <span className="flex-1 truncate">{item.products?.name || "สินค้า"}</span>
                            <span className="text-muted-foreground">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString("th-TH")}</span>
                        {order.monthly_amount && (
                          <span className="font-medium text-primary">{formatPrice(order.monthly_amount)}/เดือน ({order.installment_months} เดือน)</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
