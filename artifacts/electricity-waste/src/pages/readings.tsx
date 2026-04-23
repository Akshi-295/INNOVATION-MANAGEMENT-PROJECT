import { useState } from "react";
import { useListReadings, useListDevices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap } from "lucide-react";

export default function Readings() {
  const [deviceId, setDeviceId] = useState<string>("all");
  const { data: devices } = useListDevices();
  const { data: readings, isLoading } = useListReadings(
    deviceId !== "all" ? { deviceId: parseInt(deviceId), limit: 50 } : { limit: 50 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telemetry Data</h1>
          <p className="text-muted-foreground mt-1">Raw power readings and real-time analysis stream.</p>
        </div>
        <Select value={deviceId} onValueChange={setDeviceId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            {devices?.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Latest Telemetry (Top 50)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !readings || readings.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <Zap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>No telemetry data available.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead className="text-right">Draw (W)</TableHead>
                    <TableHead className="text-right">Usage (kWh)</TableHead>
                    <TableHead className="w-[100px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id} className={reading.isWasteful ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(reading.recordedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{reading.deviceName}</TableCell>
                      <TableCell className="text-right font-mono">{reading.wattsConsumed.toFixed(1)} W</TableCell>
                      <TableCell className="text-right font-mono">{reading.kwhConsumed.toFixed(3)}</TableCell>
                      <TableCell className="text-center">
                        {reading.isWasteful ? (
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-transparent hover:bg-destructive/30">
                            <AlertTriangle className="mr-1 h-3 w-3" /> Waste
                          </Badge>
                        ) : (
                          <span className="text-emerald-500/70 text-xs">Nominal</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
