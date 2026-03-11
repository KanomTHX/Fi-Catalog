import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ShoppingCart, Check, PackageCheck, XCircle, Phone, MapPin } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "รอดำเนินการ", variant: "outline" },
  confirmed: { label: "ยืนยันแล้ว", variant: "secondary" },
  completed: { label: "เบิกแล้ว", variant: "default" },
  cancelled: { label: "ยกเลิก", variant: "destructive" },
};

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [detailOrder, setDetailOrder] = useState<any>(null);

  const formatPrice = (n: number | null) =>
    n != null ? new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n) : "—";

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
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order: any) => {
                const sc = statusConfig[order.status] || statusConfig.pending;
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
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), "dd/MM/yy HH:mm")}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        {order.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ orderId: order.id, status: "confirmed" })} disabled={updateStatus.isPending}>
                              <Check className="h-3.5 w-3.5 mr-1" /> ยืนยัน
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus.mutate({ orderId: order.id, status: "cancelled" })} disabled={updateStatus.isPending}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {order.status === "confirmed" && (
                          <Button size="sm" onClick={() => updateStatus.mutate({ orderId: order.id, status: "completed" })} disabled={updateStatus.isPending}>
                            <PackageCheck className="h-3.5 w-3.5 mr-1" /> เบิกสินค้า
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    ยังไม่มีคำสั่งจอง
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              <div className="border rounded-lg divide-y">
                {detailOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    {item.products?.image_url ? (
                      <img src={item.products.image_url} alt="" className="h-10 w-10 rounded object-cover" />
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
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">ยอมรวม</span>
                <span className="text-lg font-bold text-primary">{formatPrice(detailOrder.total_amount)}</span>
              </div>
              {detailOrder.note && (
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">หมายเหตุ: {detailOrder.note}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
