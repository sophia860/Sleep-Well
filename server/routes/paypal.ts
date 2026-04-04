import type { Express } from "express";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { editorialWaitlist } from "@shared/schema";

export function registerPaypalRoutes(app: Express) {
  app.post("/api/paypal/create-order", async (req: any, res) => {
    try {
      const { waitlistId, writingId, tier, amount } = req.body; const TIER_PRICES: Record<string, number> = { priority: 5, feedback: 7, bundle: 10 }; if (writingId && tier) { if (!TIER_PRICES[tier] || Number(amount) !== TIER_PRICES[tier]) { return res.status(400).json({ message: "Invalid tier or amount" }); } const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64"); const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` }, body: JSON.stringify({ intent: "CAPTURE", purchase_units: [{ amount: { currency_code: "GBP", value: String(amount) }, description: `Page Gallery Editorial: ${tier}` }], }), }); const order = await response.json(); const approvalUrl = order.links?.find((l: any) => l.rel === "approve")?.href; return res.json({ ...order, approvalUrl }); }
      const [entry] = await db.select().from(editorialWaitlist).where(eq(editorialWaitlist.id, waitlistId));
      if (!entry || entry.status !== "invited") {
        return res.status(403).json({ message: "Not eligible for payment" });
      }
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const response = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [{ amount: { currency_code: "GBP", value: String(amount) }, description: "Page Gallery Editorial Services" }],
        }),
      });
      const order = await response.json();
      res.json(order);
    } catch (error) {
      console.error("PayPal create order error:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.post("/api/paypal/capture-order", async (req: any, res) => {
    try {
      const { orderId, waitlistId, writingId, tier, userId } = req.body;
      const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
      const response = await fetch(`https://api-m.paypal.com/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      });
      const capture = await response.json();
      if (capture.status === "COMPLETED" && waitlistId) {
        await db.update(editorialWaitlist)
          .set({ paymentConfirmed: true, paypalOrderId: orderId, status: "paid", updatedAt: new Date() })
          .where(eq(editorialWaitlist.id, waitlistId));
      }
      res.json(capture);
    } catch (error) {
      console.error("PayPal capture error:", error);
      res.status(500).json({ message: "Failed to capture payment" });
    }
  });

}
