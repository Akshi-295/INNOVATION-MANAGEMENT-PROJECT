import { useState } from "react";
import { useListAlerts, useResolveAlert, useDismissAlert, getListAlertsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, X, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Alerts() {
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const { data: alerts, isLoading } = useListAlerts(statusFilter !== "all" ? { status: statusFilter as any } : {});
  
  const resolveAlert = useResolveAlert();
  const dismissAlert = useDismissAlert();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = async (id: number, action: 'resolve' | 'dismiss') => {
    try {
      if (action === 'resolve') {
        await resolveAlert.mutateAsync({ id });
        toast({ title: "Alert resolved" });
      } else {
        await dismissAlert.mutateAsync({ id });
        toast({ title: "Alert dismissed" });
      }
      queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (e) {
      toast({ title: "Error", description: `Failed to ${action} alert`, variant: "destructive" });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Anomaly Alerts</h1>
          <p className="text-muted-foreground mt-1">Review and action detected energy waste events.</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
            <SelectItem value="all">All Alerts</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-card">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))
        ) : !alerts || alerts.length === 0 ? (
          <Card className="bg-card border-dashed">
            <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Info className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p>No {statusFilter !== 'all' ? statusFilter : ''} alerts found.</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <Card key={alert.id} className={`bg-card overflow-hidden transition-colors ${alert.status === 'active' ? 'border-l-4 border-l-destructive' : ''}`}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center p-6 gap-4">
                  <div className={`p-3 rounded-full flex-shrink-0 ${getSeverityColor(alert.severity).split(' ')[0]}`}>
                    <AlertTriangle className={`h-6 w-6 ${getSeverityColor(alert.severity).split(' ')[1]}`} />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{alert.deviceName}</h3>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {alert.type.replace(/_/g, ' ')}
                      </Badge>
                      {alert.status !== 'active' && (
                        <Badge variant="outline" className="text-muted-foreground">
                          {alert.status.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{alert.message}</p>
                    <div className="flex gap-4 text-xs font-mono text-muted-foreground pt-2">
                      <span>Waste: {alert.estimatedWasteKwh.toFixed(1)} kWh</span>
                      <span>Cost: ${alert.estimatedCostUsd.toFixed(2)}</span>
                      <span>Detected: {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  {alert.status === 'active' && (
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => handleAction(alert.id, 'resolve')}>
                        <Check className="mr-2 h-4 w-4" /> Resolve
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 sm:flex-none text-muted-foreground hover:text-foreground" onClick={() => handleAction(alert.id, 'dismiss')}>
                        <X className="mr-2 h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
