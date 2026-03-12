import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Upload, Image } from "lucide-react";

export default function SiteSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [siteName, setSiteName] = useState("StockFlow");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_settings").select("*").limit(1).single();
      if (data) {
        setSettingsId(data.id);
        setSiteName(data.site_name || "StockFlow");
        setLogoUrl(data.logo_url || null);
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
          .from("site_settings")
          .update({ site_name: siteName, logo_url: logoUrl } as any)
          .eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert({ site_name: siteName, logo_url: logoUrl } as any)
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

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("site-assets").getPublicUrl(path);
      setLogoUrl(publicUrl);
    } catch (e: any) {
      toast({ title: "อัปโหลดล้มเหลว", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">เปลี่ยนชื่อระบบและโลโก้ที่แสดงในหน้าร้านและเมนู</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">ชื่อระบบ</CardTitle>
          <CardDescription>ชื่อที่แสดงใน Sidebar, หน้า Showcase และอื่นๆ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อระบบ</Label>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="เช่น MyStore" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">โลโก้</CardTitle>
          <CardDescription>โลโก้ที่แสดงใน Sidebar และหน้า Showcase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover border border-border" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center border border-border">
                <Image className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <div className="space-y-2">
              <Label>อัปโหลดโลโก้</Label>
              <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            </div>
          </div>
          {logoUrl && (
            <Button variant="outline" size="sm" onClick={() => setLogoUrl(null)}>ลบโลโก้</Button>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ตัวอย่าง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {siteName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-lg font-bold">{siteName}</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        บันทึกการตั้งค่า
      </Button>
    </div>
  );
}
