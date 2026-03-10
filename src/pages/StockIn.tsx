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
import { ArrowDownToLine } from "lucide-react";

export default function StockIn() {
  const { data: products = [] } = useProducts();
  const { data: movements = [] } = useStockMovements("in");
  const createMovement = useCreateMovement();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;
    await createMovement.mutateAsync({ product_id: productId, type: "in", quantity: Number(quantity), note: note || undefined });
    setProductId(""); setQuantity(""); setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">รับสินค้าเข้า</h1>
        <p className="text-muted-foreground">รับสินค้าเข้าคลังสินค้าของคุณ</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-success" /> รับเข้าสต็อก
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>สินค้า *</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>จำนวน *</Label>
                <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="กรอกจำนวน" />
              </div>
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุ (ไม่บังคับ)..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={!productId || !quantity || createMovement.isPending}>
                {createMovement.isPending ? "กำลังบันทึก..." : "รับเข้าสต็อก"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">ประวัติการรับเข้า</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant="default" className="bg-success text-success-foreground">+{m.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{m.note ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(m.created_at), "dd/MM, HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">ยังไม่มีประวัติการรับเข้า</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
