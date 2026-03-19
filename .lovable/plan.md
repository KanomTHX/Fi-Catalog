

## แผนเพิ่มฟีเจอร์หน้ารายละเอียดสินค้า + ระบบตรวจสอบใบจอง + ปรับปรุง

### สรุป
เพิ่มหน้ารายละเอียดสินค้าแบบ Global House, ระบบรูปหลายรูป + variant, ราคาผ่อน, วิธีรับสินค้า, สินค้าที่คล้ายกัน/ดูล่าสุด, breadcrumb, หน้าตรวจสอบสถานะใบจอง, และปรับปรุง LIFF

---

### Database Changes

**1. ตาราง `product_images` (ใหม่)** — เก็บรูปสินค้าสูงสุด 5 รูป
```sql
CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can view product images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage product images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**2. ตาราง `product_variants` (ใหม่)** — ตัวเลือก variant เช่น สี
```sql
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name text NOT NULL,  -- e.g. "สี"
  variant_value text NOT NULL, -- e.g. "ขาว", "ดำ"
  image_url text,
  price_adjustment numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view variants" ON public.product_variants FOR SELECT TO anon USING (true);
CREATE POLICY "Authenticated can view variants" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage variants" ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**3. ตาราง `installment_plans` (ใหม่)** — แผนผ่อนชำระ
```sql
CREATE TABLE public.installment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  months int NOT NULL,          -- 3, 6, 10, 12
  interest_rate numeric DEFAULT 0,  -- 0 = 0%
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.installment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view plans" ON public.installment_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can manage plans" ON public.installment_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default plans
INSERT INTO public.installment_plans (months, interest_rate) VALUES (3, 0), (6, 0), (10, 0), (12, 0);
```

**4. เพิ่มคอลัมน์ `delivery_method` ใน `orders`**
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method text DEFAULT 'pickup';
```

---

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/ProductDetail.tsx` | **สร้างใหม่** — หน้ารายละเอียดสินค้าแบบ Global House: gallery รูปหลายรูป, ราคาผ่อน, variant selector, วิธีรับสินค้า, ปุ่มใส่ตะกร้า/ซื้อเลย, สินค้าที่คล้ายกัน, สินค้าที่ดูล่าสุด, breadcrumb |
| `src/pages/OrderTracking.tsx` | **สร้างใหม่** — หน้าตรวจสอบสถานะใบจอง กรอกเลขจอง แสดงรายละเอียด+สถานะ |
| `src/App.tsx` | **แก้ไข** — เพิ่ม routes `/products/:id` และ `/order-tracking` |
| `src/components/ProductCatalog.tsx` | **แก้ไข** — Product card กดแล้ว navigate ไป `/products/:id` แทนการเปิด dialog |
| `src/components/HomeNavbar.tsx` | **แก้ไข** — เพิ่มลิงก์ "ตรวจสอบใบจอง" ใน nav |
| `src/pages/Checkout.tsx` | **แก้ไข** — เพิ่มตัวเลือกวิธีรับสินค้า (รับหน้าร้าน/จัดส่งถึงบ้าน), บันทึก delivery_method |
| `src/pages/Products.tsx` (Admin) | **แก้ไข** — เพิ่มฟอร์มอัปโหลดรูปสูงสุด 5 รูป + จัดการ variants |
| `src/pages/Showcase.tsx` | **แก้ไข** — ปรับ ProductCard ให้ใช้ product_images, เพิ่มราคาผ่อน, ปรับ UI ให้สอดคล้องกับหน้าเว็บหลัก |
| `src/contexts/CartContext.tsx` | **แก้ไข** — เพิ่ม variant info ใน CartItem |

---

### รายละเอียดหน้า ProductDetail (`/products/:id`)

อ้างอิงจากรูป Global House:

1. **Breadcrumb** — `หน้าแรก > สินค้า > หมวดหมู่ > ชื่อสินค้า`
2. **Image Gallery** — รูปใหญ่ด้านซ้าย + thumbnail strip ด้านล่าง (ดึงจาก `product_images` + `image_url` หลัก)
3. **Product Info** ด้านขวา:
   - ชื่อสินค้า, แบรนด์, SKU
   - ราคาเต็ม + ราคาผ่อน (คำนวณจาก `installment_plans`: ราคา/จำนวนเดือน)
   - Variant selector (เช่น เลือกสี) จาก `product_variants`
   - วิธีรับสินค้า: radio `รับหน้าร้าน` / `จัดส่งถึงบ้าน`
   - ปุ่ม `เพิ่มใส่ตะกร้า` + ปุ่ม `ซื้อเลย` (ซื้อเลย = add to cart + navigate to /checkout)
4. **รายละเอียดสินค้า** — description, material, dimensions, weight, color
5. **สินค้าที่คล้ายกัน** — สินค้าในหมวดเดียวกัน (ไม่รวมตัวเอง) แสดง 4-8 ชิ้น
6. **สินค้าที่ดูล่าสุด** — เก็บใน localStorage, แสดง 4-8 ชิ้น

### หน้า OrderTracking (`/order-tracking`)
- กรอกเลขใบจอง (8 ตัวแรกของ UUID)
- ค้นหา order จาก DB ด้วย `id.ilike(input%)`
- แสดง: สถานะ (progress bar), รายการสินค้า, ยอดรวม, วันที่สั่ง

### ปรับปรุง LIFF (`Showcase.tsx`)
- ใช้ `product_images` แสดง gallery ใน ProductDetailDialog
- เพิ่มราคาผ่อนใน product card/detail
- ปรับ UI ให้ใช้ brand colors เดียวกัน (gold/charcoal/cream)

