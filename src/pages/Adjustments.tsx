import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { useStockMovements, useCreateMovement } from "@/hooks/useStockMovements";
import { format } from "date-fns";
import { SlidersHorizontal } from "lucide-react";

export default function Adjustments() {
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useStockMovements("adjustment");
  const createMovement = useCreateMovement();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !note.trim()) return;
    await createMovement.mutateAsync({ product_id: productId, type: "adjustment", quantity: Number(quantity), note });
    setProductId(""); setQuantity(""); setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ปรับปรุงสต็อก</h1>
        <p className="text-muted-foreground">แก้ไขจำนวนสต็อกพร้อมบันทึกเหตุผล</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-chart-4" /> ปรับปรุงสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>สินค้า *</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>จำนวน (ใช้ค่าลบเพื่อหัก) *</Label>
                <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="เช่น 5 หรือ -3" />
              </div>
              <div className="space-y-2">
                <Label>เหตุผล *</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="เหตุผลในการปรับปรุง..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={!productId || !quantity || !note.trim() || createMovement.isPending}>
                {createMovement.isPending ? "กำลังบันทึก..." : "บันทึกการปรับปรุง"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">ประวัติการปรับปรุง</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>เหตุผล</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant="secondary">{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{m.note ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(m.created_at), "dd/MM, HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">ยังไม่มีการปรับปรุง</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
