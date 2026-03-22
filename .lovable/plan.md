

## แผนปรับปรุง — Category Query Param, LIFF Dialog Fix, Installment/Delivery ใน Cart, LINE Login QR

### สรุปงาน 6 รายการ

1. **เพิ่ม query param `category` ในหน้า `/products`** — ProductCatalog อ่าน `?category=id` จาก URL แล้ว pre-select filter
2. **แก้ LIFF ProductDetailDialog** — ปรับขนาดให้ไม่เต็มจอเกินไป, เพิ่มปุ่มปิดที่กดง่าย, เอาราคาขายสดออก (line 182), เพิ่มเลือกแผนผ่อน+วิธีรับสินค้าในตอนจอง
3. **แก้ Checkout ใน LIFF (handleCheckout)** — บันทึก `delivery_method` + `installment_months` เหมือนหน้าเว็บ, เพิ่ม UI เลือกแผนผ่อนและวิธีรับสินค้าใน Checkout Dialog
4. **แก้หน้า Checkout ของเว็บ (เพิ่มตะกร้า)** — ปัจจุบันกด "เพิ่มใส่ตะกร้า" ใน ProductDetail ไม่ได้เลือกแผนผ่อน/วิธีจัดส่ง แต่ตอน checkout มีให้เลือก — ตรวจสอบว่า checkout มีครบแล้ว (มีอยู่แล้ว) ไม่ต้องแก้
5. **LINE Login QR Code ในหน้าเว็บ** — ไม่สามารถทำ LINE Login ผ่าน Lovable Cloud ได้ (รองรับเฉพาะ Google/Apple) จะเสนอทางเลือก
6. **เอาราคาขายสดออกจาก LIFF** — ลบ `formatPrice(effectivePrice)` ที่ line 182 ของ ProductDetailDialog และ cart sheet

### ไม่มี Database Changes

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/components/ProductCatalog.tsx` | อ่าน `useSearchParams` เอา `category` query param มา pre-select `selectedCat` |
| `src/pages/Showcase.tsx` | (1) ProductDetailDialog: ปรับ `max-h-[85vh]` + scroll + ปุ่มปิดชัดเจน + เอาราคาขายสดออก (2) Checkout Dialog: เพิ่ม installment plan selector + delivery method radio + บันทึกลง orders (3) Cart Sheet: เอาราคาขายสดออก แสดงราคาผ่อนแทน |

### รายละเอียด

**1. ProductCatalog — Category Query Param**
- Import `useSearchParams` จาก react-router-dom
- อ่าน `searchParams.get("category")` ใน initial state ของ `selectedCat`
- เมื่อ user กดเปลี่ยน category filter → update URL search param ด้วย `setSearchParams`

**2. LIFF ProductDetailDialog Fix**
- เปลี่ยน `DialogContent className` จาก `max-w-lg p-0` เป็น `max-w-lg max-h-[85vh] overflow-y-auto p-0`
- เพิ่มปุ่ม `X` ปิดที่ชัดเจน (sticky top-right)
- ลบ line 182 `<span className="text-2xl font-bold text-primary">{formatPrice(effectivePrice)}</span>`
- ปุ่ม "เพิ่มลงตะกร้า" คงไว้

**3. LIFF Checkout — เพิ่มแผนผ่อน + วิธีรับสินค้า**
- เพิ่ม state: `liffDeliveryMethod`, `liffSelectedPlan`
- เพิ่ม UI ใน Checkout Dialog:
  - RadioGroup: รับหน้าร้าน / จัดส่งถึงบ้าน
  - Button group: เลือกแผนผ่อน 3/6/10/12 เดือน (ดึงจาก `installmentPlans` ที่ fetch มาแล้ว)
- แก้ `handleCheckout()` line 477: เพิ่ม `delivery_method` + `installment_months` ใน order insert

**4. LINE Login QR — ข้อจำกัด**
- Lovable Cloud รองรับเฉพาะ Google และ Apple OAuth
- LINE Login ไม่สามารถทำผ่าน Lovable Cloud ได้
- จะแจ้งผู้ใช้ข้อจำกัดนี้ พร้อมเสนอทางเลือก: ใช้ Google Login แทน หรือให้ลูกค้าใช้ LINE LIFF สำหรับ LINE-based flow

**5. LIFF Cart Sheet — เอาราคาขายสดออก**
- Cart Sheet (line 927-933): แสดงราคาผ่อนต่อเดือนแทนราคาเต็ม โดยคำนวณจาก `maxMonthsPlan`

