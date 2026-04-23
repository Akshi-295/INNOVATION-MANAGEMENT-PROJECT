import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, alertsTable, devicesTable } from "@workspace/db";
import {
  ListAlertsQueryParams,
  ListAlertsResponse,
  ResolveAlertParams,
  DismissAlertParams,
  ResolveAlertResponse,
  DismissAlertResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const queryParsed = ListAlertsQueryParams.safeParse(req.query);
  const status = queryParsed.success ? queryParsed.data.status : undefined;

  const rows = await db
    .select({
      id: alertsTable.id,
      deviceId: alertsTable.deviceId,
      deviceName: devicesTable.name,
      type: alertsTable.type,
      severity: alertsTable.severity,
      message: alertsTable.message,
      status: alertsTable.status,
      estimatedWasteKwh: alertsTable.estimatedWasteKwh,
      estimatedCostUsd: alertsTable.estimatedCostUsd,
      createdAt: alertsTable.createdAt,
      resolvedAt: alertsTable.resolvedAt,
    })
    .from(alertsTable)
    .innerJoin(devicesTable, eq(alertsTable.deviceId, devicesTable.id))
    .where(status != null ? eq(alertsTable.status, status) : undefined)
    .orderBy(alertsTable.createdAt);

  res.json(ListAlertsResponse.parse(rows));
});

router.put("/alerts/:id/resolve", async (req, res): Promise<void> => {
  const params = ResolveAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ status: "resolved", resolvedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const [row] = await db
    .select({
      id: alertsTable.id,
      deviceId: alertsTable.deviceId,
      deviceName: devicesTable.name,
      type: alertsTable.type,
      severity: alertsTable.severity,
      message: alertsTable.message,
      status: alertsTable.status,
      estimatedWasteKwh: alertsTable.estimatedWasteKwh,
      estimatedCostUsd: alertsTable.estimatedCostUsd,
      createdAt: alertsTable.createdAt,
      resolvedAt: alertsTable.resolvedAt,
    })
    .from(alertsTable)
    .innerJoin(devicesTable, eq(alertsTable.deviceId, devicesTable.id))
    .where(eq(alertsTable.id, alert.id));

  res.json(ResolveAlertResponse.parse(row));
});

router.put("/alerts/:id/dismiss", async (req, res): Promise<void> => {
  const params = DismissAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [alert] = await db
    .update(alertsTable)
    .set({ status: "dismissed", resolvedAt: new Date() })
    .where(eq(alertsTable.id, params.data.id))
    .returning();

  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }

  const [row] = await db
    .select({
      id: alertsTable.id,
      deviceId: alertsTable.deviceId,
      deviceName: devicesTable.name,
      type: alertsTable.type,
      severity: alertsTable.severity,
      message: alertsTable.message,
      status: alertsTable.status,
      estimatedWasteKwh: alertsTable.estimatedWasteKwh,
      estimatedCostUsd: alertsTable.estimatedCostUsd,
      createdAt: alertsTable.createdAt,
      resolvedAt: alertsTable.resolvedAt,
    })
    .from(alertsTable)
    .innerJoin(devicesTable, eq(alertsTable.deviceId, devicesTable.id))
    .where(eq(alertsTable.id, alert.id));

  res.json(DismissAlertResponse.parse(row));
});

export default router;
