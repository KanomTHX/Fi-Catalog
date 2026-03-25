

## แผนปรับปรุง — หมวดหมู่รูปเต็มช่อง, ลบคำสั่งจอง, ค้นหา Autosuggestion, รูปสินค้าไม่ crop, LINE Login, สินค้าแนะนำ carousel, Serial จำกัดจำนวน

### สรุป 7 รายการ

### Database Changes

```sql
-- เพิ่มสิทธิ์ลบ orders + order_items
CREATE POLICY "Admins can delete orders" ON public.orders
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete order_items" ON public.order_items
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
```

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/components/ProductCatalog.tsx` | (1) หมวดหมู่รูปเต็มช่อง ซ่อนชื่อ (2) Featured max 8 ตัว + carousel เมื่อเกิน (3) All products max 12 + pagination/load more (4) รูปสินค้า `object-contain` แทน `object-cover` |
| `src/pages/Products.tsx` | แยก dialog จัดการหมวดหมู่ (CRUD ชื่อ+รูป) ออกจากฟอร์มเพิ่มสินค้า |
| `src/pages/Orders.tsx` | เพิ่มปุ่มลบคำสั่งจอง + confirm dialog |
| `src/hooks/useOrders.ts` | เพิ่ม `useDeleteOrder` mutation |
| `src/components/AppSidebar.tsx` | เพิ่มเมนู "จัดการหมวดหมู่" `/admin/categories` |
| `src/pages/Categories.tsx` | **สร้างใหม่** — หน้าจัดการหมวดหมู่ (CRUD ชื่อ+รูป 256x256) |
| `src/App.tsx` | เพิ่ม route `/admin/categories` |
| `src/components/ProductSearchBar.tsx` | **สร้างใหม่** — ช่องค้นหาด้านบน autosuggestion + รูปสินค้าเล็ก |
| `src/components/HomeNavbar.tsx` | เพิ่ม `ProductSearchBar` ด้านบน |
| `src/pages/Showcase.tsx` | (1) รูปสินค้า `object-contain` (2) ProductCard + ProductDetailDialog ปรับรูป |
| `src/pages/ProductDetail.tsx` | รูปสินค้า `object-contain` แทน `object-cover` |
| `src/hooks/useSerialNumbers.ts` | แก้ `useBatchCreateSerials` ให้ตรวจสอบ stock limit + ใช้การสุ่ม serial code |
| `src/components/SerialNumberDialog.tsx` | แสดง stock เหลือ + จำกัดจำนวนสร้าง serial |
| `src/pages/Auth.tsx` | เพิ่มปุ่ม LINE Login |

### รายละเอียด

**1. หมวดหมู่รูปเต็มช่อง ซ่อนชื่อ**
- `ProductCatalog.tsx` line 200-219: เปลี่ยน category image grid
  - รูปเต็มช่อง: ลบ `w-16 h-16` → ใช้ `w-full aspect-square` + `object-contain` + `rounded-xl`
  - ซ่อนชื่อ: ลบ `<span>{c.name}</span>` (ชื่ออยู่ในรูปแล้ว)
  - ถ้าไม่มีรูป ยังแสดงชื่อเป็น fallback

**2. แยกหน้าจัดการหมวดหมู่ใน Admin**
- สร้าง `src/pages/Categories.tsx`: ตาราง categories พร้อม CRUD (ชื่อ + upload รูป 256x256)
- เพิ่มเมนู "หมวดหมู่" ใน `AppSidebar.tsx` (ใต้ "สินค้า")
- เพิ่ม route ใน `App.tsx`

**3. ปุ่มลบคำสั่งจอง ใน Admin Orders**
- `useOrders.ts`: เพิ่ม `useDeleteOrder` — ลบ order_items ก่อน แล้วลบ order
- `Orders.tsx`: เพิ่มปุ่ม Trash icon ในแถว + AlertDialog ยืนยันก่อนลบ
- DB: เพิ่ม DELETE policy สำหรับ admin

**4. ช่องค้นหา Autosuggestion + รูปสินค้า**
- สร้าง `ProductSearchBar.tsx`: Input ค้นหาพร้อม dropdown แสดงรูปสินค้าเล็ก + ชื่อ + ราคา
- ใช้ debounce search, query จาก products cache
- คลิกแล้ว navigate ไป `/products/:id`
- วางใน `HomeNavbar.tsx` ระหว่าง logo กับ nav links

**5. รูปสินค้าไม่ crop (ทั้ง Web + LIFF)**
- เปลี่ยน `object-cover` → `object-contain` + `bg-white` ในทุกที่ที่แสดงรูปสินค้า:
  - `ProductCatalog.tsx` ProductCard line 361
  - `Showcase.tsx` ProductCard line 77, ProductDetailDialog line 148-150
  - `ProductDetail.tsx` รูปหลัก

**6. LINE Login**
- Lovable Cloud ไม่รองรับ LINE Login โดยตรง แต่สามารถ integrate ผ่าน custom OAuth ได้
- ใช้ Supabase Auth custom provider: สร้าง Edge Function ที่ handle LINE Login callback
- เพิ่มปุ่ม "เข้าสู่ระบบด้วย LINE" ในหน้า Auth
- **หมายเหตุ**: ต้องมี LINE Login Channel ID + Secret — จะขอ secret จากผู้ใช้

**7. สินค้าแนะนำ max 8 + carousel, สินค้าทั้งหมด max 12**
- `ProductCatalog.tsx`: Featured section ปัจจุบัน slice 8 แล้ว → เพิ่ม horizontal carousel (ใช้ Carousel component) เมื่อ > 4 ตัว
- All products: แสดงสูงสุด 12 ตัวแรก + ปุ่ม "ดูเพิ่มเติม" เพื่อ load more

**8. Serial Numbers จำกัดจำนวน + สุ่ม**
- `useSerialNumbers.ts` → `useBatchCreateSerials`: ตรวจสอบ current_stock จาก `product_stock` view ก่อนสร้าง
- ถ้า serial ที่มีอยู่ (status=in_stock) + จำนวนใหม่ > current_stock → reject
- สุ่ม serial code: ใช้ `crypto.randomUUID().slice(0,8).toUpperCase()` + prefix แทนการนับเลข
- ป้องกันซ้ำ: query existing serial_codes ก่อน insert, retry ถ้าซ้ำ
- `SerialNumberDialog.tsx`: แสดงจำนวนสต็อกเหลือ + serial ที่มีอยู่ + จำกัด input count

### Dependencies ใหม่
ไม่มี

