import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { useProducts, useProductStock } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";
import { format, subDays, startOfDay } from "date-fns";

export default function Dashboard() {
  const { data: products = [] } = useProducts();
  const { data: stock = [] } = useProductStock();
  const { data: movements = [] } = useStockMovements();

  const totalProducts = products.length;
  const totalStock = stock.reduce((s, p) => s + (p.current_stock ?? 0), 0);
  const lowStockCount = stock.filter(p => p.current_stock !== null && p.min_stock_level !== null && p.current_stock <= p.min_stock_level).length;

  const todayStart = startOfDay(new Date()).toISOString();
  const todayIn = movements.filter(m => m.type === "in" && m.created_at >= todayStart).reduce((s, m) => s + m.quantity, 0);
  const todayOut = movements.filter(m => m.type === "out" && m.created_at >= todayStart).reduce((s, m) => s + m.quantity, 0);

  const chartData = useMemo(() => {
    const days = 14;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayStr = format(date, "yyyy-MM-dd");
      const label = format(date, "dd/MM");
      const dayMovements = movements.filter(m => m.created_at.startsWith(dayStr));
      return {
        date: label,
        "รับเข้า": dayMovements.filter(m => m.type === "in").reduce((s, m) => s + m.quantity, 0),
        "เบิกออก": dayMovements.filter(m => m.type === "out").reduce((s, m) => s + m.quantity, 0),
      };
    });
  }, [movements]);

  const stats = [
    { label: "สินค้าทั้งหมด", value: totalProducts, icon: Package, color: "text-primary" },
    { label: "สต็อกรวม", value: totalStock.toLocaleString(), icon: TrendingUp, color: "text-success" },
    { label: "สินค้าใกล้หมด", value: lowStockCount, icon: AlertTriangle, color: "text-warning" },
    { label: "วันนี้ เข้า / ออก", value: `${todayIn} / ${todayOut}`, icon: TrendingDown, color: "text-chart-4" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ภาพรวมคลังสินค้าของคุณ</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">แนวโน้มการเคลื่อนไหวสต็อก (14 วัน)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }} />
                <Legend />
                <Bar dataKey="รับเข้า" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="เบิกออก" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">การเคลื่อนไหวล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>วันที่</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.slice(0, 8).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === "in" ? "default" : m.type === "out" ? "destructive" : "secondary"} className="text-xs">
                        {m.type === "in" ? "รับเข้า" : m.type === "out" ? "เบิกออก" : "ปรับปรุง"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{format(new Date(m.created_at), "dd/MM, HH:mm")}</TableCell>
                  </TableRow>
                ))}
                {movements.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">ยังไม่มีการเคลื่อนไหว</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">แจ้งเตือนสินค้าใกล้หมด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">คงเหลือ</TableHead>
                  <TableHead className="text-right">ขั้นต่ำ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.filter(p => p.current_stock !== null && p.min_stock_level !== null && p.current_stock <= p.min_stock_level).slice(0, 8).map((p) => (
                  <TableRow key={p.product_id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.sku ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-destructive font-semibold">{p.current_stock}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{p.min_stock_level}</TableCell>
                  </TableRow>
                ))}
                {stock.filter(p => p.current_stock !== null && p.min_stock_level !== null && p.current_stock <= p.min_stock_level).length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">สินค้าทุกรายการมีสต็อกเพียงพอ</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
