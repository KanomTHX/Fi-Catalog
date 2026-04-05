import { useState, useRef, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useSerialNumbers } from "@/hooks/useSerialNumbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer } from "lucide-react";
import { renderCode39ToCanvas } from "@/lib/code39";

function BarcodeLabel({ serialCode, productName, sku }: { serialCode: string; productName: string; sku: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderCode39ToCanvas(canvasRef.current, serialCode, { width: 280, height: 45 });
    }
  }, [serialCode]);

  return (
    <div className="label-item border border-border rounded-md p-3 flex flex-col items-center gap-1 bg-background" style={{ width: '65mm', height: '35mm', pageBreakInside: 'avoid' }}>
      <div className="text-[10px] font-semibold truncate w-full text-center leading-tight">{productName}</div>
      {sku && <div className="text-[9px] font-mono text-muted-foreground">Product Code: {sku}</div>}
      <canvas ref={canvasRef} className="w-full" />
      <div className="text-[10px] font-mono tracking-wider font-medium">S/N: {serialCode}</div>
    </div>
  );
}

export default function SerialPrint() {
  const { data: products = [] } = useProducts();
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const { data: serials = [] } = useSerialNumbers(selectedProduct || undefined);
  const [selectedSerials, setSelectedSerials] = useState<Set<string>>(new Set());

  const inStockSerials = serials.filter((s: any) => s.status === "in_stock");
  const product = products.find((p) => p.id === selectedProduct);
  const productName = product?.name ?? "";
  const productSku = product?.sku ?? null;

  const toggleSerial = (id: string) => {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedSerials.size === inStockSerials.length) {
      setSelectedSerials(new Set());
    } else {
      setSelectedSerials(new Set(inStockSerials.map((s: any) => s.id)));
    }
  };

  const printLabels = () => window.print();

  const selectedItems = inStockSerials.filter((s: any) => selectedSerials.has(s.id));

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-area, .print-area * { visibility: visible !important; }
          .print-area { position: absolute; top: 0; left: 0; }
          .label-item { border: none !important; margin: 2mm; }
          @page { size: auto; margin: 5mm; }
        }
      `}</style>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">พิมพ์ฉลากบาร์โค้ด</h1>
          <p className="text-muted-foreground">เลือกสินค้าและ Serial Numbers เพื่อพิมพ์ฉลาก — Product Code (SKU) + Serial Number</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <Select value={selectedProduct} onValueChange={(v) => { setSelectedProduct(v); setSelectedSerials(new Set()); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสินค้า..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {inStockSerials.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    {selectedSerials.size === inStockSerials.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </Button>
                  <Button size="sm" onClick={printLabels} disabled={selectedSerials.size === 0}>
                    <Printer className="h-4 w-4 mr-1" /> พิมพ์ ({selectedSerials.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedProduct && (
              <p className="text-center text-muted-foreground py-12">กรุณาเลือกสินค้า</p>
            )}
            {selectedProduct && inStockSerials.length === 0 && (
              <p className="text-center text-muted-foreground py-12">ไม่มี Serial Number ที่คงเหลือในสต็อก</p>
            )}
            {inStockSerials.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {inStockSerials.map((s: any) => (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                      selectedSerials.has(s.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedSerials.has(s.id)}
                      onCheckedChange={() => toggleSerial(s.id)}
                    />
                    <span className="font-mono text-xs">{s.serial_code}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Print preview */}
        {selectedItems.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">ตัวอย่างฉลาก</CardTitle></CardHeader>
            <CardContent>
              <div className="print-area flex flex-wrap gap-3">
                {selectedItems.map((s: any) => (
                  <BarcodeLabel key={s.id} serialCode={s.serial_code} productName={productName} sku={productSku} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
