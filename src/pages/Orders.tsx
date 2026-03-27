import { useOrders, useUpdateOrderStatus, useDeleteOrder } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ShoppingCart, Phone, MapPin, Store, Truck, CreditCard, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "รอดำเนินการ", variant: "outline" },
  credit_check: { label: "รอฝ่ายสินเชื่อติดต่อ", variant: "secondary" },
  credit_approved: { label: "อนุมัติสินเชื่อ", variant: "secondary" },
  shipping: { label: "รอจัดส่ง", variant: "secondary" },
  completed: { label: "จัดส่งสำเร็จ", variant: "default" },
  credit_rejected: { label: "ไม่อนุมัติสินเชื่อ", variant: "destructive" },
};

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const { role } = useAuth();
  const [detailOrder, setDetailOrder] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Status change with reason
  const [statusChangeOrder, setStatusChangeOrder] = useState<{ orderId: string; newStatus: string } | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const formatPrice = (n: number | null) =>
    n != null ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n) : "—";

  const handleStatusSelect = (orderId: string, newStatus: string, currentStatus: string) => {
    if (newStatus === currentStatus) return;
    setStatusChangeOrder({ orderId, newStatus });
    setStatusReason("");
  };

  const confirmStatusChange = () => {
    if (!statusChangeOrder) return;
    updateStatus.mutate({
      orderId: statusChangeOrder.orderId,
      status: statusChangeOrder.newStatus,
      reason: statusReason.trim() || undefined,
    });
    setStatusChangeOrder(null);
    setStatusReason("");
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" /> คำสั่งจอง
        </h1>
        <p className="text-muted-foreground">จัดการคำสั่งจองสินค้าจากลูกค้า</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการทั้งหมด ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ลูกค้า</TableHead>
                <TableHead className="hidden sm:table-cell">เบอร์โทร</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">ยอดรวม</TableHead>
                <TableHead>วิธีรับ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
                const isLocked = order.status === "completed";
                return (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => setDetailOrder(order)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.customers?.picture_url && (
                          <img src={order.customers.picture_url} alt="" className="h-7 w-7 rounded-full" />
                        )}
                        <span className="font-medium">{order.customers?.display_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {order.customers?.phone || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {order.order_items?.length || 0} รายการ
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatPrice(order.total_amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.delivery_method === "delivery" ? (
                        <span className="flex items-center gap-1 text-muted-foreground"><Truck className="h-3.5 w-3.5" /> จัดส่ง</span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground"><Store className="h-3.5 w-3.5" /> หน้าร้าน</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusSelect(order.id, newStatus, order.status)}
                          disabled={updateStatus.isPending || isLocked}
                        >
                          <SelectTrigger className={`w-[130px] h-8 text-xs ${isLocked ? "opacity-50" : ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, cfg]) => (
                              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {role === "admin" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    ยังไม่มีคำสั่งจอง
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Status Reason Dialog */}
      <Dialog open={!!statusChangeOrder} onOpenChange={(o) => !o && setStatusChangeOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>เปลี่ยนสถานะคำสั่งจอง</DialogTitle>
            <DialogDescription>
              เปลี่ยนเป็น: {statusChangeOrder ? statusConfig[statusChangeOrder.newStatus]?.label : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>เหตุผล (ไม่บังคับ)</Label>
              <Textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="เช่น เอกสารไม่ครบ, อนุมัติแล้ว, จัดส่งแล้ววันที่..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusChangeOrder(null)}>ยกเลิก</Button>
            <Button onClick={confirmStatusChange} disabled={updateStatus.isPending}>ยืนยัน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={(o) => !o && setDetailOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำสั่งจอง</DialogTitle>
            <DialogDescription>#{detailOrder?.id?.slice(0, 8)}</DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {detailOrder.customers?.picture_url && (
                  <img src={detailOrder.customers.picture_url} alt="" className="h-10 w-10 rounded-full" />
                )}
                <div>
                  <p className="font-semibold">{detailOrder.customers?.display_name}</p>
                  {detailOrder.customers?.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {detailOrder.customers.phone}
                    </p>
                  )}
                </div>
              </div>
              {detailOrder.customers?.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /> {detailOrder.customers.address}
                </p>
              )}
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  {detailOrder.delivery_method === "delivery" ? <><Truck className="h-3.5 w-3.5" /> จัดส่งถึงบ้าน</> : <><Store className="h-3.5 w-3.5" /> รับหน้าร้าน</>}
                </span>
                {detailOrder.installment_months && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5" /> ผ่อน {detailOrder.installment_months} เดือน
                  </span>
                )}
              </div>
              <div className="border rounded-lg divide-y">
                {detailOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="h-10 w-10 rounded object-contain bg-muted" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.products?.name}</p>
                      <p className="text-xs text-muted-foreground">x{item.quantity} • {formatPrice(item.unit_price)}</p>
                    </div>
                    <p className="text-sm font-mono">{formatPrice(item.quantity * (item.unit_price || 0))}</p>
                  </div>
                ))}
              </div>
              {detailOrder.monthly_amount ? (
                <div className="space-y-1">
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-medium">ยอดผ่อน/เดือน</span>
                    <span className="text-lg font-bold text-primary">{formatPrice(detailOrder.monthly_amount)}/เดือน</span>
                  </div>
                  {detailOrder.installment_months && (
                    <p className="text-sm text-muted-foreground text-right">ผ่อนชำระ {detailOrder.installment_months} เดือน</p>
                  )}
                </div>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">ยอดรวม</span>
                  <span className="text-lg font-bold text-primary">{formatPrice(detailOrder.total_amount)}</span>
                </div>
              )}
              {detailOrder.status_reason && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">เหตุผล: {detailOrder.status_reason}</p>
              )}
              {detailOrder.note && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">หมายเหตุ: {detailOrder.note}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบคำสั่งจอง</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบคำสั่งจองนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteOrder.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}