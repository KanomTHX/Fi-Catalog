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
    const { order_id, customer_name, total_amount, item_count, delivery_method, monthly_amount, installment_months, product_names } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get channel_access_token and notify_line_user_ids from line_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: settings } = await supabase
      .from("line_settings")
      .select("channel_access_token, notify_line_user_ids")
      .limit(1)
      .single();

    if (!settings?.channel_access_token) {
      return new Response(
        JSON.stringify({ success: false, message: "No LINE channel access token configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse admin LINE user IDs (comma-separated)
    const notifyIds = (settings.notify_line_user_ids || "")
      .split(",")
      .map((id: string) => id.trim())
      .filter((id: string) => id.length > 0);

    if (notifyIds.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No admin LINE user IDs configured for notifications" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderCode = order_id.slice(0, 8).toUpperCase();
    const deliveryLabel = delivery_method === "delivery" ? "จัดส่งถึงบ้าน" : "รับหน้าร้าน";

    // Build product list
    const productList = Array.isArray(product_names) && product_names.length > 0
      ? product_names.map((n: string, i: number) => `  ${i + 1}. ${n}`).join("\n")
      : "  ไม่ระบุ";

    // Monthly amount & installment info
    const monthlyLine = monthly_amount
      ? `💳 ยอดผ่อน/เดือน: ฿${Number(monthly_amount).toLocaleString()}`
      : `💰 ยอดรวม: ฿${Number(total_amount || 0).toLocaleString()}`;
    const installmentLine = installment_months
      ? `📅 จำนวนงวด: ${installment_months} เดือน`
      : "";

    const message = `🛒 คำสั่งจองใหม่!
📋 เลขใบจอง: ${orderCode}
👤 ลูกค้า: ${customer_name || "ไม่ระบุชื่อ"}
📦 สินค้า (${item_count || 0} รายการ):
${productList}
${monthlyLine}${installmentLine ? "\n" + installmentLine : ""}
🚚 วิธีรับสินค้า: ${deliveryLabel}
⏳ รอฝ่ายสินเชื่อติดต่อกลับ`;

    // Send push message to each admin user ID (not broadcast)
    const results = [];
    for (const userId of notifyIds) {
      const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.channel_access_token}`,
        },
        body: JSON.stringify({
          to: userId,
          messages: [{ type: "text", text: message }],
        }),
      });

      if (!lineRes.ok) {
        const err = await lineRes.text();
        console.error(`LINE push error for ${userId}:`, err);
        results.push({ userId, success: false, error: lineRes.status });
      } else {
        results.push({ userId, success: true });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
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
