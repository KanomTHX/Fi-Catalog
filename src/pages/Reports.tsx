import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts, useProductStock, useCategories } from "@/hooks/useProducts";
import { useStockMovements } from "@/hooks/useStockMovements";
import { Download } from "lucide-react";
import { format } from "date-fns";

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(","), ...rows.map((r) => r.map(v => `"${v}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { data: products = [] } = useProducts();
  const { data: stock = [] } = useProductStock();
  const { data: movements = [] } = useStockMovements();
  const { data: categories = [] } = useCategories();

  const [movementType, setMovementType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const lowStock = stock.filter(p => p.current_stock !== null && p.min_stock_level !== null && p.current_stock <= p.min_stock_level);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (movementType !== "all" && m.type !== movementType) return false;
      if (dateFrom && m.created_at < dateFrom) return false;
      if (dateTo && m.created_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [movements, movementType, dateFrom, dateTo]);

  const exportInventory = () => {
    const headers = ["Product", "SKU", "Current Stock", "Min Stock"];
    const rows = stock.map((s) => [s.name ?? "", s.sku ?? "", String(s.current_stock ?? 0), String(s.min_stock_level ?? 0)]);
    downloadCSV("inventory-report.csv", headers, rows);
  };

  const exportLowStock = () => {
    const headers = ["Product", "SKU", "Current Stock", "Min Stock"];
    const rows = lowStock.map((s) => [s.name ?? "", s.sku ?? "", String(s.current_stock ?? 0), String(s.min_stock_level ?? 0)]);
    downloadCSV("low-stock-report.csv", headers, rows);
  };

  const exportMovements = () => {
    const headers = ["Product", "Type", "Quantity", "Note", "Date"];
    const rows = filteredMovements.map((m) => [m.products?.name ?? "", m.type, String(m.quantity), m.note ?? "", format(new Date(m.created_at), "yyyy-MM-dd HH:mm")]);
    downloadCSV("stock-movements-report.csv", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View and export inventory reports</p>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Inventory Report</CardTitle>
              <Button variant="outline" size="sm" onClick={exportInventory}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Min Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((s) => {
                    const isLow = (s.current_stock ?? 0) <= (s.min_stock_level ?? 0);
                    return (
                      <TableRow key={s.product_id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="font-mono text-sm">{s.sku ?? "—"}</TableCell>
                        <TableCell className="text-right font-mono">{s.current_stock}</TableCell>
                        <TableCell className="text-right font-mono">{s.min_stock_level}</TableCell>
                        <TableCell>
                          <Badge variant={isLow ? "destructive" : "secondary"}>{isLow ? "Low" : "OK"}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Low Stock Report</CardTitle>
              <Button variant="outline" size="sm" onClick={exportLowStock}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Min Level</TableHead>
                    <TableHead className="text-right">Deficit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((s) => (
                    <TableRow key={s.product_id}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-sm">{s.sku ?? "—"}</TableCell>
                      <TableCell className="text-right font-mono text-destructive">{s.current_stock}</TableCell>
                      <TableCell className="text-right font-mono">{s.min_stock_level}</TableCell>
                      <TableCell className="text-right font-mono text-destructive font-semibold">{(s.min_stock_level ?? 0) - (s.current_stock ?? 0)}</TableCell>
                    </TableRow>
                  ))}
                  {lowStock.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">All products are sufficiently stocked</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Stock Movement Report</CardTitle>
                <Button variant="outline" size="sm" onClick={exportMovements}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.slice(0, 50).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.products?.name ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={m.type === "in" ? "default" : m.type === "out" ? "destructive" : "secondary"} className="capitalize">{m.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{m.quantity}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-48 truncate">{m.note ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{format(new Date(m.created_at), "MMM dd, HH:mm")}</TableCell>
                    </TableRow>
                  ))}
                  {filteredMovements.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No movements found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
