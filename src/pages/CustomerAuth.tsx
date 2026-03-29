import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HomeNavbar } from "@/components/HomeNavbar";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export default function CustomerAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const { cartCount } = useCart();

  const siteName = settings?.site_name || "AKK Furniture";
  const logoUrl = settings?.logo_url || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/my-orders");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: "สมัครสำเร็จ!", description: "กรุณาตรวจสอบอีเมลเพื่อยืนยันการสมัคร" });
      }
    } catch (e: any) {
      toast({ title: "เกิดข้อผิดพลาด", description: e.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "เข้าสู่ระบบล้มเหลว", description: String(error), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HomeNavbar siteName={siteName} logoUrl={logoUrl} cartCount={cartCount} />

      <div className="pt-28 sm:pt-32 pb-16 mx-auto max-w-md px-4">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">
              {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "เข้าสู่ระบบเพื่อติดตามสถานะใบจอง" : "สมัครเพื่อติดตามสถานะใบจองได้ง่ายขึ้น"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google Login */}
            <Button variant="outline" className="w-full gap-2" onClick={handleGoogleLogin} type="button">
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              เข้าสู่ระบบด้วย Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">หรือ</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label className="text-xs">ชื่อ-นามสกุล</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="กรอกชื่อ-นามสกุล" required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">อีเมล</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">รหัสผ่าน</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <Button className="w-full gap-2" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <Mail className="h-4 w-4" />
                {isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {isLogin ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-medium hover:underline">
                {isLogin ? "สมัครสมาชิก" : "เข้าสู่ระบบ"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
