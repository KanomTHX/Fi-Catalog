import { useState, useRef, useEffect, useCallback } from "react";
import { useAllSerialNumbers } from "@/hooks/useSerialNumbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, ScanBarcode, RotateCcw, FileCheck } from "lucide-react";

interface ScannedItem {
  code: string;
  found: boolean;
  productName?: string;
  timestamp: Date;
}

// Simple beep via Web Audio API
function playBeep(success: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = success ? 800 : 300;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + (success ? 0.1 : 0.3));
  } catch {}
}

export default function StockCheck() {
  const { data: allSerials = [] } = useAllSerialNumbers();
  const [scanned, setScanned] = useState<ScannedItem[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [showReport, setShowReport] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, [scanned]);

  const serialMap = new Map(
    allSerials
      .filter((s: any) => s.status === "in_stock")
      .map((s: any) => [s.serial_code, s])
  );

  const handleScan = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const alreadyScanned = scanned.some((s) => s.code === trimmed);
    if (alreadyScanned) {
      playBeep(false);
      setInputVal("");
      return;
    }

    const serial = serialMap.get(trimmed) as any;
    const item: ScannedItem = {
      code: trimmed,
      found: !!serial,
      productName: serial?.products?.name,
      timestamp: new Date(),
    };
    playBeep(!!serial);
    setScanned((prev) => [item, ...prev]);
    setInputVal("");
  }, [scanned, serialMap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScan(inputVal);
  };

  const reset = () => {
    setScanned([]);
    setShowReport(false);
    inputRef.current?.focus();
  };

  const foundCount = scanned.filter((s) => s.found).length;
  const notFoundCount = scanned.filter((s) => !s.found).length;
  const scannedCodes = new Set(scanned.map((s) => s.code));
  const notScanned = allSerials.filter(
    (s: any) => s.status === "in_stock" && !scannedCodes.has(s.serial_code)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">เช็คสต็อก (Batch Scanner)</h1>
          <p className="text-muted-foreground">สแกนบาร์โค้ด Serial Number เพื่อเช็คสต็อกสินค้า</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="h-4 w-4 mr-1" /> เริ่มใหม่
          </Button>
          <Button size="sm" onClick={() => setShowReport(true)} disabled={scanned.length === 0}>
            <FileCheck className="h-4 w-4 mr-1" /> สรุปผล
          </Button>
        </div>
      </div>

      {/* Scanner input */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex gap-3 items-center">
            <ScanBarcode className="h-6 w-6 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="สแกนหรือพิมพ์ Serial Code แล้วกด Enter..."
              className="font-mono text-lg h-12"
              autoFocus
            />
          </form>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold">{scanned.length}</div>
            <div className="text-sm text-muted-foreground">สแกนแล้ว</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{foundCount}</div>
            <div className="text-sm text-muted-foreground">พบในระบบ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-destructive">{notFoundCount}</div>
            <div className="text-sm text-muted-foreground">ไม่พบในระบบ</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{notScanned.length}</div>
            <div className="text-sm text-muted-foreground">ยังไม่ได้สแกน</div>
          </CardContent>
        </Card>
      </div>

      {/* Scanned list */}
      {scanned.length > 0 && !showReport && (
        <Card>
          <CardHeader><CardTitle className="text-sm">รายการสแกนล่าสุด</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>Serial Code</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>เวลา</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scanned.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {s.found ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.code}</TableCell>
                    <TableCell>{s.productName ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.timestamp.toLocaleTimeString("th-TH")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Report */}
      {showReport && (
        <Card>
          <CardHeader><CardTitle>รายงานผลเช็คสต็อก</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" /> สแกนแล้วแต่ไม่พบในระบบ ({notFoundCount})
              </h3>
              {scanned.filter((s) => !s.found).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {scanned.filter((s) => !s.found).map((s, i) => (
                    <Badge key={i} variant="destructive" className="font-mono">{s.code}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มี</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-600">
                ⚠️ อยู่ในระบบแต่ยังไม่ได้สแกน ({notScanned.length}) — อาจสูญหาย
              </h3>
              {notScanned.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Code</TableHead>
                      <TableHead>สินค้า</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notScanned.map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-sm">{s.serial_code}</TableCell>
                        <TableCell>{s.products?.name ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มี — สต็อกครบถ้วน ✅</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
