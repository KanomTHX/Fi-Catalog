

## แผนแก้ไข — ซ่อนราคาขายสด, แก้ Order Tracking, ย้ายสินค้าทั้งหมด, เพิ่มเลือกแผนผ่อน+วิธีรับสินค้าตอนจอง, Admin จัดการสถานะ

### 1. ยกเลิกแสดงราคาขายสดในหน้าสินค้า

**`src/pages/ProductDetail.tsx`**:
- ลบ Price section ที่แสดง `effectivePrice` (ราคาขายสด) และ `hasDiscount` strikethrough
- คงไว้เฉพาะ "แผนผ่อนชำระ" boxes (3/6/10/12 เดือน) ตามรูปตัวอย่าง
- MiniProductCard: ลบราคาขาย/ราคาลด แสดงเฉพาะ "เริ่มต้น ฿X,XXX/เดือน" เหมือน ProductCard หลัก

**`src/components/ProductCatalog.tsx`**:
- ProductCard: ลบ fallback ที่แสดง `selling_price`/`discount_price` ใน else case (line 252) — แสดงเฉพาะราคาผ่อนต่อเดือน หรือไม่แสดงเลยถ้าไม่มี plan

### 2. แก้ Order Tracking — `operator does not exist: uuid ~~* unknown`

**`src/pages/OrderTracking.tsx`**:
- ปัญหา: `.ilike("id", ...)` ใช้ไม่ได้กับ column type UUID
- แก้: ใช้ `.or()` กับ `.eq("id", fullUUID)` ถ้า input เป็น valid UUID, หรือใช้ `.textSearch` / cast UUID to text ผ่าน RPC
- วิธีที่ง่ายที่สุด: ใช้ `supabase.rpc` หรือ `.filter("id::text", "ilike", ...)` — แต่ Supabase JS ไม่รองรับ cast
- **Solution**: เปลี่ยนเป็น fetch orders ทั้งหมดแล้ว filter client-side (จำกัดจำนวน) หรือสร้าง DB function `search_order_by_code(code text)` ที่ cast uuid to text แล้ว ilike
- **ใช้ DB function**: สร้าง migration เพิ่ม function `search_order_by_code` แล้วเรียกผ่าน `supabase.rpc`

### 3. ย้ายสินค้าทั้งหมดต่อจากสินค้าแนะนำ

**`src/components/ProductCatalog.tsx`**:
- ย้าย "สินค้าทั้งหมด" section ขึ้นมาอยู่ต่อจาก "สินค้าแนะนำ" (ก่อน category sections)
- ลบ category sections ที่ซ้ำซ้อน (เพราะสินค้าทั้งหมดมี filter หมวดหมู่อยู่แล้ว)

### 4. เพิ่มเลือกแผนผ่อนชำระ + วิธีรับสินค้าตอนจอง

**`src/pages/Checkout.tsx`**:
- เพิ่ม fetch `installment_plans` 
- เพิ่ม UI ให้ลูกค้าเลือกแผนผ่อน (3/6/10/12 เดือน) ด้วย radio/button group
- แสดงยอดผ่อนต่อเดือนหลังเลือก
- วิธีรับสินค้ามีอยู่แล้ว — คงไว้

**`src/contexts/CartContext.tsx`**: ไม่ต้องเปลี่ยน (ราคาเก็บเป็น unit_price เดิม)

**DB**: เพิ่มคอลัมน์ `installment_months` ใน orders table เพื่อบันทึกแผนผ่อนที่เลือก
```sql
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS installment_months int;
```

### 5. Admin จัดการสถานะใบสั่งจอง

**`src/pages/Orders.tsx`**:
- เพิ่ม Select dropdown ในคอลัมน์ "จัดการ" ให้เลือกสถานะได้ทุกค่า (pending, confirmed, completed, cancelled)
- หรือเพิ่ม dropdown ใน detail dialog ให้ admin เปลี่ยนสถานะได้อิสระ
- ปัจจุบัน: pending → ยืนยัน/ยกเลิก, confirmed → เบิกสินค้า — จะเพิ่ม Select ให้เลือกได้ทุกสถานะ

### Database Changes

```sql
-- Function สำหรับค้นหา order ด้วย partial UUID text
CREATE OR REPLACE FUNCTION public.search_order_by_code(code text)
RETURNS SETOF orders
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.orders
  WHERE id::text ILIKE '%' || lower(code) || '%'
  LIMIT 1;
$$;

-- เพิ่ม installment_months ใน orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS installment_months int;
```

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/ProductDetail.tsx` | ลบราคาขายสด แสดงเฉพาะแผนผ่อน, MiniProductCard แสดงราคาผ่อนแทน |
| `src/components/ProductCatalog.tsx` | ลบ fallback ราคาขาย, ย้ายสินค้าทั้งหมดขึ้นต่อจากสินค้าแนะนำ, ลบ category sections ซ้ำ |
| `src/pages/OrderTracking.tsx` | ใช้ `supabase.rpc("search_order_by_code")` แทน `.ilike()` บน UUID |
| `src/pages/Checkout.tsx` | เพิ่ม UI เลือกแผนผ่อนชำระ, บันทึก `installment_months` |
| `src/pages/Orders.tsx` | เพิ่ม Select/dropdown ให้ admin เปลี่ยนสถานะได้ทุกค่า + แสดง delivery_method, installment_months |
| DB Migration | สร้าง function `search_order_by_code` + เพิ่มคอลัมน์ `installment_months` |

