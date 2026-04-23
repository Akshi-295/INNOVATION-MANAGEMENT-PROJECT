import { useListDevices, useDeleteDevice, getListDevicesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Plus, Trash2, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Devices() {
  const { data: devices, isLoading } = useListDevices();
  const deleteDevice = useDeleteDevice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      await deleteDevice.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListDevicesQueryKey() });
      toast({ title: "Device deleted", description: "The device has been removed from monitoring." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete device", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
          <p className="text-muted-foreground mt-1">Manage and monitor all connected electrical endpoints.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Device
        </Button>
      </div>

      <Card className="bg-card">
        <CardHeader className="pb-0">
          <CardTitle>Equipment Roster</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !devices || devices.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <Cpu className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>No devices connected.</p>
              <p className="text-sm">Add a device to begin monitoring energy consumption.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Current Draw</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.name}</TableCell>
                      <TableCell className="text-muted-foreground">{device.location}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs font-mono">
                          {device.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {device.status === 'online' && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Online</Badge>}
                        {device.status === 'offline' && <Badge variant="secondary" className="text-muted-foreground">Offline</Badge>}
                        {device.status === 'warning' && <Badge variant="destructive" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">Warning</Badge>}
                      </TableCell>
                      <TableCell className="text-right font-mono flex items-center justify-end gap-2">
                        {device.currentWatts} W
                        {device.currentWatts > 0 && <Zap className="h-3 w-3 text-amber-400" />}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(device.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
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
