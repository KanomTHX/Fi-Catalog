

## ออกแบบหน้าแรกใหม่ — Modern Landing Page + สั่งจองผ่านเว็บ

### สรุปสิ่งที่จะทำ

สร้างหน้าแรกใหม่ทั้งหมดโดยใช้ดีไซน์จากรูปตัวอย่าง (Modern, clean, asymmetric layout) พร้อมเพิ่มฟีเจอร์สั่งจองตรงผ่านหน้าเว็บ, banner โปรโมชั่น, ข้อมูลบริษัท, Google Map embed และอื่นๆ

### Database Changes

เพิ่มฟิลด์ใหม่ใน `site_settings` เพื่อเก็บข้อมูลร้านค้าเพิ่มเติม:

```sql
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS company_description text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS google_map_embed text,
  ADD COLUMN IF NOT EXISTS line_id text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text;
```

สร้างตาราง `banners` สำหรับ Banner โปรโมชั่น:

```sql
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage banners" ON public.banners FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### โครงสร้างหน้าแรกใหม่ (Home.tsx)

อ้างอิงจากรูปตัวอย่าง ปรับให้เข้ากับร้านค้าสินค้า:

1. **Navbar** — โลโก้ + ชื่อร้าน, เมนู (หน้าแรก, สินค้า, เกี่ยวกับเรา, ติดต่อ), ปุ่มตะกร้า + สั่งจอง
2. **Hero Section** — Layout แบบ asymmetric (ข้อความซ้าย + รูปสินค้าเด่นขวา), heading ขนาดใหญ่, ปุ่ม CTA "ดูสินค้าทั้งหมด", stats (จำนวนสินค้า, ลูกค้า)
3. **Promotion Banners** — Carousel ดึงจากตาราง `banners`
4. **สินค้าแนะนำ** — Grid สินค้า featured พร้อมปุ่ม "สั่งจอง" ในแต่ละ card (เพิ่มลงตะกร้า/สั่งจองได้เลย)
5. **สินค้าทั้งหมด** — Section แสดงสินค้าทั้งหมดแบบ grid พร้อมฟิลเตอร์หมวดหมู่, ปุ่มสั่งจองในแต่ละ card
6. **ทำไมต้องเลือกเรา** — Feature cards แบบ numbered steps (คล้ายรูปตัวอย่าง: Consultation, Design Proposal, Execution, Delivery)
7. **เกี่ยวกับเรา** — ข้อมูลบริษัท + รูป
8. **Google Map + ติดต่อเรา** — Map embed + ที่อยู่ + เบอร์โทร + LINE + Social links
9. **Footer** — ลิงก์ Quick Links, ข้อมูลติดต่อ, ลิงก์ Admin

### ระบบสั่งจองผ่านหน้าเว็บ

- เพิ่ม **ตะกร้าสินค้า** (Cart) เป็น state ใน Home.tsx หรือ component แยก
- ลูกค้ากดปุ่ม "สั่งจอง" ที่ Product card → เพิ่มลงตะกร้า
- เปิด **Cart Sheet** (slide-in จากขวา) แสดงรายการ + จำนวน
- กรอก **ชื่อ, เบอร์โทร, ที่อยู่, หมายเหตุ** แล้วกดยืนยัน
- สร้าง record ใน `customers` (ถ้ายังไม่มี) + `orders` + `order_items`
- ใช้ client-side UUID เหมือนระบบ LIFF เดิมเพื่อ bypass RLS

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/Home.tsx` | **เขียนใหม่ทั้งหมด** — Modern landing page ตามดีไซน์ |
| `src/components/HomeNavbar.tsx` | **สร้างใหม่** — Navbar สำหรับหน้าแรก (แยกจาก Admin sidebar) |
| `src/components/ProductCatalog.tsx` | **สร้างใหม่** — Product grid + filter + สั่งจอง |
| `src/components/WebOrderCart.tsx` | **สร้างใหม่** — ตะกร้า + ฟอร์มสั่งจองผ่านเว็บ |
| `src/components/PromoBanners.tsx` | **สร้างใหม่** — Banner carousel ดึงจาก DB |
| `src/pages/SiteSettings.tsx` | **แก้ไข** — เพิ่มฟอร์มแก้ไขข้อมูลบริษัท, ที่อยู่, แผนที่, Social |
| `src/hooks/useSiteSettings.ts` | **แก้ไข** — เพิ่ม fields ใหม่ในการ select |
| DB Migration | เพิ่มคอลัมน์ใน `site_settings` + สร้างตาราง `banners` |

### Animation & Effects

- Framer Motion: fade-up on scroll, stagger children, hover scale on cards
- Smooth scroll navigation ไปยัง sections ต่างๆ
- Parallax-like effect ที่ Hero
- Counter animation สำหรับ stats
- Hover effects บน product cards (scale image, show overlay)

### การจัดการ Banner (Admin)

เพิ่มหน้า `/admin/settings/banners` หรือเพิ่ม section ใน SiteSettings ให้จัดการ banner (CRUD): อัปโหลดรูป, ตั้งหัวข้อ, เรียงลำดับ, เปิด/ปิด

