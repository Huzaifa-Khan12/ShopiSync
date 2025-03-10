import express from "express";
//for Shopify webhook verification (HMAC signature check).
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import getRawBody from "raw-body";

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

//function to authenticate incoming data from webhook (webhook secret matching)
async function verifyShopifyWebhook(req, rawBody) {
  //Getting the HMAC signature from the webhook header
  const hmac = req.headers["x-shopify-hmac-sha256"];
  console.log("🔹 Shopify sent HMAC:", hmac);

  // console.log("Type of req body: ", typeof req.body);

  //Generates HMAC using the secret key stored in .env
  const hash = crypto
    .createHmac("sha256", process.env.SHOPIFY_SECRET)
    .update(rawBody)
    .digest("base64");
  console.log("🔹 Manually computed HMAC:", hash);

  //return true or false based on if hmac matches hash
  return crypto.timingSafeEqual(
    Buffer.from(hmac, "base64"),
    Buffer.from(hash, "base64")
  );
}

app.post("/webhook/orders/create", async (req, res) => {
  const rawBody = await getRawBody(req, { encoding: "utf8" });

  if (!(await verifyShopifyWebhook(req, rawBody))) {
    return res.status(401).send("Unauthorized webhook");
  }

  const orderData = JSON.parse(rawBody);

  //extract relevant data from order webhook
  const { id, order_number, created_at } = orderData;

  //Storing the data in MongoDB using Primsa
  try {
    const newOrder = await prisma.order.create({
      data: {
        orderId: id.toString(),
        orderNumber: order_number.toString(),
        orderDateTime: new Date(created_at),
      },
    });

    console.log("Order Saved: ", newOrder);
    res.status(200).send("Webhook processed");
  } catch (error) {
    console.error("Error saving order: ", error);
    res.status(500).send("Error Saving Order");
  }
});

app.get("/home", (req, res) => {
  res.send("Hello world");
});

app.listen(port, () => {
  console.log("Server running on port: ", port);
});
