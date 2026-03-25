import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSerialNumbers, useCreateSerial, useBatchCreateSerials, useUpdateSerialStatus } from "@/hooks/useSerialNumbers";
import { Plus, Hash, AlertTriangle } from "lucide-react";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  in_stock: { label: "คงเหลือ", variant: "default" },
  sold: { label: "ขายแล้ว", variant: "secondary" },
  damaged: { label: "ชำรุด", variant: "destructive" },
};

export function SerialNumberDialog({
  open, onOpenChange, productId, productName,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; productId: string; productName: string;
}) {
  const { data: serials = [], isLoading } = useSerialNumbers(productId);
  const createSerial = useCreateSerial();
  const batchCreate = useBatchCreateSerials();
  const updateStatus = useUpdateSerialStatus();

  const [singleCode, setSingleCode] = useState("");
  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState(10);

  // Fetch stock for this product
  const { data: stockData } = useQuery({
    queryKey: ["product-stock-single", productId],
    queryFn: async () => {
      const { data } = await supabase.from("product_stock").select("current_stock").eq("product_id", productId).maybeSingle();
      return data;
    },
    enabled: !!productId,
  });

  const currentStock = (stockData as any)?.current_stock ?? 0;
  const inStockSerials = serials.filter((s: any) => s.status === "in_stock").length;
  const canCreate = currentStock - inStockSerials;

  const handleSingle = async () => {
    if (!singleCode.trim()) return;
    await createSerial.mutateAsync({ product_id: productId, serial_code: singleCode.trim().toUpperCase() });
    setSingleCode("");
  };

  const handleBatch = async () => {
    if (!prefix.trim() || count < 1) return;
    await batchCreate.mutateAsync({ product_id: productId, prefix: prefix.trim().toUpperCase(), count });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Serial Numbers — {productName}</DialogTitle>
        </DialogHeader>

        {/* Stock info */}
        <div className="flex items-center gap-4 text-sm bg-muted rounded-lg px-4 py-2">
          <span>สต็อก: <strong>{currentStock}</strong></span>
          <span>Serial คงเหลือ: <strong>{inStockSerials}</strong></span>
          <span>สร้างได้อีก: <strong className={canCreate <= 0 ? "text-destructive" : "text-primary"}>{Math.max(0, canCreate)}</strong></span>
        </div>

        <Tabs defaultValue="list" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">รายการ ({serials.length})</TabsTrigger>
            <TabsTrigger value="single">เพิ่มทีละรายการ</TabsTrigger>
            <TabsTrigger value="batch">สร้างชุด (สุ่ม)</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Code</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เปลี่ยนสถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serials.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-sm">{s.serial_code}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_MAP[s.status]?.variant ?? "secondary"}>
                        {STATUS_MAP[s.status]?.label ?? s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={s.status} onValueChange={(v) => updateStatus.mutate({ id: s.id, status: v })}>
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="in_stock">คงเหลือ</SelectItem>
                          <SelectItem value="sold">ขายแล้ว</SelectItem>
                          <SelectItem value="damaged">ชำรุด</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && serials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">ยังไม่มี Serial Number</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="single" className="mt-4 space-y-4">
            {canCreate <= 0 && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4" /> ไม่สามารถสร้าง Serial เพิ่มได้ เกินจำนวนสต็อก
              </div>
            )}
            <div className="grid gap-2">
              <Label>Serial Code</Label>
              <div className="flex gap-2">
                <Input
                  value={singleCode}
                  onChange={(e) => setSingleCode(e.target.value)}
                  placeholder="เช่น SN-0001"
                  className="font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleSingle()}
                />
                <Button onClick={handleSingle} disabled={!singleCode.trim() || createSerial.isPending || canCreate <= 0}>
                  <Plus className="h-4 w-4 mr-1" /> เพิ่ม
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-4 space-y-4">
            {canCreate <= 0 && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
                <AlertTriangle className="h-4 w-4" /> ไม่สามารถสร้าง Serial เพิ่มได้ เกินจำนวนสต็อก
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Prefix</Label>
                <Input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="SN-" className="font-mono" />
              </div>
              <div className="grid gap-2">
                <Label>จำนวน (สูงสุด {Math.min(500, Math.max(0, canCreate))})</Label>
                <Input type="number" min={1} max={Math.min(500, Math.max(0, canCreate))} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              จะสร้าง Serial Code แบบสุ่ม เช่น {prefix.toUpperCase()}A1B2C3D4
            </div>
            <Button onClick={handleBatch} disabled={!prefix.trim() || batchCreate.isPending || count > canCreate || canCreate <= 0}>
              <Hash className="h-4 w-4 mr-1" /> สร้าง {count} รายการ
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
