import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  months: number;
  interest_rate: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export default function InstallmentPlans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ months: 3, interest_rate: 0 });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["installment-plans-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("installment_plans").select("*").order("months");
      if (error) throw error;
      return data as Plan[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { months: number; interest_rate: number }) => {
      const { error } = await supabase.from("installment_plans").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["installment-plans-admin"] }); toast({ title: "สร้างแผนผ่อนสำเร็จ" }); },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; months?: number; interest_rate?: number; is_active?: boolean }) => {
      const { error } = await supabase.from("installment_plans").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["installment-plans-admin"] }); toast({ title: "อัปเดตสำเร็จ" }); },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("installment_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["installment-plans-admin"] }); toast({ title: "ลบสำเร็จ" }); },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });

  const openCreate = () => { setEditId(null); setForm({ months: 3, interest_rate: 0 }); setDialogOpen(true); };
  const openEdit = (plan: Plan) => { setEditId(plan.id); setForm({ months: plan.months, interest_rate: plan.interest_rate ?? 0 }); setDialogOpen(true); };

  const handleSave = async () => {
    if (editId) {
      await updateMutation.mutateAsync({ id: editId, months: form.months, interest_rate: form.interest_rate });
    } else {
      await createMutation.mutateAsync({ months: form.months, interest_rate: form.interest_rate });
    }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CreditCard className="h-6 w-6" /> แผนผ่อนชำระ</h1>
          <p className="text-muted-foreground">ตั้งค่าจำนวนเดือนและอัตราดอกเบี้ยสำหรับการผ่อนชำระ</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> เพิ่มแผนผ่อน</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>จำนวนเดือน</TableHead>
                <TableHead>อัตราดอกเบี้ย (%)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.months} เดือน</TableCell>
                  <TableCell className="font-mono">{plan.interest_rate ?? 0}%</TableCell>
                  <TableCell>
                    <Switch
                      checked={plan.is_active ?? true}
                      onCheckedChange={(v) => updateMutation.mutate({ id: plan.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(plan.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && plans.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-12">ยังไม่มีแผนผ่อนชำระ</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "แก้ไขแผนผ่อน" : "เพิ่มแผนผ่อน"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>จำนวนเดือน *</Label>
              <Input type="number" min={1} value={form.months} onChange={(e) => setForm(f => ({ ...f, months: Number(e.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label>อัตราดอกเบี้ย (%)</Label>
              <Input type="number" min={0} step={0.01} value={form.interest_rate} onChange={(e) => setForm(f => ({ ...f, interest_rate: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave} disabled={form.months < 1}>{editId ? "อัปเดต" : "สร้าง"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบแผนผ่อน?</AlertDialogTitle>
            <AlertDialogDescription>การดำเนินการนี้จะลบแผนผ่อนชำระอย่างถาวร</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleteId!); setDeleteId(null); }}>ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
