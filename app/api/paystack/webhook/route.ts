import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest("hex");

  if (hash !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case "charge.success": {
      const { reference } = event.data;
      // Update your payment/donation record
      await prisma.donation.update({
        where: { reference },
        data: {
          status: "completed",
          providerReference: event.data.id.toString(),
          providerResponse: event.data,
          verifiedAt: new Date(),
        },
      });
      break;
    }
    // Handle other events as needed
  }

  return NextResponse.json({ received: true });
}
