import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, customer_name, total_amount, item_count, delivery_method } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get channel_access_token from line_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    const orderCode = order_id.slice(0, 8).toUpperCase();
    const deliveryLabel = delivery_method === "delivery" ? "จัดส่งถึงบ้าน" : "รับหน้าร้าน";
    const formattedTotal = `฿${Number(total_amount || 0).toLocaleString()}`;

    const message = `🛒 คำสั่งจองใหม่!
📋 เลขใบจอง: ${orderCode}
👤 ลูกค้า: ${customer_name || "ไม่ระบุชื่อ"}
💰 ยอดรวม: ${formattedTotal}
📦 จำนวน: ${item_count || 0} รายการ
🚚 วิธีรับสินค้า: ${deliveryLabel}`;

    // Send broadcast via LINE Messaging API
    const lineRes = await fetch("https://api.line.me/v2/bot/message/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.channel_access_token}`,
      },
      body: JSON.stringify({
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!lineRes.ok) {
      const err = await lineRes.text();
      console.error("LINE API error:", err);
      return new Response(
        JSON.stringify({ success: false, error: `LINE API error: ${lineRes.status}` }),
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
