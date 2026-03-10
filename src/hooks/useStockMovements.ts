import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Enums } from "@/integrations/supabase/types";

export function useStockMovements(type?: Enums<"movement_type">) {
  return useQuery({
    queryKey: ["stock-movements", type],
    queryFn: async () => {
      let q = supabase
        .from("stock_movements")
        .select("*, products(name, sku, barcode)")
        .order("created_at", { ascending: false });
      if (type) q = q.eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

async function generateBarcode(productId: string) {
  // Check if product already has barcode
  const { data: product } = await supabase
    .from("products")
    .select("barcode")
    .eq("id", productId)
    .single();

  if (product?.barcode) return null;

  // Generate unique barcode: SF + YYYYMMDD + 3-digit random
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  const barcode = `SF${dateStr}${rand}`;

  const { error } = await supabase
    .from("products")
    .update({ barcode })
    .eq("id", productId);

  if (error) return null;
  return barcode;
}

export function useCreateMovement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      type: Enums<"movement_type">;
      quantity: number;
      note?: string;
    }) => {
      const { error } = await supabase.from("stock_movements").insert({
        ...movement,
        created_by: user!.id,
      });
      if (error) throw error;
      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user!.id,
        action: `stock_${movement.type}`,
        details: { product_id: movement.product_id, quantity: movement.quantity, note: movement.note },
      });

      // Auto-generate barcode on stock-in
      if (movement.type === "in") {
        const barcode = await generateBarcode(movement.product_id);
        return { barcode };
      }
      return { barcode: null };
    },
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["product-stock"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      const labels = { in: "รับเข้าสต็อกสำเร็จ", out: "เบิกออกสต็อกสำเร็จ", adjustment: "ปรับปรุงสต็อกสำเร็จ" };
      toast({ title: labels[vars.type] });
      if (result?.barcode) {
        toast({ title: "สร้างบาร์โค้ดอัตโนมัติ", description: `Barcode: ${result.barcode}` });
      }
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}
