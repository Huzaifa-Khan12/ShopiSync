import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  errorFormat: "pretty",
});

async function main() {
  try {
    console.log("Hello world");

    const testOrder = await prisma.order.create({
      data: {
        orderId: "12345",
        orderNumber: "ORD-67890",
        orderDateTime: new Date(),
      },
    });

    console.log("Test Order Created:", testOrder);
  } catch (error) {
    console.error("Error creating order:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
