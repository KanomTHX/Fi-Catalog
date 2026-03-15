

## สร้างหน้าแรกเป็น Showcase + ย้าย Admin Panel ไป `/admin`

### สรุป
- หน้าแรก `/` จะเป็นหน้า Showcase สินค้าสำหรับลูกค้า (ใช้ component เดิมจาก `Showcase.tsx`)
- ย้ายหน้า admin ทั้งหมดไปอยู่ภายใต้ `/admin/*`
- `/liff` ยังคงใช้งานได้ (redirect ไป `/`)
- Login admin ย้ายไป `/admin/auth`

### โครงสร้าง Route ใหม่

```text
/                → Showcase (public, หน้าโชว์สินค้า+สั่งจอง)
/liff            → redirect → /
/showcase        → redirect → /

/admin/auth      → Auth login page
/admin           → Dashboard (protected)
/admin/products  → Products (protected)
/admin/stock-in  → StockIn (protected)
/admin/stock-out → StockOut (protected)
/admin/adjustments → Adjustments (protected)
/admin/serial-print → SerialPrint (protected)
/admin/stock-check  → StockCheck (protected)
/admin/orders       → Orders (protected)
/admin/reports      → Reports (protected)
/admin/users        → Users (protected)
/admin/activity-log → ActivityLog (protected)
/admin/settings/line → LineSettings (protected)
/admin/settings/site → SiteSettings (protected)
```

### ไฟล์ที่แก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|---|---|
| `src/App.tsx` | เปลี่ยน route structure: `/` = Showcase, `/admin/*` = ProtectedRoutes, AuthRoute ย้ายไป `/admin/auth` |
| `src/components/AppSidebar.tsx` | อัปเดต URL ทั้งหมดให้มี prefix `/admin` (เช่น `/admin/products`, `/admin/orders`) |
| `src/components/AppHeader.tsx` | ไม่มีการเปลี่ยนแปลง (ใช้ได้เหมือนเดิม) |

### รายละเอียด

**`src/App.tsx`**
- `/` render `<Showcase />` (public, ไม่ต้อง login)
- `/liff` และ `/showcase` redirect ไป `/`
- `/admin/auth` render `<AuthRoute />` (redirect ไป `/admin` ถ้า login แล้ว)
- `/admin/*` render `<ProtectedRoutes />` โดย route ภายในเปลี่ยนเป็น relative paths
- `AuthRoute` redirect ไป `/admin` แทน `/`

**`src/components/AppSidebar.tsx`**
- `mainItems` URLs เปลี่ยนจาก `/products` → `/admin/products`, `/stock-in` → `/admin/stock-in` ฯลฯ
- `adminItems` URLs เปลี่ยนจาก `/users` → `/admin/users` ฯลฯ
- Dashboard URL เปลี่ยนจาก `/` → `/admin`

