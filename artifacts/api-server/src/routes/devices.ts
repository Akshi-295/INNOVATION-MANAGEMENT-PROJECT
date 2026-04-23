import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, devicesTable } from "@workspace/db";
import {
  CreateDeviceBody,
  GetDeviceParams,
  UpdateDeviceParams,
  UpdateDeviceBody,
  DeleteDeviceParams,
  ListDevicesResponse,
  GetDeviceResponse,
  UpdateDeviceResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/devices", async (_req, res): Promise<void> => {
  const devices = await db.select().from(devicesTable).orderBy(devicesTable.createdAt);
  res.json(ListDevicesResponse.parse(devices));
});

router.post("/devices", async (req, res): Promise<void> => {
  const parsed = CreateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [device] = await db
    .insert(devicesTable)
    .values({ ...parsed.data, currentWatts: 0, status: "online" })
    .returning();
  res.status(201).json(GetDeviceResponse.parse(device));
});

router.get("/devices/:id", async (req, res): Promise<void> => {
  const params = GetDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [device] = await db.select().from(devicesTable).where(eq(devicesTable.id, params.data.id));
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  res.json(GetDeviceResponse.parse(device));
});

router.put("/devices/:id", async (req, res): Promise<void> => {
  const params = UpdateDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDeviceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [device] = await db
    .update(devicesTable)
    .set(parsed.data)
    .where(eq(devicesTable.id, params.data.id))
    .returning();
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  res.json(UpdateDeviceResponse.parse(device));
});

router.delete("/devices/:id", async (req, res): Promise<void> => {
  const params = DeleteDeviceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [device] = await db
    .delete(devicesTable)
    .where(eq(devicesTable.id, params.data.id))
    .returning();
  if (!device) {
    res.status(404).json({ error: "Device not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
