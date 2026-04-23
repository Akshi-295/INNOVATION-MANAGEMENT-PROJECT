import { useGetDashboardSummary, useGetConsumptionChart, useGetWasteByDevice, useListAlerts, useGetSavingsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, BatteryWarning, CheckCircle, Cpu, DollarSign, PlugZap, TrendingDown } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: chartData, isLoading: loadingChart } = useGetConsumptionChart();
  const { data: wasteData, isLoading: loadingWaste } = useGetWasteByDevice();
  const { data: alerts, isLoading: loadingAlerts } = useListAlerts({ status: "active" });
  const { data: savings, isLoading: loadingSavings } = useGetSavingsSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Operations Console</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="mr-1 h-3 w-3" /> System Nominal
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Consumption Today</CardTitle>
            <PlugZap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{summary?.totalConsumptionKwhToday.toFixed(1)} kWh</div>
                <p className="text-xs text-muted-foreground mt-1">Across {summary?.onlineDevices} online devices</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Energy Waste Detected</CardTitle>
            <BatteryWarning className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono text-destructive">{summary?.wasteKwhToday.toFixed(1)} kWh</div>
                <p className="text-xs text-muted-foreground mt-1">{summary?.wastePercentage.toFixed(1)}% of total consumption</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. Monthly Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono text-emerald-500">${summary?.estimatedMonthlySavingsUsd.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">If all active alerts are resolved</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold font-mono">{summary?.activeAlerts}</div>
                <p className="text-xs text-muted-foreground mt-1">{summary?.criticalAlerts} critical anomalies</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4 bg-card">
          <CardHeader>
            <CardTitle>Consumption & Waste Trend</CardTitle>
            <CardDescription>7-day energy usage breakdown in kWh</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChart ? <Skeleton className="h-[300px] w-full" /> : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData || []}>
                    <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="totalKwh" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="wasteKwh" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-3 bg-card">
          <CardHeader>
            <CardTitle>Top Waste Producers</CardTitle>
            <CardDescription>Devices generating the most flaggable waste</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingWaste ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : wasteData?.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">No waste detected</div>
            ) : (
              <div className="space-y-4">
                {wasteData?.slice(0, 5).map((device) => (
                  <div key={device.deviceId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center">
                        <Cpu className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{device.deviceName}</div>
                        <div className="text-xs text-muted-foreground">{device.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono">{device.wasteKwh.toFixed(1)} kWh</div>
                      <div className="text-xs text-muted-foreground">${device.estimatedWasteCostUsd.toFixed(2)} est.</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Anomalies requiring immediate attention</CardDescription>
          </div>
          <Link href="/alerts" className="text-sm text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : alerts?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">All systems nominal. No active alerts.</div>
          ) : (
            <div className="space-y-4">
              {alerts?.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-background/50">
                  <div className="flex items-center gap-4">
                    {alert.severity === 'critical' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : alert.severity === 'high' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Activity className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <div className="text-sm font-medium flex items-center gap-2">
                        {alert.deviceName}
                        <Badge variant="outline" className="text-[10px] uppercase py-0 px-1">{alert.type.replace(/_/g, ' ')}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{alert.message}</div>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-mono text-destructive">{alert.estimatedWasteKwh.toFixed(1)} kWh wasted</div>
                    <div className="text-xs text-muted-foreground">Cost: ${alert.estimatedCostUsd.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
