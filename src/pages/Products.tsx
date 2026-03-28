import { useState, useMemo, useRef, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useProducts, useCategories, useCreateProduct, useUpdateProduct, useDeleteProduct, useProductStock } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Upload, Pencil, Trash2, Hash, Barcode, MapPin, Weight, X, ImagePlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SerialNumberDialog } from "@/components/SerialNumberDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

const emptyForm = { name: "", sku: "", category_id: "", cost_price: 0, selling_price: 0, unit: "pcs", min_stock_level: 0, image_url: "", description: "", brand: "", weight: 0, dimensions: "", location: "", color: "", material: "", discount_price: 0, is_new: false, is_featured: false };

interface VariantRow { id?: string; variant_name: string; variant_value: string; }
interface ExtraImage { id?: string; image_url: string; sort_order: number; }

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

  // Extra images & variants state
  const [extraImages, setExtraImages] = useState<ExtraImage[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantValue, setNewVariantValue] = useState("");
  const [installmentPrices, setInstallmentPrices] = useState<Record<string, number>>({});

  // Fetch installment plans
  const { data: activePlans = [] } = useQuery({
    queryKey: ["active-installment-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("installment_plans").select("id, months, interest_rate").eq("is_active", true).order("months");
      return data ?? [];
    },
    staleTime: 60_000,
  });

  // Fetch extra images, variants & installment prices when editing
  useEffect(() => {
    if (!editId) { setExtraImages([]); setVariants([]); setInstallmentPrices({}); return; }
    (async () => {
      const [imgRes, varRes, priceRes] = await Promise.all([
        supabase.from("product_images").select("*").eq("product_id", editId).order("sort_order"),
        supabase.from("product_variants").select("*").eq("product_id", editId).order("variant_name"),
        supabase.from("product_installment_prices" as any).select("plan_id, monthly_price").eq("product_id", editId),
      ]);
      setExtraImages((imgRes.data ?? []).map((i: any) => ({ id: i.id, image_url: i.image_url, sort_order: i.sort_order })));
      setVariants((varRes.data ?? []).map((v: any) => ({ id: v.id, variant_name: v.variant_name, variant_value: v.variant_value })));
      const priceMap: Record<string, number> = {};
      (priceRes.data ?? []).forEach((p: any) => { priceMap[p.plan_id] = p.monthly_price; });
      setInstallmentPrices(priceMap);
    })();
  }, [editId]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === "all" || p.category_id === catFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, catFilter]);

  const getStock = (id: string) => stock.find((s) => s.product_id === id)?.current_stock ?? 0;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setExtraImages([]); setVariants([]); setDialogOpen(true); };
  const openEdit = (p: typeof products[0]) => {
    setEditId(p.id);
    setForm({
      name: p.name, sku: p.sku ?? "", category_id: p.category_id ?? "",
      cost_price: p.cost_price ?? 0, selling_price: p.selling_price ?? 0,
      unit: p.unit ?? "pcs", min_stock_level: p.min_stock_level ?? 0, image_url: p.image_url ?? "",
      description: (p as any).description ?? "", brand: (p as any).brand ?? "",
      weight: (p as any).weight ?? 0, dimensions: (p as any).dimensions ?? "",
      location: (p as any).location ?? "",
      color: (p as any).color ?? "", material: (p as any).material ?? "",
      discount_price: (p as any).discount_price ?? 0,
      is_new: (p as any).is_new ?? false, is_featured: (p as any).is_featured ?? false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, category_id: form.category_id || undefined, cost_price: Number(form.cost_price), selling_price: Number(form.selling_price), min_stock_level: Number(form.min_stock_level), discount_price: Number(form.discount_price) || undefined, weight: Number(form.weight) || undefined };
    let productId = editId;
    if (editId) {
      await updateProduct.mutateAsync({ id: editId, ...payload });
    } else {
      const result = await createProduct.mutateAsync(payload);
      productId = (result as any)?.id;
    }

    // Save extra images, variants & installment prices
    if (editId && productId) {
      // Sync extra images
      const existingImgIds = extraImages.filter(i => i.id).map(i => i.id!);
      await supabase.from("product_images").delete().eq("product_id", productId).not("id", "in", `(${existingImgIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);
      const newImages = extraImages.filter(i => !i.id);
      if (newImages.length > 0) {
        await supabase.from("product_images").insert(newImages.map((i, idx) => ({ product_id: productId!, image_url: i.image_url, sort_order: idx })));
      }

      // Sync variants
      const existingVarIds = variants.filter(v => v.id).map(v => v.id!);
      await supabase.from("product_variants").delete().eq("product_id", productId).not("id", "in", `(${existingVarIds.join(",") || "00000000-0000-0000-0000-000000000000"})`);
      const newVariants = variants.filter(v => !v.id);
      if (newVariants.length > 0) {
        await supabase.from("product_variants").insert(newVariants.map(v => ({ product_id: productId!, variant_name: v.variant_name, variant_value: v.variant_value })));
      }

      // Sync installment prices
      await supabase.from("product_installment_prices" as any).delete().eq("product_id", productId);
      const priceRows = Object.entries(installmentPrices).filter(([_, v]) => v > 0).map(([planId, price]) => ({ product_id: productId!, plan_id: planId, monthly_price: price }));
      if (priceRows.length > 0) {
        await supabase.from("product_installment_prices" as any).insert(priceRows);
      }
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
              name: row.name, sku: row.sku || undefined,
              cost_price: Number(row.cost_price) || 0, selling_price: Number(row.selling_price) || 0,
              unit: row.unit || "pcs", min_stock_level: Number(row.min_stock_level) || 0, brand: row.brand || undefined,
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

  const handleExtraImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (extraImages.length >= 5) { toast({ title: "สูงสุด 5 รูป", variant: "destructive" }); return; }
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast({ title: "อัปโหลดล้มเหลว", description: error.message, variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
    setExtraImages(prev => [...prev, { image_url: publicUrl, sort_order: prev.length }]);
  };

  const addVariant = () => {
    if (!newVariantName.trim() || !newVariantValue.trim()) return;
    setVariants(prev => [...prev, { variant_name: newVariantName.trim(), variant_value: newVariantValue.trim() }]);
    setNewVariantValue("");
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
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="หมวดหมู่" /></SelectTrigger>
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
                <TableHead className="hidden md:table-cell">แบรนด์</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="hidden lg:table-cell"><span className="inline-flex items-center gap-1"><Barcode className="h-3.5 w-3.5" /> บาร์โค้ด</span></TableHead>
                <TableHead className="hidden lg:table-cell"><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> ตำแหน่ง</span></TableHead>
                <TableHead className="hidden xl:table-cell"><span className="inline-flex items-center gap-1"><Weight className="h-3.5 w-3.5" /> น้ำหนัก</span></TableHead>
                <TableHead className="text-right">ต้นทุน</TableHead>
                <TableHead className="text-right hidden lg:table-cell">ราคาขาย</TableHead>
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
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{(p as any).brand ?? "—"}</TableCell>
                    <TableCell>{(p as any).categories?.name ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{(p as any).barcode ?? <span className="text-muted-foreground/50 italic">รอรับเข้า</span>}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{(p as any).location ?? "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{(p as any).weight ? `${(p as any).weight} กก.` : "—"}</TableCell>
                    <TableCell className="text-right font-mono">{(p.cost_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono hidden lg:table-cell">{(p.selling_price ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={isLow ? "destructive" : "secondary"} className="font-mono">{qty}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => setSerialDialogProduct({ id: p.id, name: p.name })} title="Serial Numbers"><Hash className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-12">ไม่พบสินค้า</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ฟอร์มสินค้า */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>ชื่อสินค้า *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น น้ำมันเครื่อง 5W-30" />
            </div>
            <div className="grid gap-2">
              <Label>รายละเอียดสินค้า</Label>
              <RichTextEditor content={form.description} onChange={(html) => setForm(f => ({ ...f, description: html }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="รหัสสินค้า" />
              </div>
              <div className="grid gap-2">
                <Label>แบรนด์ / ยี่ห้อ</Label>
                <Input value={form.brand} onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="เช่น Toyota, Samsung" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>หมวดหมู่</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {(c as any).image_url && <img src={(c as any).image_url} alt="" className="h-5 w-5 rounded object-cover" />}
                        {c.name}
                      </span>
                    </SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-1.5">
                  <Input placeholder="หมวดหมู่ใหม่..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="h-8 text-xs" />
                  <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 text-xs" disabled={!newCatName.trim() || creatingCat}
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
                {/* Category Image Upload */}
                {form.category_id && (
                  <div className="mt-1">
                    <Label className="text-xs text-muted-foreground">รูปหมวดหมู่ (256x256)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {categories.find(c => c.id === form.category_id) && (categories.find(c => c.id === form.category_id) as any)?.image_url && (
                        <img src={(categories.find(c => c.id === form.category_id) as any).image_url} alt="" className="h-12 w-12 rounded-lg object-cover border border-border" />
                      )}
                      <Input type="file" accept="image/*" className="h-8 text-xs" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const ext = file.name.split('.').pop();
                        const path = `categories/${crypto.randomUUID()}.${ext}`;
                        const { error: uploadErr } = await supabase.storage.from("product-images").upload(path, file);
                        if (uploadErr) { toast({ title: "อัปโหลดล้มเหลว", description: uploadErr.message, variant: "destructive" }); return; }
                        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
                        const { error: updateErr } = await supabase.from("categories").update({ image_url: publicUrl }).eq("id", form.category_id);
                        if (updateErr) { toast({ title: "อัปเดตล้มเหลว", description: updateErr.message, variant: "destructive" }); return; }
                        await queryClient.invalidateQueries({ queryKey: ["categories"] });
                        toast({ title: "อัปโหลดรูปหมวดหมู่สำเร็จ" });
                      }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>หน่วย</Label>
                <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="เช่น ชิ้น, กล่อง, แพ็ค" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>ราคาต้นทุน</Label>
                <Input type="number" min={0} step={0.01} value={form.cost_price} onChange={(e) => setForm(f => ({ ...f, cost_price: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-2">
                <Label>สต็อกขั้นต่ำ</Label>
                <Input type="number" min={0} value={form.min_stock_level} onChange={(e) => setForm(f => ({ ...f, min_stock_level: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>น้ำหนัก (กก.)</Label>
                <Input type="number" min={0} step={0.01} value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: Number(e.target.value) }))} placeholder="0.00" />
              </div>
              <div className="grid gap-2">
                <Label>ขนาด / มิติ</Label>
                <Input value={form.dimensions} onChange={(e) => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder="เช่น 10x20x5 ซม." />
              </div>
              <div className="grid gap-2">
                <Label>ตำแหน่งจัดเก็บ</Label>
                <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="เช่น ชั้น A-01" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>สี</Label>
                <Input value={form.color} onChange={(e) => setForm(f => ({ ...f, color: e.target.value }))} placeholder="เช่น ขาว, ดำ, ลายไม้" />
              </div>
              <div className="grid gap-2">
                <Label>วัสดุ</Label>
                <Input value={form.material} onChange={(e) => setForm(f => ({ ...f, material: e.target.value }))} placeholder="เช่น ไม้สัก, MDF, เหล็ก" />
              </div>
              <div className="grid gap-2">
                <Label>ราคาลดพิเศษ</Label>
                <Input type="number" min={0} step={0.01} value={form.discount_price} onChange={(e) => setForm(f => ({ ...f, discount_price: Number(e.target.value) }))} placeholder="0.00" />
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_new} onCheckedChange={(v) => setForm(f => ({ ...f, is_new: !!v }))} />
                <span className="text-sm">สินค้าใหม่</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.is_featured} onCheckedChange={(v) => setForm(f => ({ ...f, is_featured: !!v }))} />
                <span className="text-sm">สินค้าแนะนำ</span>
              </label>
            </div>

            {/* Main Image */}
            <div className="grid gap-2">
              <Label>รูปสินค้าหลัก</Label>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {form.image_url && <img src={form.image_url} alt="" className="h-20 w-20 object-cover rounded-md border border-border" />}
            </div>

            {/* Extra Images */}
            <Separator />
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> รูปสินค้าเพิ่มเติม (สูงสุด 5 รูป)</Label>
              <div className="flex flex-wrap gap-2">
                {extraImages.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img.image_url} alt="" className="h-20 w-20 object-cover rounded-md border border-border" />
                    <button
                      onClick={() => setExtraImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              {extraImages.length < 5 && (
                <Input type="file" accept="image/*" onChange={handleExtraImageUpload} />
              )}
            </div>

            {/* Installment Prices */}
            {activePlans.length > 0 && (
              <>
                <Separator />
                <div className="grid gap-2">
                  <Label className="font-semibold">ราคาผ่อนชำระรายแผน (บาท/เดือน)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {activePlans.map((plan: any) => (
                      <div key={plan.id} className="grid gap-1">
                        <Label className="text-xs text-muted-foreground">{plan.months} เดือน</Label>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          placeholder="0"
                          value={installmentPrices[plan.id] || ""}
                          onChange={(e) => setInstallmentPrices(prev => ({ ...prev, [plan.id]: Number(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Variants */}
            <Separator />
            <div className="grid gap-2">
              <Label>ตัวเลือกสินค้า (Variants)</Label>
              {variants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {variants.map((v, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 px-3 py-1">
                      {v.variant_name}: {v.variant_value}
                      <button onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input placeholder="ชื่อ เช่น สี" value={newVariantName} onChange={(e) => setNewVariantName(e.target.value)} className="h-8 text-xs flex-1" />
                <Input placeholder="ค่า เช่น ขาว" value={newVariantValue} onChange={(e) => setNewVariantValue(e.target.value)} className="h-8 text-xs flex-1" />
                <Button type="button" size="sm" variant="outline" className="h-8 shrink-0 text-xs" onClick={addVariant} disabled={!newVariantName.trim() || !newVariantValue.trim()}>
                  <Plus className="h-3 w-3 mr-0.5" /> เพิ่ม
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editId ? "อัปเดต" : "สร้าง"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
      {serialDialogProduct && (
        <SerialNumberDialog
          open={!!serialDialogProduct}
          onOpenChange={(o) => !o && setSerialDialogProduct(null)}
          productId={serialDialogProduct.id}
          productName={serialDialogProduct.name}
        />
      )}
    </div>
  );
}
