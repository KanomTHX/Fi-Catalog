

## แผนปรับปรุง — รูปสินค้า crop, LINE แจ้งเตือนยอดผ่อน, ข้อความรอสินเชื่อ, สถานะคำสั่งจองใหม่

### สรุป 4 รายการ

### 1. คืนค่ารูปสินค้า MiniProductCard เป็น `object-cover`

**`src/pages/ProductDetail.tsx`** (MiniProductCard line 464):
- เปลี่ยน `object-contain p-2` → `object-cover` ในรูปสินค้าที่คล้ายกันและสินค้าที่ดูล่าสุด

### 2. LINE แจ้งเตือน — แสดงยอดผ่อน/เดือน + จำนวนเดือน + ชื่อสินค้า

**`supabase/functions/line-notify-order/index.ts`**:
- เพิ่ม fields: `monthly_amount`, `installment_months`, `product_names` (array ชื่อสินค้า)
- แสดงในข้อความ: ยอดผ่อน/เดือน แทน `total_amount`, จำนวนเดือน, รายชื่อสินค้า

**`src/components/WebOrderCart.tsx`**, **`src/pages/Checkout.tsx`**, **`src/pages/Showcase.tsx`**:
- ส่ง `monthly_amount` (คำนวณจาก selectedPlan), `installment_months` (selectedPlanMonths), `product_names` (items.map name) ไปพร้อม LINE notify request

### 3. เพิ่มข้อความ "รอฝ่ายสินเชื่อติดต่อกลับ" หลังสั่งจองสำเร็จ

**`src/components/WebOrderCart.tsx`** (success dialog line 277):
- เปลี่ยนข้อความเป็น "รอฝ่ายสินเชื่อติดต่อกลับ"

**`src/pages/Showcase.tsx`** (order success dialog line 1074):
- เปลี่ยนข้อความเป็น "รอฝ่ายสินเชื่อติดต่อกลับ"

**`src/pages/Checkout.tsx`** (success dialog):
- เพิ่มข้อความเดียวกัน

### 4. ปรับสถานะคำสั่งจอง 6 สถานะ

สถานะใหม่:
| Key | Label |
|---|---|
| `pending` | รอดำเนินการ |
| `credit_check` | รอฝ่ายสินเชื่อติดต่อ |
| `credit_approved` | อนุมัติสินเชื่อ |
| `shipping` | รอจัดส่ง |
| `completed` | จัดส่งสำเร็จ |
| `credit_rejected` | ไม่อนุมัติสินเชื่อ |

**ไฟล์ที่ต้องอัปเดต `statusConfig`**:
- `src/pages/Orders.tsx` — statusConfig + Select options
- `src/pages/Showcase.tsx` — statusConfig
- `src/pages/OrderTracking.tsx` — statusConfig + progress steps
- `src/hooks/useOrders.ts` — labels ใน onSuccess + เปลี่ยน stock-out logic จาก `completed` เป็น `completed` (ยังคงเหมือนเดิมเพราะ key เดียวกัน)

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/pages/ProductDetail.tsx` | MiniProductCard รูป `object-cover` |
| `supabase/functions/line-notify-order/index.ts` | เพิ่ม monthly_amount, installment_months, product_names ในข้อความ |
| `src/components/WebOrderCart.tsx` | ส่งข้อมูลผ่อนไป LINE + ข้อความรอสินเชื่อ |
| `src/pages/Checkout.tsx` | ส่งข้อมูลผ่อนไป LINE + ข้อความรอสินเชื่อ |
| `src/pages/Showcase.tsx` | ส่งข้อมูลผ่อนไป LINE + ข้อความรอสินเชื่อ |
| `src/pages/Orders.tsx` | statusConfig 6 สถานะ |
| `src/pages/OrderTracking.tsx` | statusConfig 6 สถานะ + progress steps |
| `src/hooks/useOrders.ts` | labels อัปเดต |

### ไม่มี Database Changes (สถานะเก็บเป็น text อยู่แล้ว)

