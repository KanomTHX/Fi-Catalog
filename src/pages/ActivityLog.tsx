import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function ActivityLog() {
  const { data: logs = [] } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const actionLabels: Record<string, string> = {
    stock_in: "รับเข้าสต็อก",
    stock_out: "เบิกออกสต็อก",
    stock_adjustment: "ปรับปรุงสต็อก",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">บันทึกกิจกรรม</h1>
        <p className="text-muted-foreground">ประวัติการใช้งานระบบทั้งหมด</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>การดำเนินการ</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead>วันที่</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">{actionLabels[log.action] ?? log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                    {log.details ? JSON.stringify(log.details) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">ยังไม่มีกิจกรรม</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
