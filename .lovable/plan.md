

## แผนปรับปรุง — ยอดผ่อนใน Order Tracking, ผูกคำสั่งจองกับ LIFF, ล็อคสถานะ+เหตุผล, เปลี่ยนราคาขายเป็นราคาผ่อน fix

### Database Changes

```sql
-- เพิ่มคอลัมน์เก็บยอดผ่อน/เดือน และเหตุผลการเปลี่ยนสถานะ
ALTER TABLE public.orders ADD COLUMN monthly_amount numeric DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN status_reason text DEFAULT NULL;
```

### สรุป 4 รายการ

### 1. แสดงยอดผ่อน/เดือนแทนราคาขายสด ใน OrderTracking + LIFF

**DB**: เพิ่มคอลัมน์ `monthly_amount` ใน `orders` เก็บยอดผ่อน/เดือนที่คำนวณตอน checkout

**`src/components/WebOrderCart.tsx`**, **`src/pages/Checkout.tsx`**, **`src/pages/Showcase.tsx`**:
- ตอน insert order เพิ่ม `monthly_amount` ลงในข้อมูลที่บันทึก

**`src/pages/OrderTracking.tsx`**:
- Query เพิ่ม `monthly_amount` จาก orders
- แสดง "ยอดผ่อน/เดือน" + "จำนวน X เดือน" แทน "รวมทั้งหมด"

**`src/pages/Showcase.tsx`** (LIFF Order Detail Dialog):
- เปลี่ยนจาก `ยอดรวม` เป็น `ยอดผ่อน/เดือน` + จำนวนเดือน

**`src/pages/Orders.tsx`** (Admin Detail Dialog):
- แสดง monthly_amount ถ้ามี

### 2. ผูกคำสั่งจองจากเว็บเข้ากับ LIFF ของลูกค้า

**Logic**: เมื่อลูกค้าเปิด LIFF และมี `line_user_id` → ค้นหา customers ที่ตรงชื่อ/เบอร์โทร แต่ยังไม่มี `line_user_id` → update เชื่อม `line_user_id`

**`src/pages/Showcase.tsx`**:
- ใน tab "คำสั่งจอง" เพิ่มฟีเจอร์ "ผูกคำสั่งจอง" → Dialog ให้กรอกเลขใบจอง (8 ตัว)
- ค้นหา order → ตรวจว่า customer ยังไม่มี line_user_id → update `customers.line_user_id` ด้วย LIFF userId
- หลังผูกแล้ว order จะแสดงในรายการ "คำสั่งจองของฉัน"

### 3. ล็อคสถานะหลังจัดส่งสำเร็จ + เพิ่มช่องเหตุผลเมื่อเปลี่ยนสถานะ

**DB**: เพิ่มคอลัมน์ `status_reason` ใน `orders`

**`src/pages/Orders.tsx`**:
- ถ้า `order.status === "completed"` → disable Select (ไม่ให้เปลี่ยนสถานะอีก)
- เมื่อเลือกสถานะใหม่ → เปิด Dialog ให้กรอกเหตุผล → บันทึก status + status_reason
- แสดง status_reason ใน detail dialog

**`src/hooks/useOrders.ts`**:
- `useUpdateOrderStatus` รับ `reason` เพิ่ม → update ทั้ง `status` และ `status_reason`

**`src/pages/OrderTracking.tsx`** + **`src/pages/Showcase.tsx`** (LIFF):
- แสดง `status_reason` ให้ลูกค้าเห็น (เช่น "เอกสารไม่ครบ", "ส่งแล้ววันที่ xx")

### 4. ยกเลิกราคาขายสด → เปลี่ยนเป็นราคาผ่อน fix เอง

**`src/pages/Products.tsx`**:
- ลบช่อง "ราคาขาย" (`selling_price`) ออกจากฟอร์ม
- เพิ่ม section "ราคาผ่อนชำระรายแผน" → fetch `installment_plans` ที่ active → แสดงช่อง Input สำหรับแต่ละแผน (เช่น 6 เดือน: ____/เดือน, 12 เดือน: ____/เดือน)
- บันทึกลง table ใหม่ `product_installment_prices` (product_id, plan_id, monthly_price)

**DB**: สร้างตาราง `product_installment_prices`
```sql
CREATE TABLE public.product_installment_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES installment_plans(id) ON DELETE CASCADE,
  monthly_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, plan_id)
);
ALTER TABLE public.product_installment_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view" ON public.product_installment_prices FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated can manage" ON public.product_installment_prices FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

**`src/pages/Showcase.tsx`** + **`src/pages/ProductDetail.tsx`** + **`src/components/ProductCatalog.tsx`**:
- แทนที่การคำนวณ `selling_price * interest / months` → ใช้ `product_installment_prices.monthly_price` ตรงๆ
- Checkout: ยอดผ่อน/เดือนใช้จาก `product_installment_prices` ตาม plan ที่เลือก

**`src/components/WebOrderCart.tsx`** + **`src/pages/Checkout.tsx`**:
- คำนวณ `monthly_amount` จาก sum ของ `monthly_price * qty` ตาม plan ที่เลือก

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/OrderTracking.tsx` | แสดงยอดผ่อน/เดือน + จำนวนเดือน แทนราคาขายสด |
| `src/pages/Showcase.tsx` | LIFF: แสดงยอดผ่อน, ผูกคำสั่งจอง dialog, status_reason, ใช้ราคา fix จาก product_installment_prices |
| `src/pages/Orders.tsx` | ล็อคสถานะ completed, dialog เหตุผล, แสดง monthly + reason |
| `src/hooks/useOrders.ts` | เพิ่ม reason ใน updateStatus |
| `src/pages/Products.tsx` | ลบราคาขาย, เพิ่ม section ราคาผ่อน fix ตามแผน |
| `src/components/WebOrderCart.tsx` | บันทึก monthly_amount, ใช้ราคา fix |
| `src/pages/Checkout.tsx` | บันทึก monthly_amount, ใช้ราคา fix |
| `src/pages/ProductDetail.tsx` | ใช้ราคาผ่อน fix จาก product_installment_prices |
| `src/components/ProductCatalog.tsx` | ใช้ราคาผ่อน fix |

### Database Migrations
1. เพิ่ม `monthly_amount` + `status_reason` ใน orders
2. สร้างตาราง `product_installment_prices` พร้อม RLS

