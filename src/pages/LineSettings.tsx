import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, ExternalLink, Menu } from "lucide-react";

export default function LineSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [liffId, setLiffId] = useState("");
  const [channelAccessToken, setChannelAccessToken] = useState("");
  const [richMenuId, setRichMenuId] = useState<string | null>(null);
  const [notifyLineUserIds, setNotifyLineUserIds] = useState("");

  const showcaseUrl = liffId
    ? `https://liff.line.me/${liffId}`
    : `${window.location.origin}/showcase`;

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("line_settings").select("*").limit(1).single();
      if (data) {
        setSettingsId(data.id);
        setLiffId(data.liff_id || "");
        setChannelAccessToken(data.channel_access_token || "");
        setRichMenuId(data.rich_menu_id || null);
        setNotifyLineUserIds((data as any).notify_line_user_ids || "");
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (settingsId) {
        const { error } = await supabase
          .from("line_settings")
          .update({ liff_id: liffId, channel_access_token: channelAccessToken, notify_line_user_ids: notifyLineUserIds } as any)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("line_settings")
          .insert({ liff_id: liffId, channel_access_token: channelAccessToken, notify_line_user_ids: notifyLineUserIds } as any)
          .select()
          .single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      toast({ title: "บันทึกสำเร็จ" });
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleCreateRichMenu() {
    if (!channelAccessToken) {
      toast({ title: "กรุณากรอก Channel Access Token ก่อน", variant: "destructive" });
      return;
    }
    setCreatingMenu(true);
    try {
      // Save settings first
      await handleSave();

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/line-rich-menu`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel_access_token: channelAccessToken,
            showcase_url: showcaseUrl,
            liff_id: liffId,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create Rich Menu");

      // Save rich_menu_id
      if (result.rich_menu_id && settingsId) {
        await supabase
          .from("line_settings")
          .update({ rich_menu_id: result.rich_menu_id })
          .eq("id", settingsId);
        setRichMenuId(result.rich_menu_id);
      }

      toast({ title: "สร้าง Rich Menu สำเร็จ", description: `ID: ${result.rich_menu_id}` });
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setCreatingMenu(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">LINE Settings</h1>
        <p className="text-muted-foreground">ตั้งค่า LINE LIFF และ Rich Menu สำหรับหน้า Showcase สินค้า</p>
      </div>

      {/* Showcase URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Showcase URL</CardTitle>
          <CardDescription>ใช้ URL นี้สำหรับตั้งค่าใน LINE LIFF หรือ Rich Menu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input value={showcaseUrl} readOnly className="font-mono text-sm" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => { navigator.clipboard.writeText(showcaseUrl); toast({ title: "คัดลอกแล้ว" }); }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* LIFF Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE LIFF</CardTitle>
          <CardDescription>กรอก LIFF ID จาก LINE Developers Console</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="liff-id">LIFF ID</Label>
            <Input
              id="liff-id"
              placeholder="1234567890-abcdefgh"
              value={liffId}
              onChange={(e) => setLiffId(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Channel Access Token */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">LINE Messaging API</CardTitle>
          <CardDescription>Channel Access Token สำหรับสร้าง Rich Menu อัตโนมัติ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channel-token">Channel Access Token</Label>
            <Input
              id="channel-token"
              type="password"
              placeholder="ใส่ Channel Access Token"
              value={channelAccessToken}
              onChange={(e) => setChannelAccessToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notify-ids">LINE User ID ผู้รับแจ้งเตือน (Admin)</Label>
            <Input
              id="notify-ids"
              placeholder="Uxxxx,Uyyyy (คั่นด้วย comma)"
              value={notifyLineUserIds}
              onChange={(e) => setNotifyLineUserIds(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">ใส่ LINE User ID ของแอดมินที่ต้องการรับแจ้งเตือนคำสั่งจองใหม่ (หาได้จาก LINE OA Chat)</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            บันทึกการตั้งค่า
          </Button>
        </CardContent>
      </Card>

      {/* Rich Menu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            Rich Menu
            {richMenuId && <Badge variant="default">Active</Badge>}
          </CardTitle>
          <CardDescription>
            สร้าง Rich Menu อัตโนมัติพร้อมปุ่มเปิดหน้า Showcase สินค้า
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {richMenuId && (
            <div className="text-sm text-muted-foreground">
              Rich Menu ID: <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{richMenuId}</code>
            </div>
          )}
          <Button onClick={handleCreateRichMenu} disabled={creatingMenu || !channelAccessToken}>
            {creatingMenu ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Menu className="h-4 w-4 mr-2" />}
            {richMenuId ? "สร้าง Rich Menu ใหม่" : "สร้าง Rich Menu"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
