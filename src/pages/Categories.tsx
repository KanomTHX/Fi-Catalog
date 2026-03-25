import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, Plus, Pencil, Trash2, Upload, Image } from "lucide-react";

export default function Categories() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editId) {
        const { error } = await supabase.from("categories").update({ name, description: description || null, image_url: imageUrl }).eq("id", editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert({ name, description: description || null, image_url: imageUrl });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
      toast({ title: editId ? "อัปเดตหมวดหมู่แล้ว" : "สร้างหมวดหมู่แล้ว" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
      toast({ title: "ลบหมวดหมู่แล้ว" });
      setDeleteId(null);
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditId(null);
    setName("");
    setDescription("");
    setImageUrl(null);
  };

  const openCreate = () => {
    setEditId(null);
    setName("");
    setDescription("");
    setImageUrl(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setImageUrl(cat.image_url);
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `categories/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch (err: any) {
      toast({ title: "อัปโหลดรูปไม่สำเร็จ", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6" /> จัดการหมวดหมู่
          </h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข ลบหมวดหมู่สินค้า พร้อมรูปภาพ</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> เพิ่มหมวดหมู่</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">หมวดหมู่ทั้งหมด ({categories.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">รูป</TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead className="hidden sm:table-cell">คำอธิบาย</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat: any) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-14 h-14 rounded-lg object-contain bg-muted" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                        <Image className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{cat.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">ยังไม่มีหมวดหมู่</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>ชื่อหมวดหมู่</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น เฟอร์นิเจอร์" />
            </div>
            <div className="grid gap-2">
              <Label>คำอธิบาย (ถ้ามี)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบายหมวดหมู่" />
            </div>
            <div className="grid gap-2">
              <Label>รูปหมวดหมู่ (แนะนำ 256x256)</Label>
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-20 h-20 rounded-lg object-contain bg-muted border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <Image className="h-6 w-6 text-muted-foreground/30" />
                  </div>
                )}
                <div>
                  <Button variant="outline" size="sm" asChild disabled={uploading}>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-1" /> {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </Button>
                  {imageUrl && (
                    <Button variant="ghost" size="sm" className="text-destructive ml-2" onClick={() => setImageUrl(null)}>ลบรูป</Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>ยกเลิก</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!name.trim() || saveMutation.isPending}>
              {saveMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบหมวดหมู่นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
