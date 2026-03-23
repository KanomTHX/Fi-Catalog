

## แผนปรับปรุง — Cart ราคาผ่อน, Banner รูปภาพ, LIFF Dialog, หมวดหมู่รูปภาพ, Admin กลับหน้าแรก

### Database Changes

เพิ่มคอลัมน์รูปภาพในตาราง `categories` และเพิ่มคอลัมน์ banner ใน `ProductCatalog`:

```sql
-- รูปหมวดหมู่ 256x256
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url text;

-- Banner รูปสำหรับ section สินค้าแนะนำ / สินค้าทั้งหมด
-- จะเก็บใน site_settings เพิ่ม 2 คอลัมน์
ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS featured_banner_url text,
  ADD COLUMN IF NOT EXISTS all_products_banner_url text;
```

### ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/components/WebOrderCart.tsx` | แสดงราคาผ่อน/เดือนแทนราคาสด (คำนวณจาก installment_plans) + ยอดรวมแสดงเป็นราคาผ่อน |
| `src/components/ProductCatalog.tsx` | (1) แทนที่ข้อความ "สินค้าแนะนำ"/"สินค้าทั้งหมด" ด้วย banner image 2048x448 จาก site_settings (2) เพิ่ม sidebar filter แบรนด์ + ช่วงราคาด้านขวา (3) ซ่อนสินค้าแนะนำเมื่อเลือกหมวดหมู่จาก URL param (4) แสดงหมวดหมู่เป็นรูปภาพ + ชื่อ แบบ grid เมื่อมี image_url |
| `src/pages/PublicProducts.tsx` | แก้ไข HomeNavbar ให้ `onCartOpen` ทำงานถูกต้อง ไม่เด้งไปหน้าแรก |
| `src/components/HomeNavbar.tsx` | แก้ cart icon — เมื่ออยู่ในหน้า /products ให้ trigger `onCartOpen` แทน navigate |
| `src/pages/Showcase.tsx` | (1) LIFF Cart Sheet: เอาราคาสด fallback ออก แสดงเฉพาะราคาผ่อน (2) ProductDetailDialog: เพิ่ม `overflow-y-auto` ให้ scroll ได้ + ปุ่ม X ใหญ่ขึ้นและ sticky |
| `src/pages/SiteSettings.tsx` | เพิ่มช่อง upload banner "สินค้าแนะนำ" และ "สินค้าทั้งหมด" (2048x448) + จัดการรูปหมวดหมู่ |
| `src/hooks/useSiteSettings.ts` | เพิ่ม `featured_banner_url`, `all_products_banner_url` |
| `src/components/AppSidebar.tsx` | เพิ่มปุ่ม "กลับหน้าแรก" (link ไป `/`) ใน sidebar header หรือ footer |
| DB Migration | เพิ่ม `image_url` ใน categories + banner URLs ใน site_settings |

### รายละเอียด

**1. Cart แสดงราคาผ่อนแทนราคาสด (ทั้ง Web + LIFF)**
- `WebOrderCart.tsx`: fetch `installment_plans`, คำนวณราคาผ่อน/เดือนต่อ item (ใช้ plan ที่มีเดือนมากสุด), แสดงแทน `formatPrice(item.price)`
- `Showcase.tsx` Cart Sheet line 936: ลบ fallback `formatPrice(price)` ที่แสดงราคาสด

**2. Banner รูปแทนข้อความ section**
- `ProductCatalog.tsx`: ดึง `featured_banner_url` / `all_products_banner_url` จาก site_settings
- ถ้ามี banner_url แสดง `<img>` ขนาดเต็ม width แทน heading text
- Admin SiteSettings: เพิ่ม upload field สำหรับ 2 banners

**3. ซ่อนสินค้าแนะนำเมื่อเลือกหมวดหมู่**
- เมื่อ `selectedCat` มีค่า (จาก breadcrumb หรือ filter) → ซ่อน Featured section ทั้งหมด

**4. Filter แบรนด์ + ช่วงราคา ด้านขวา**
- เพิ่ม sidebar (hidden on mobile, Sheet on mobile) ด้านขวาของ product grid
- ดึง unique brands จาก products
- Slider ช่วงราคา + Checkbox แบรนด์

**5. Cart icon ไม่เด้งหน้าแรก**
- `HomeNavbar.tsx` line 83-91: เมื่อไม่มี `onCartOpen` แต่มี `cartCount` จะ link ไป `/products` — แก้ให้ `PublicProducts` ส่ง `onCartOpen` เสมอ (ซึ่งมีอยู่แล้ว line 17) — ตรวจสอบว่า HomeNavbar ได้รับ prop ถูกต้อง

**6. LIFF Dialog scroll + ปุ่มปิด**
- ProductDetailDialog: เปลี่ยน layout ให้ content อยู่ใน scrollable div แยกจาก Dialog wrapper
- ปุ่ม X: เพิ่ม `z-50 sticky top-2 right-2` ขนาด `h-10 w-10` พร้อม backdrop

**7. หมวดหมู่รูปภาพ 256x256**
- `categories` เพิ่ม `image_url`
- `ProductCatalog.tsx`: แสดงหมวดหมู่เป็น grid ของรูป + ชื่อ (ถ้ามี image_url) แทน button pills
- Admin: เพิ่ม upload รูปหมวดหมู่ในหน้า Products (ตรง category management)

**8. Admin ปุ่มกลับหน้าแรก**
- `AppSidebar.tsx`: เพิ่ม `<Link to="/">` ปุ่ม "กลับหน้าแรก" ที่ `SidebarFooter` หรือ `SidebarHeader`

