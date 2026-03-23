import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Loader2, Upload, Image, Plus, Trash2, GripVertical } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface BannerRow {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function SiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Settings fields
  const [siteName, setSiteName] = useState("StockFlow");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyDescription, setCompanyDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [googleMapEmbed, setGoogleMapEmbed] = useState("");
  const [lineId, setLineId] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [featuredBannerUrl, setFeaturedBannerUrl] = useState<string | null>(null);
  const [allProductsBannerUrl, setAllProductsBannerUrl] = useState<string | null>(null);

  // Banners
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("site_settings").select("*").limit(1).single();
      if (data) {
        const d = data as any;
        setSettingsId(d.id);
        setSiteName(d.site_name || "StockFlow");
        setLogoUrl(d.logo_url || null);
        setCompanyDescription(d.company_description || "");
        setPhone(d.phone || "");
        setEmail(d.email || "");
        setAddress(d.address || "");
        setGoogleMapEmbed(d.google_map_embed || "");
        setLineId(d.line_id || "");
        setFacebookUrl(d.facebook_url || "");
        setInstagramUrl(d.instagram_url || "");
        setFeaturedBannerUrl(d.featured_banner_url || null);
        setAllProductsBannerUrl(d.all_products_banner_url || null);
      }
      setLoading(false);
    }
    async function loadBanners() {
      const { data } = await supabase.from("banners").select("*").order("sort_order") as { data: BannerRow[] | null };
      setBanners(data || []);
      setBannersLoading(false);
    }
    load();
    loadBanners();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        site_name: siteName,
        logo_url: logoUrl,
        company_description: companyDescription || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        google_map_embed: googleMapEmbed || null,
        line_id: lineId || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        featured_banner_url: featuredBannerUrl || null,
        all_products_banner_url: allProductsBannerUrl || null,
      } as any;

      if (settingsId) {
        const { error } = await supabase.from("site_settings").update(payload).eq("id", settingsId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("site_settings").insert(payload).select().single();
        if (error) throw error;
        setSettingsId(data.id);
      }
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
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

  // Banner CRUD
  async function addBanner() {
    const { data, error } = await supabase
      .from("banners")
      .insert({ title: "แบนเนอร์ใหม่", sort_order: banners.length } as any)
      .select()
      .single();
    if (error) { toast({ title: "เกิดข้อผิดพลาด", description: error.message, variant: "destructive" }); return; }
    setBanners((prev) => [...prev, data as any]);
  }

  async function updateBanner(id: string, field: string, value: any) {
    setBanners((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
    await supabase.from("banners").update({ [field]: value } as any).eq("id", id);
  }

  async function deleteBanner(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    await supabase.from("banners").delete().eq("id", id);
  }

  async function handleBannerImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `banner-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("site-assets").getPublicUrl(path);
      updateBanner(id, "image_url", publicUrl);
    } catch (e: any) {
      toast({ title: "อัปโหลดล้มเหลว", description: e.message, variant: "destructive" });
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">เปลี่ยนชื่อระบบ โลโก้ ข้อมูลร้าน และ Banner โปรโมชั่น</p>
      </div>

      {/* Site name & logo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ชื่อระบบและโลโก้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อระบบ</Label>
            <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="เช่น MyStore" maxLength={50} />
          </div>
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
          {logoUrl && <Button variant="outline" size="sm" onClick={() => setLogoUrl(null)}>ลบโลโก้</Button>}
        </CardContent>
      </Card>

      {/* Company info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลบริษัท</CardTitle>
          <CardDescription>แสดงในหน้าแรกและส่วนติดต่อ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>รายละเอียดบริษัท</Label>
            <Textarea value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={3} maxLength={1000} placeholder="เกี่ยวกับธุรกิจของคุณ..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>เบอร์โทรศัพท์</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0xx-xxx-xxxx" maxLength={20} />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" maxLength={100} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>ที่อยู่</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} maxLength={500} placeholder="ที่อยู่ร้านค้า" />
          </div>
        </CardContent>
      </Card>

      {/* Social & Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">โซเชียลมีเดีย & แผนที่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>LINE ID</Label>
              <Input value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="@yourline" maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/..." maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." maxLength={200} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Google Map Embed (HTML)</Label>
            <Textarea value={googleMapEmbed} onChange={(e) => setGoogleMapEmbed(e.target.value)} rows={3} placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>' maxLength={2000} />
          </div>
        </CardContent>
      </Card>

      {/* Banners */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">แบนเนอร์โปรโมชั่น</CardTitle>
            <CardDescription>จัดการ Banner ที่แสดงในหน้าแรก</CardDescription>
          </div>
          <Button size="sm" onClick={addBanner} className="gap-1">
            <Plus className="h-4 w-4" /> เพิ่ม
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {bannersLoading ? (
            <p className="text-muted-foreground text-sm">กำลังโหลด...</p>
          ) : banners.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">ยังไม่มีแบนเนอร์</p>
          ) : (
            banners.map((b) => (
              <div key={b.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-muted/30">
                <GripVertical className="h-5 w-5 text-muted-foreground mt-2 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Input
                    value={b.title}
                    onChange={(e) => updateBanner(b.id, "title", e.target.value)}
                    placeholder="หัวข้อ"
                    maxLength={100}
                  />
                  <Input
                    value={b.subtitle || ""}
                    onChange={(e) => updateBanner(b.id, "subtitle", e.target.value)}
                    placeholder="รายละเอียด (ไม่จำเป็น)"
                    maxLength={200}
                  />
                  <Input
                    value={b.link_url || ""}
                    onChange={(e) => updateBanner(b.id, "link_url", e.target.value)}
                    placeholder="Link URL (ไม่จำเป็น)"
                    maxLength={500}
                  />
                  <div className="flex items-center gap-3">
                    {b.image_url && <img src={b.image_url} alt="" className="h-12 w-20 rounded-lg object-cover" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleBannerImage(b.id, e)} className="flex-1" />
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={b.is_active}
                      onChange={(e) => updateBanner(b.id, "is_active", e.target.checked)}
                      className="rounded"
                    />
                    เปิดใช้งาน
                  </label>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => deleteBanner(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        บันทึกการตั้งค่า
      </Button>
    </div>
  );
}
