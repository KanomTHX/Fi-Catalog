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
        .select("*, products(name, sku)")
        .order("created_at", { ascending: false });
      if (type) q = q.eq("type", type);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
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
    },
    onSuccess: (_result, vars) => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["product-stock"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      const labels = { in: "รับเข้าสต็อกสำเร็จ", out: "เบิกออกสต็อกสำเร็จ", adjustment: "ปรับปรุงสต็อกสำเร็จ" };
      toast({ title: labels[vars.type] });
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}
