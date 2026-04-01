import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const statusLabels: Record<string, string> = {
  pending: "รอดำเนินการ",
  credit_check: "รอฝ่ายสินเชื่อติดต่อ",
  credit_approved: "อนุมัติสินเชื่อแล้ว",
  shipping: "รอจัดส่ง",
  completed: "จัดส่งสำเร็จแล้ว",
  credit_rejected: "ไม่อนุมัติสินเชื่อ",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, new_status, reason } = await req.json();

    if (!order_id || !new_status) {
      return new Response(JSON.stringify({ error: "order_id and new_status are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get LINE settings
    const { data: settings } = await supabase
      .from("line_settings")
      .select("channel_access_token")
      .limit(1)
      .single();

    if (!settings?.channel_access_token) {
      return new Response(
        JSON.stringify({ success: false, message: "No LINE channel access token configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get order + customer
    const { data: order } = await supabase
      .from("orders")
      .select("id, customer_id, monthly_amount, installment_months")
      .eq("id", order_id)
      .single();

    if (!order) {
      return new Response(
        JSON.stringify({ success: false, message: "Order not found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get customer's LINE user ID
    const { data: customer } = await supabase
      .from("customers")
      .select("line_user_id, display_name")
      .eq("id", order.customer_id)
      .single();

    if (!customer?.line_user_id) {
      return new Response(
        JSON.stringify({ success: false, message: "Customer has no LINE user ID" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderCode = order_id.slice(0, 8).toUpperCase();
    const statusLabel = statusLabels[new_status] || new_status;

    let message = `📋 อัปเดตสถานะคำสั่งจอง
🔖 เลขใบจอง: ${orderCode}
📌 สถานะใหม่: ${statusLabel}`;

    if (reason) {
      message += `\n💬 หมายเหตุ: ${reason}`;
    }

    if (new_status === "completed") {
      message += `\n\n✅ คำสั่งจองของคุณจัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ!`;
    } else if (new_status === "credit_rejected") {
      message += `\n\n❌ ขออภัย สินเชื่อไม่ได้รับการอนุมัติ`;
    } else if (new_status === "credit_approved") {
      message += `\n\n🎉 สินเชื่อได้รับการอนุมัติแล้ว!`;
    } else if (new_status === "shipping") {
      message += `\n\n📦 กำลังจัดส่งสินค้า`;
    }

    // Send push message to customer
    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.channel_access_token}`,
      },
      body: JSON.stringify({
        to: customer.line_user_id,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!lineRes.ok) {
      const err = await lineRes.text();
      console.error(`LINE push error for customer ${customer.line_user_id}:`, err);
      return new Response(
        JSON.stringify({ success: false, error: lineRes.status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
