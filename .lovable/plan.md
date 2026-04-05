

## ปรับปรุงระบบ Barcode & Serial Number

### ปัญหาปัจจุบัน
- `barcode` ในตาราง products ถูก auto-generate เป็น `SF20260403648` ตอน stock-in ซึ่งซ้ำซ้อนกับ SKU (Product Code)
- ฉลากพิมพ์แสดง SKU + Serial Code แต่ barcode ที่ encode เป็น Code 39 ใช้ serial_code ซึ่งอาจสับสน
- ต้องการแยกชัดเจน: **Product Code (SKU)** = ควบคุมสินค้า, **Serial Number** = ติดสินค้าแต่ละตัว

### แผนแก้ไข

#### 1. ยกเลิกระบบ auto-generate barcode ที่ซ้ำซ้อน
**ไฟล์**: `src/hooks/useStockMovements.ts`
- ลบ function `generateBarcode()` และการเรียกใช้ตอน stock-in
- barcode field ในตาราง products ยังเก็บไว้ได้ แต่ไม่ auto-generate อีก (ใช้ SKU เป็น Product Code แทน)

#### 2. ปรับปรุงฉลากพิมพ์ให้ชัดเจน
**ไฟล์**: `src/pages/SerialPrint.tsx`
- Layout ฉลากใหม่:
  - บรรทัด 1: ชื่อสินค้า
  - บรรทัด 2: **Product Code: [SKU]** — ตัวหนังสือชัดเจน
  - บรรทัด 3: **Barcode (Code 39)** ของ Serial Number
  - บรรทัด 4: **S/N: [serial_code]** — ตัวหนังสือ
- Barcode encode จาก serial_code (ใช้สำหรับสแกนเช็คสต็อก)
- เพิ่มขนาดฉลากและ spacing ให้อ่านง่ายขึ้น

#### 3. ปรับหน้าเช็คสต็อกให้รองรับทั้ง Serial และ Product Code
**ไฟล์**: `src/pages/StockCheck.tsx`
- สแกน serial_code → ค้นหาจาก serial_numbers ตาราง (เหมือนเดิม)
- แสดง Product Code (SKU) ในผลลัพธ์สแกนด้วย เพื่อให้เห็นว่าสินค้าตัวไหน

#### 4. ลบ barcode column จากหน้า StockIn
**ไฟล์**: `src/pages/StockIn.tsx`
- ลบการแสดง barcode ที่ auto-generate ออกจากตาราง (ไม่จำเป็นแล้ว)

### สรุปแนวคิด

```text
┌─────────────────────────┐
│     ชื่อสินค้า           │
│  Product Code: ABC-001  │  ← SKU จากตาราง products
│  ║║║║║║║║║║║║║║║║║║║║║  │  ← Barcode Code39 ของ Serial
│  S/N: XF8A2B3C          │  ← Serial Number (สแกนเช็คสต็อก)
└─────────────────────────┘
```

- **SKU (Product Code)**: ระบุรุ่น/กลุ่มสินค้า → ใช้จัดการสินค้า
- **Serial Number**: ระบุสินค้าแต่ละชิ้น → ใช้สแกนเช็คสต็อก + ติดตามรายตัว

### ไฟล์ที่แก้ไข

| ไฟล์ | สิ่งที่เปลี่ยน |
|---|---|
| `src/hooks/useStockMovements.ts` | ลบ auto-generate barcode |
| `src/pages/SerialPrint.tsx` | ปรับ layout ฉลากใหม่ ชัดเจนขึ้น |
| `src/pages/StockCheck.tsx` | แสดง SKU ในผลสแกน |
| `src/pages/StockIn.tsx` | ลบ column barcode ที่ซ้ำซ้อน |

