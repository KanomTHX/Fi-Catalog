import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  SlidersHorizontal, FileBarChart, Users, Activity, LogOut, MessageSquare,
  Printer, ScanBarcode, ShoppingCart, Settings, CreditCard, Home, FolderOpen
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "แดชบอร์ด", url: "/admin", icon: LayoutDashboard },
  { title: "สินค้า", url: "/admin/products", icon: Package },
  { title: "หมวดหมู่", url: "/admin/categories", icon: FolderOpen },
  { title: "รับเข้า", url: "/admin/stock-in", icon: ArrowDownToLine },
  { title: "เบิกออก", url: "/admin/stock-out", icon: ArrowUpFromLine },
  { title: "ปรับปรุง", url: "/admin/adjustments", icon: SlidersHorizontal },
  { title: "พิมพ์ฉลาก", url: "/admin/serial-print", icon: Printer },
  { title: "เช็คสต็อก", url: "/admin/stock-check", icon: ScanBarcode },
  { title: "คำสั่งจอง", url: "/admin/orders", icon: ShoppingCart },
  { title: "รายงาน", url: "/admin/reports", icon: FileBarChart },
];

const adminItems = [
  { title: "ผู้ใช้", url: "/admin/users", icon: Users },
  { title: "บันทึกกิจกรรม", url: "/admin/activity-log", icon: Activity },
  { title: "ตั้งค่า LINE", url: "/admin/settings/line", icon: MessageSquare },
  { title: "ตั้งค่าระบบ", url: "/admin/settings/site", icon: Settings },
  { title: "แผนผ่อนชำระ", url: "/admin/settings/installments", icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, signOut } = useAuth();
  const { data: siteSettings } = useSiteSettings();
  const isActive = (path: string) => location.pathname === path;
  const displayName = siteSettings?.site_name || "StockFlow";
  const logoUrl = siteSettings?.logo_url;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          {!collapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">{displayName}</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>เมนู</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>ผู้ดูแลระบบ</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-2 border-t border-sidebar-border space-y-1">
        <NavLink to="/" className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md">
          <Home className="h-4 w-4" />
          {!collapsed && "กลับหน้าแรก"}
        </NavLink>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "ออกจากระบบ"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
