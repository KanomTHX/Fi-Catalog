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
    mutationFn: async ({ product_id, prefix, count }: { product_id: string; prefix: string; count: number; startNum?: number }) => {
      // Check stock limit
      const { data: stockData } = await supabase
        .from("product_stock")
        .select("current_stock")
        .eq("product_id", product_id)
        .maybeSingle();
      const currentStock = (stockData as any)?.current_stock ?? 0;

      const { data: existingSerials } = await supabase
        .from("serial_numbers")
        .select("serial_code")
        .eq("product_id", product_id)
        .eq("status", "in_stock");
      const existingCount = existingSerials?.length ?? 0;

      if (existingCount + count > currentStock) {
        throw new Error(`ไม่สามารถสร้างได้ เกินจำนวนสต็อก (สต็อก: ${currentStock}, Serial คงเหลือ: ${existingCount}, ขอสร้าง: ${count})`);
      }

      // Generate random unique serial codes
      const existingCodes = new Set(existingSerials?.map((s: any) => s.serial_code) ?? []);
      const serials: { product_id: string; serial_code: string; created_by: string }[] = [];
      let attempts = 0;
      while (serials.length < count && attempts < count * 10) {
        const code = `${prefix}${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        if (!existingCodes.has(code)) {
          existingCodes.add(code);
          serials.push({ product_id, serial_code: code, created_by: user!.id });
        }
        attempts++;
      }

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
