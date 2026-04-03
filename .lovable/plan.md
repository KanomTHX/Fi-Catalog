

## แผนแก้ไข 4 ส่วน

### 1. ระบบจัดการรูปแบนเนอร์ — Image Crop/Fit ก่อนอัปโหลด

**ปัญหา**: อัปโหลดรูปขนาดใหญ่เกินแนะนำ (2048x448) แล้วระบบ crop จน object-cover เสียสัดส่วน

**แก้ไขที่** `src/pages/SiteSettings.tsx`:
- เพิ่ม image preview ขนาดจริง (aspect ratio 2048:448 ≈ 4.57:1) ก่อนอัปโหลด
- ใช้ Canvas API client-side เพื่อ resize/fit รูปให้ตรง 2048x448 ก่อนอัปโหลดจริง:
  - ถ้ารูปที่อัปมาใหญ่เกิน → ย่อให้พอดี 2048px กว้าง แล้ว crop ส่วนสูงให้ 448px (center crop)
  - แสดง preview ของรูปที่ crop แล้ว ก่อนยืนยัน
- เปลี่ยนจาก `object-cover` เป็น `object-contain` ที่ preview รูปแบนเนอร์ในหน้า settings เพื่อเห็นสัดส่วนจริง
- ใช้ pattern เดียวกันทั้ง "แบนเนอร์สินค้าแนะนำ" และ "แบนเนอร์สินค้าทั้งหมด"

### 2. ปรับปรุง Barcode/Serial Number — Product Code + Serial Number

**ปัญหา**: ตอนนี้ barcode label แสดงแค่ serial code อย่างเดียว ต้องการให้มี Product Code (SKU) ด้านบน และ Serial Number ด้านล่าง

**แก้ไขที่** `src/pages/SerialPrint.tsx`:
- เปลี่ยน `BarcodeLabel` component ให้รับ `sku` prop เพิ่ม
- Layout ใหม่ของ label:
  - บรรทัดที่ 1: ชื่อสินค้า (productName)
  - บรรทัดที่ 2: Product Code (SKU) — ตัวหนังสือ
  - บรรทัดที่ 3: Barcode (Code 39) ของ serial code
  - บรรทัดที่ 4: Serial Number — ตัวหนังสือ
- ส่ง `sku` จาก product data ที่มีอยู่แล้วผ่าน `useProducts()`

**แก้ไขที่** `src/components/SerialNumberDialog.tsx`:
- แสดง SKU ของสินค้าใน dialog header ให้ชัดเจน

### 3. เช็คสต็อกก่อนจอง — ทั้ง Web และ LIFF

**ปัญหา**: สินค้าที่สต็อกหมดยังสามารถจองได้

**แก้ไขที่** `src/pages/Checkout.tsx` (Web):
- ก่อน `handleSubmit()` ดำเนินการ insert order → query `product_stock` view เช็คทุก item ในตะกร้า
- ถ้าสินค้าใดมี `current_stock <= 0` → แจ้ง toast error + ไม่ให้จอง
- แสดงข้อความว่าสินค้าตัวไหน "สินค้าหมด"

**แก้ไขที่** `src/pages/Showcase.tsx` (LIFF):
- เพิ่ม fetch `product_stock` view เมื่อ load data
- `addToCart()` → เช็คสต็อกก่อนเพิ่ม ถ้า `current_stock <= 0` → toast "สินค้าหมด"
- `handleCheckout()` → เช็คสต็อกอีกครั้งก่อน submit

**แก้ไขที่** `src/components/ProductCatalog.tsx` (Web catalog):
- Fetch `product_stock` ด้วย
- แสดง badge "สินค้าหมด" บน product card ถ้า `current_stock <= 0`

**แก้ไขที่** `src/contexts/CartContext.tsx` (Web cart):
- `addToCart()` → รับ stock data เป็นพารามิเตอร์เสริม หรือเช็คจาก query ก่อนเพิ่ม

### 4. ไฟล์ที่ต้องแก้ไข

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `src/pages/SiteSettings.tsx` | Image crop/resize ก่อนอัปโหลดแบนเนอร์ |
| `src/pages/SerialPrint.tsx` | Label layout: SKU ด้านบน + Serial ด้านล่าง |
| `src/pages/Checkout.tsx` | เช็คสต็อกก่อนยืนยันจอง |
| `src/pages/Showcase.tsx` | เช็คสต็อกก่อนเพิ่มตะกร้า/จอง (LIFF) |
| `src/components/ProductCatalog.tsx` | แสดง badge สินค้าหมด |
| `src/contexts/CartContext.tsx` | อาจเพิ่ม stock validation |

