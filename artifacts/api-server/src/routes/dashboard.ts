import { Router, type IRouter } from "express";
import { eq, sql, gte, and } from "drizzle-orm";
import { db, devicesTable, readingsTable, alertsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetConsumptionChartQueryParams,
  GetConsumptionChartResponse,
  GetWasteByDeviceResponse,
  GetSavingsSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const RATE_PER_KWH = 0.12;

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const devices = await db.select().from(devicesTable);
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;

  const alerts = await db.select().from(alertsTable);
  const activeAlerts = alerts.filter((a) => a.status === "active").length;
  const criticalAlerts = alerts.filter((a) => a.status === "active" && a.severity === "critical").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayReadings = await db
    .select()
    .from(readingsTable)
    .where(gte(readingsTable.recordedAt, today));

  const totalConsumptionKwhToday = todayReadings.reduce((sum, r) => sum + r.kwhConsumed, 0);
  const wasteKwhToday = todayReadings.filter((r) => r.isWasteful).reduce((sum, r) => sum + r.kwhConsumed, 0);
  const estimatedDailyCostUsd = totalConsumptionKwhToday * RATE_PER_KWH;
  const wastePercentage = totalConsumptionKwhToday > 0 ? (wasteKwhToday / totalConsumptionKwhToday) * 100 : 0;

  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");
  const estimatedMonthlySavingsUsd = resolvedAlerts.reduce((sum, a) => sum + a.estimatedCostUsd, 0);

  res.json(
    GetDashboardSummaryResponse.parse({
      totalDevices,
      onlineDevices,
      activeAlerts,
      criticalAlerts,
      totalConsumptionKwhToday: Math.round(totalConsumptionKwhToday * 100) / 100,
      wasteKwhToday: Math.round(wasteKwhToday * 100) / 100,
      estimatedDailyCostUsd: Math.round(estimatedDailyCostUsd * 100) / 100,
      estimatedMonthlySavingsUsd: Math.round(estimatedMonthlySavingsUsd * 100) / 100,
      wastePercentage: Math.round(wastePercentage * 10) / 10,
    })
  );
});

router.get("/dashboard/consumption-chart", async (req, res): Promise<void> => {
  const queryParsed = GetConsumptionChartQueryParams.safeParse(req.query);
  const period = queryParsed.success ? (queryParsed.data.period ?? "week") : "week";

  const now = new Date();
  const points: { label: string; from: Date; to: Date }[] = [];

  if (period === "day") {
    for (let i = 23; i >= 0; i--) {
      const from = new Date(now);
      from.setHours(now.getHours() - i, 0, 0, 0);
      const to = new Date(from);
      to.setHours(from.getHours() + 1, 0, 0, 0);
      points.push({ label: `${from.getHours().toString().padStart(2, "0")}:00`, from, to });
    }
  } else if (period === "week") {
    for (let i = 6; i >= 0; i--) {
      const from = new Date(now);
      from.setDate(now.getDate() - i);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 1);
      points.push({
        label: from.toLocaleDateString("en-US", { weekday: "short" }),
        from,
        to,
      });
    }
  } else {
    for (let i = 29; i >= 0; i--) {
      const from = new Date(now);
      from.setDate(now.getDate() - i);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(from.getDate() + 1);
      points.push({
        label: `${from.getMonth() + 1}/${from.getDate()}`,
        from,
        to,
      });
    }
  }

  const allReadings = await db.select().from(readingsTable);

  const chartData = points.map(({ label, from, to }) => {
    const relevant = allReadings.filter(
      (r) => r.recordedAt >= from && r.recordedAt < to
    );
    const totalKwh = relevant.reduce((sum, r) => sum + r.kwhConsumed, 0);
    const wasteKwh = relevant.filter((r) => r.isWasteful).reduce((sum, r) => sum + r.kwhConsumed, 0);
    return {
      label,
      totalKwh: Math.round(totalKwh * 100) / 100,
      wasteKwh: Math.round(wasteKwh * 100) / 100,
      costUsd: Math.round(totalKwh * RATE_PER_KWH * 100) / 100,
    };
  });

  res.json(GetConsumptionChartResponse.parse(chartData));
});

router.get("/dashboard/waste-by-device", async (_req, res): Promise<void> => {
  const devices = await db.select().from(devicesTable);
  const readings = await db.select().from(readingsTable);

  const wasteByDevice = devices.map((device) => {
    const deviceReadings = readings.filter((r) => r.deviceId === device.id && r.isWasteful);
    const wasteKwh = deviceReadings.reduce((sum, r) => sum + r.kwhConsumed, 0);
    const totalKwh = readings.filter((r) => r.deviceId === device.id).reduce((sum, r) => sum + r.kwhConsumed, 0);
    const wastePercentage = totalKwh > 0 ? (wasteKwh / totalKwh) * 100 : 0;
    return {
      deviceId: device.id,
      deviceName: device.name,
      location: device.location,
      wasteKwh: Math.round(wasteKwh * 100) / 100,
      wastePercentage: Math.round(wastePercentage * 10) / 10,
      estimatedWasteCostUsd: Math.round(wasteKwh * RATE_PER_KWH * 100) / 100,
    };
  });

  wasteByDevice.sort((a, b) => b.wasteKwh - a.wasteKwh);
  res.json(GetWasteByDeviceResponse.parse(wasteByDevice));
});

router.get("/dashboard/savings", async (_req, res): Promise<void> => {
  const resolvedAlerts = await db
    .select()
    .from(alertsTable)
    .where(eq(alertsTable.status, "resolved"));

  const totalSavedKwh = resolvedAlerts.reduce((sum, a) => sum + a.estimatedWasteKwh, 0);
  const totalSavedUsd = resolvedAlerts.reduce((sum, a) => sum + a.estimatedCostUsd, 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const thisMonthAlerts = resolvedAlerts.filter(
    (a) => a.resolvedAt && a.resolvedAt >= thisMonthStart
  );
  const lastMonthAlerts = resolvedAlerts.filter(
    (a) => a.resolvedAt && a.resolvedAt >= lastMonthStart && a.resolvedAt < thisMonthStart
  );

  const thisMonthSavedUsd = thisMonthAlerts.reduce((sum, a) => sum + a.estimatedCostUsd, 0);
  const lastMonthSavedUsd = lastMonthAlerts.reduce((sum, a) => sum + a.estimatedCostUsd, 0);
  const savingsTrend =
    lastMonthSavedUsd > 0
      ? ((thisMonthSavedUsd - lastMonthSavedUsd) / lastMonthSavedUsd) * 100
      : 0;

  res.json(
    GetSavingsSummaryResponse.parse({
      totalSavedKwh: Math.round(totalSavedKwh * 100) / 100,
      totalSavedUsd: Math.round(totalSavedUsd * 100) / 100,
      resolvedAlertsCount: resolvedAlerts.length,
      thisMonthSavedUsd: Math.round(thisMonthSavedUsd * 100) / 100,
      lastMonthSavedUsd: Math.round(lastMonthSavedUsd * 100) / 100,
      savingsTrend: Math.round(savingsTrend * 10) / 10,
    })
  );
});

export default router;
