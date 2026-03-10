import { useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useProductStock } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, Pencil, Trash2, Hash } from "lucide-react";
import { SerialNumberDialog } from "@/components/SerialNumberDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

const emptyForm = { name: "", sku: "", barcode: "", category_id: "", cost_price: 0, selling_price: 0, unit: "pcs", min_stock_level: 0, image_url: "" };

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { data: stock = [] } = useProductStock();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);
  const [serialDialogProduct, setSerialDialogProduct] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category_id === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const getStock = (id: string) => stock.find((s) => s.product_id === id)?.current_stock ?? 0;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: typeof products[0]) => {
    setEditId(p.id);
    setForm({ name: p.name, sku: p.sku ?? "", barcode: p.barcode ?? "", category_id: p.category_id ?? "", cost_price: p.cost_price ?? 0, selling_price: p.selling_price ?? 0, unit: p.unit ?? "pcs", min_stock_level: p.min_stock_level ?? 0, image_url: p.image_url ?? "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, category_id: form.category_id || undefined, cost_price: Number(form.cost_price), selling_price: Number(form.selling_price), min_stock_level: Number(form.min_stock_level) };
    if (editId) {
      await updateProduct.mutateAsync({ id: editId, ...payload });
    } else {
      await createProduct.mutateAsync(payload);
    }
    setDialogOpen(false);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let count = 0;
        for (const row of results.data as any[]) {
          if (!row.name) continue;
          try {
            await createProduct.mutateAsync({
              name: row.name,
              sku: row.sku || undefined,
              barcode: row.barcode || undefined,
              cost_price: Number(row.cost_price) || 0,
              selling_price: Number(row.selling_price) || 0,
              unit: row.unit || "pcs",
              min_stock_level: Number(row.min_stock_level) || 0,
            });
            count++;
          } catch { /* skip duplicates */ }
        }
        toast({ title: `นำเข้าสำเร็จ ${count} รายการ` });
        if (fileRef.current) fileRef.current.value = "";
      },
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast({ title: "อัปโหลดล้มเหลว", description: error.message, variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: publicUrl }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">สินค้า</h1>
          <p className="text-muted-foreground">จัดการรายการสินค้าของคุณ</p>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> นำเข้า CSV
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> เพิ่มสินค้า
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาสินค้า..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="หมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>สินค้า</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">ต้นทุน</TableHead>
                <TableHead className="text-right">ราคาขาย</TableHead>
                <TableHead className="text-right">สต็อก</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const qty = getStock(p.id);
                const isLow = qty <= (p.min_stock_level ?? 0);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.sku ?? "—"}</TableCell>
                    <TableCell>{(p as any).categories?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono">{(p.cost_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">{(p.selling_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isLow ? "destructive" : "secondary"} className="font-mono">{qty}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">ไม่พบสินค้า</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ฟอร์มสินค้า */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>ชื่อสินค้า *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>บาร์โค้ด</Label>
                <Input value={form.barcode} onChange={(e) => setForm(f => ({ ...f, barcode: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>หมวดหมู่</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5">
                  <Input
                    placeholder="หมวดหมู่ใหม่..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0 text-xs"
                    disabled={!newCatName.trim() || creatingCat}
                    onClick={async () => {
                      setCreatingCat(true);
                      const { data, error } = await supabase.from("categories").insert({ name: newCatName.trim() }).select("id").single();
                      if (error) {
                        toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" });
                      } else {
                        await queryClient.invalidateQueries({ queryKey: ["categories"] });
                        setForm(f => ({ ...f, category_id: data.id }));
                        setNewCatName("");
                        toast({ title: "สร้างหมวดหมู่สำเร็จ" });
                      }
                      setCreatingCat(false);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-0.5" /> เพิ่ม
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>หน่วย</Label>
                <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>ราคาต้นทุน</Label>
                <Input type="number" min={0} step={0.01} value={form.cost_price} onChange={(e) => setForm(f => ({ ...f, cost_price: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label>ราคาขาย</Label>
                <Input type="number" min={0} step={0.01} value={form.selling_price} onChange={(e) => setForm(f => ({ ...f, selling_price: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>สต็อกขั้นต่ำ</Label>
              <Input type="number" min={0} value={form.min_stock_level} onChange={(e) => setForm(f => ({ ...f, min_stock_level: Number(e.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label>รูปสินค้า</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 object-cover rounded-md border border-border" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editId ? "อัปเดต" : "สร้าง"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ยืนยันการลบ */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบสินค้า?</AlertDialogTitle>
            <AlertDialogDescription>การดำเนินการนี้จะลบสินค้าและประวัติสต็อกทั้งหมดอย่างถาวร</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteProduct.mutate(deleteId!); setDeleteId(null); }}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
