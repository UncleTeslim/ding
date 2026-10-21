import { isIP } from "node:net";
import type { Request } from "express";

export function getClientAddress(req: Pick<Request, "get" | "ip">) {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    const railwayAddress = req.get("x-real-ip")?.trim();
    if (railwayAddress && isIP(railwayAddress)) return railwayAddress;
  }

  return req.ip || "unknown";
}
