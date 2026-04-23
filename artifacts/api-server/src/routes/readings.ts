import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, readingsTable, devicesTable, alertsTable } from "@workspace/db";
import {
  CreateReadingBody,
  ListReadingsQueryParams,
  ListReadingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const RATE_PER_KWH = 0.12;
const WASTEFUL_THRESHOLD_FACTOR = 1.3;

router.get("/readings", async (req, res): Promise<void> => {
  const queryParsed = ListReadingsQueryParams.safeParse(req.query);
  const deviceId = queryParsed.success ? queryParsed.data.deviceId : undefined;
  const limit = queryParsed.success ? (queryParsed.data.limit ?? 50) : 50;

  const rows = await db
    .select({
      id: readingsTable.id,
      deviceId: readingsTable.deviceId,
      deviceName: devicesTable.name,
      wattsConsumed: readingsTable.wattsConsumed,
      kwhConsumed: readingsTable.kwhConsumed,
      isWasteful: readingsTable.isWasteful,
      recordedAt: readingsTable.recordedAt,
    })
    .from(readingsTable)
    .innerJoin(devicesTable, eq(readingsTable.deviceId, devicesTable.id))
    .where(deviceId != null ? eq(readingsTable.deviceId, deviceId) : undefined)
    .orderBy(desc(readingsTable.recordedAt))
    .limit(limit);

  res.json(ListReadingsResponse.parse(rows));
});

router.post("/readings", async (req, res): Promise<void> => {
  const parsed = CreateReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [device] = await db
    .select()
    .from(devicesTable)
    .where(eq(devicesTable.id, parsed.data.deviceId));

  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }

  const wattsConsumed = parsed.data.wattsConsumed;
  const kwhConsumed = wattsConsumed / 1000;
  const isWasteful = wattsConsumed > device.powerRatingW * WASTEFUL_THRESHOLD_FACTOR;

  await db
    .update(devicesTable)
    .set({ currentWatts: wattsConsumed, status: isWasteful ? "warning" : "online" })
    .where(eq(devicesTable.id, device.id));

  const [reading] = await db
    .insert(readingsTable)
    .values({ deviceId: parsed.data.deviceId, wattsConsumed, kwhConsumed, isWasteful })
    .returning();

  if (isWasteful) {
    const wasteKwh = (wattsConsumed - device.powerRatingW) / 1000;
    const severity =
      wasteKwh > 5 ? "critical" : wasteKwh > 2 ? "high" : wasteKwh > 0.5 ? "medium" : "low";
    await db.insert(alertsTable).values({
      deviceId: device.id,
      type: "overconsumption",
      severity,
      message: `${device.name} is consuming ${wattsConsumed}W, exceeding its rated ${device.powerRatingW}W by ${Math.round(((wattsConsumed - device.powerRatingW) / device.powerRatingW) * 100)}%`,
      estimatedWasteKwh: wasteKwh,
      estimatedCostUsd: wasteKwh * RATE_PER_KWH,
    });
  }

  const [joined] = await db
    .select({
      id: readingsTable.id,
      deviceId: readingsTable.deviceId,
      deviceName: devicesTable.name,
      wattsConsumed: readingsTable.wattsConsumed,
      kwhConsumed: readingsTable.kwhConsumed,
      isWasteful: readingsTable.isWasteful,
      recordedAt: readingsTable.recordedAt,
    })
    .from(readingsTable)
    .innerJoin(devicesTable, eq(readingsTable.deviceId, devicesTable.id))
    .where(eq(readingsTable.id, reading.id));

  res.status(201).json(joined);
});

export default router;
