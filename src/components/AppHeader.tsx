import { Bell } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppHeader() {
  const { profile, role } = useAuth();

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("product_stock").select("*");
      return (data ?? []).filter(
        (p) => p.current_stock !== null && p.min_stock_level !== null && p.current_stock <= p.min_stock_level
      );
    },
    refetchInterval: 30000,
  });

  const initials = (profile?.full_name ?? "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
      </div>
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {lowStockItems.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground">
                  {lowStockItems.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Low Stock Alerts</h4>
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">All products are sufficiently stocked.</p>
              ) : (
                lowStockItems.slice(0, 10).map((item) => (
                  <div key={item.product_id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                    <span className="font-medium truncate mr-2">{item.name}</span>
                    <span className="text-destructive font-mono text-xs">{item.current_stock} / {item.min_stock_level}</span>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none">{profile?.full_name ?? "User"}</p>
            <p className="text-xs text-muted-foreground capitalize">{role ?? "staff"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
