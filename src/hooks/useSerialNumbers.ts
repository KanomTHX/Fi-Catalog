import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useSerialNumbers(productId?: string) {
  return useQuery({
    queryKey: ["serial-numbers", productId],
    queryFn: async () => {
      let query = supabase.from("serial_numbers").select("*, products(name, sku)").order("created_at", { ascending: false });
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: productId !== undefined ? !!productId : true,
  });
}

export function useAllSerialNumbers() {
  return useQuery({
    queryKey: ["serial-numbers-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("serial_numbers")
        .select("*, products(name, sku)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSerial() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (serial: { product_id: string; serial_code: string; note?: string }) => {
      const { error } = await supabase.from("serial_numbers").insert({ ...serial, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serial-numbers"] });
      toast({ title: "เพิ่ม Serial Number สำเร็จ" });
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}

export function useBatchCreateSerials() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ product_id, prefix, count, startNum }: { product_id: string; prefix: string; count: number; startNum: number }) => {
      const serials = Array.from({ length: count }, (_, i) => ({
        product_id,
        serial_code: `${prefix}${String(startNum + i).padStart(4, '0')}`,
        created_by: user!.id,
      }));
      const { error } = await supabase.from("serial_numbers").insert(serials);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["serial-numbers"] });
      toast({ title: `สร้าง ${vars.count} Serial Numbers สำเร็จ` });
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateSerialStatus() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("serial_numbers").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["serial-numbers"] });
      toast({ title: "อัปเดตสถานะสำเร็จ" });
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}
