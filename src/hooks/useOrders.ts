import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customers(*), order_items(*, products(name, sku, image_url))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (error) throw error;

      // Auto stock-out when completed
      if (status === "completed") {
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", orderId);

        if (items) {
          for (const item of items) {
            await supabase.from("stock_movements").insert({
              product_id: item.product_id,
              type: "out" as const,
              quantity: item.quantity,
              note: `คำสั่งจอง #${orderId.slice(0, 8)}`,
              created_by: user!.id,
            });
          }
        }

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: user!.id,
          action: "order_completed",
          details: { order_id: orderId },
        });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["product-stock"] });
      const labels: Record<string, string> = {
        confirmed: "ยืนยันคำสั่งจองแล้ว",
        completed: "เบิกสินค้าออกแล้ว",
        cancelled: "ยกเลิกคำสั่งจองแล้ว",
      };
      toast({ title: labels[vars.status] || "อัปเดตสถานะแล้ว" });
    },
    onError: (e: any) => toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" }),
  });
}
