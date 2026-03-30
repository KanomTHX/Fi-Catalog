
ปัญหานี้น่าจะไม่ได้มาจาก “ไม่มีข้อมูลในฐานข้อมูล” แต่เป็นปัญหาที่ฝั่งหน้าเว็บ public ดึงข้อมูลแล้วไม่ถูก render ออกมา

สิ่งที่ผมตรวจเจอแล้ว:
- มีสินค้าในฐานข้อมูล 26 รายการ
- มีหมวดหมู่ 12 รายการ
- มีข้อมูลตั้งค่าเว็บ 1 ชุด
- มีแผนผ่อน active 7 แผน
- สิทธิ์ public สำหรับ `products`, `categories`, `installment_plans`, `product_installment_prices`, `site_settings` มีอยู่แล้ว
- ดังนั้นจุดที่ต้องแก้หลักคือ flow ดึงข้อมูลในหน้า public โดยเฉพาะ `src/components/ProductCatalog.tsx`

แผนแก้ไข

1. แก้ flow ดึงข้อมูลหน้าสินค้าให้ไม่ค้างเป็น skeleton
- ปรับ `ProductCatalog.tsx` ให้รองรับ `isError` / `error` ชัดเจน แทนการแสดง skeleton อย่างเดียว
- แยกการโหลด “รายการสินค้า” ออกจาก “ราคาผ่อน” เพื่อให้สินค้าขึ้นก่อน แม้ query ราคาผ่อนจะช้าหรือพลาด
- เพิ่ม fallback ที่ชัดเจน: ถ้าดึงสินค้าได้แต่ดึงราคาผ่อนไม่ได้ ให้ยังแสดงการ์ดสินค้าได้

2. ตรวจ query public ทุกหน้าที่เกี่ยวข้อง
- `src/components/ProductCatalog.tsx`
- `src/components/ProductSearchBar.tsx`
- `src/pages/ProductDetail.tsx`
- `src/hooks/useSiteSettings.ts`
เป้าหมายคือทำให้ทุกหน้า public ใช้รูปแบบ query ที่ปลอดภัยเหมือนกัน และไม่พังเงียบเมื่อ query ใด query หนึ่งมีปัญหา

3. ปรับ logic การแสดงสินค้าให้ไม่พึ่งราคาผ่อนในการ render รายการ
- ตอนนี้มีสินค้าแค่ 1 ตัวที่มีราคาผ่อนจริงในตาราง `product_installment_prices`
- จะคงให้ “สินค้าทั้งหมด” แสดงครบก่อน
- สินค้าที่ไม่มีราคาผ่อนให้แสดงแบบไม่มีราคา/ปุ่มจอง หรือมีข้อความกำกับแทน ไม่ควรถูกซ่อนจาก grid

4. เพิ่มสถานะหน้า public ให้ debug ได้ง่าย
- ถ้า query พลาด ให้มีข้อความ error และปุ่มลองใหม่
- ถ้าไม่มีสินค้าจริง ให้แสดง empty state ที่ชัดเจน
- ลดโอกาสที่ผู้ใช้เห็นแต่ skeleton แล้วไม่รู้ว่าเกิดอะไรขึ้น

5. ตรวจผลกระทบกับหน้าอื่น
- หน้าแรก `/`
- `/about`
- `/contact`
- `/products`
- `/products/:id`
รวมถึง navbar search ที่มี query สินค้าแยกอีกชุดหนึ่ง เพื่อไม่ให้ query ด้านบนไปกระทบหน้า public ทั้งระบบ

ไฟล์ที่จะปรับ
- `src/components/ProductCatalog.tsx`
- `src/components/ProductSearchBar.tsx`
- `src/pages/ProductDetail.tsx`
- `src/pages/PublicProducts.tsx`
- `src/hooks/useSiteSettings.ts` (ถ้าต้องทำให้รูปแบบ loading/error สอดคล้องกัน)

รายละเอียดเทคนิค
- จากข้อมูลที่ตรวจแล้ว backend มีข้อมูลและ policy เปิดอ่าน public อยู่แล้ว จึงไม่ใช่ปัญหา RLS เป็นหลัก
- ความเสี่ยงสูงสุดอยู่ที่ฝั่ง React Query + การ render state ในหน้า public
- แนวทางที่เหมาะคือทำให้หน้า `/products` render จาก `products` query ได้โดยตรง แล้วค่อยเติมข้อมูลผ่อนทีหลัง แทนการให้ประสบการณ์ทั้งหน้าดูเหมือน “ไม่มีข้อมูล”
