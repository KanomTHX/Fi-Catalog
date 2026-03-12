import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  SlidersHorizontal, FileBarChart, Users, Activity, LogOut, MessageSquare,
  Printer, ScanBarcode, ShoppingCart, Settings
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "แดชบอร์ด", url: "/", icon: LayoutDashboard },
  { title: "สินค้า", url: "/products", icon: Package },
  { title: "รับเข้า", url: "/stock-in", icon: ArrowDownToLine },
  { title: "เบิกออก", url: "/stock-out", icon: ArrowUpFromLine },
  { title: "ปรับปรุง", url: "/adjustments", icon: SlidersHorizontal },
  { title: "พิมพ์ฉลาก", url: "/serial-print", icon: Printer },
  { title: "เช็คสต็อก", url: "/stock-check", icon: ScanBarcode },
  { title: "คำสั่งจอง", url: "/orders", icon: ShoppingCart },
  { title: "รายงาน", url: "/reports", icon: FileBarChart },
];

const adminItems = [
  { title: "ผู้ใช้", url: "/users", icon: Users },
  { title: "บันทึกกิจกรรม", url: "/activity-log", icon: Activity },
  { title: "ตั้งค่า LINE", url: "/settings/line", icon: MessageSquare },
  { title: "ตั้งค่าระบบ", url: "/settings/site", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { role, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
            SF
          </div>
          {!collapsed && <span className="text-lg font-bold text-sidebar-primary-foreground">StockFlow</span>}
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
      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "ออกจากระบบ"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
