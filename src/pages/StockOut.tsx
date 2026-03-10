import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useProducts, useProductStock } from "@/hooks/useProducts";
import { useStockMovements, useCreateMovement } from "@/hooks/useStockMovements";
import { format } from "date-fns";
import { ArrowUpFromLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function StockOut() {
  const { data: products = [] } = useProducts();
  const { data: stock = [] } = useProductStock();
  const { data: movements = [] } = useStockMovements("out");
  const createMovement = useCreateMovement();
  const { toast } = useToast();
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  const currentStock = stock.find((s) => s.product_id === productId)?.current_stock ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;
    const qty = Number(quantity);
    if (qty > currentStock) {
      toast({ title: "Insufficient stock", description: `Only ${currentStock} available.`, variant: "destructive" });
      return;
    }
    await createMovement.mutateAsync({ product_id: productId, type: "out", quantity: qty, note: note || undefined });
    setProductId(""); setQuantity(""); setNote("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Withdrawal</h1>
        <p className="text-muted-foreground">Withdraw products for selling or distribution</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpFromLine className="h-5 w-5 text-destructive" /> Withdraw Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
                {productId && <p className="text-sm text-muted-foreground">Available: <span className="font-mono font-semibold">{currentStock}</span></p>}
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min={1} max={currentStock} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" />
              </div>
              <div className="space-y-2">
                <Label>Note (Customer / Order Ref)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note..." rows={3} />
              </div>
              <Button type="submit" variant="destructive" className="w-full" disabled={!productId || !quantity || createMovement.isPending}>
                {createMovement.isPending ? "Saving..." : "Withdraw Stock"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 20).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      <Badge variant="destructive">-{m.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{m.note ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(m.created_at), "MMM dd, HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No withdrawal history</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
