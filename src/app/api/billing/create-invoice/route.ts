import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
import Stripe from "stripe";

// **THE FIX:** Initialize Stripe without a hardcoded apiVersion.
// The library will default to the latest stable version.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  if (!adminAuth || !adminDb) {
    return NextResponse.json(
      { error: "Server configuration issue." },
      { status: 500 }
    );
  }

  try {
    // 1. Authenticate and authorize admin
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    await adminAuth.verifyIdToken(idToken);

    // 2. Get data from request body
    const { requestId, price, description } = await req.json();
    if (!requestId || !price || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Get client's data from the request document
    const requestRef = adminDb.collection("requests").doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const requestData = requestDoc.data()!;

    // 4. Create a Customer in Stripe
    const customer = await stripe.customers.create({
      name: requestData.name,
      email: requestData.email,
      metadata: { firestore_request_id: requestId },
    });

    // 5. Create an Invoice Item
    await stripe.invoiceItems.create({
      customer: customer.id,
      // Price is in the smallest currency unit (e.g., cents for USD, paise for INR)
      amount: price * 100,
      currency: "inr", // Change currency as needed
      description: description,
    });

    // 6. Create the Invoice itself
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: 30,
      auto_advance: true, // Automatically finalizes the invoice
    });

    // 7. Store invoice data back to Firestore (optional but recommended)
    await requestRef.collection("invoices").add({
      stripeInvoiceId: invoice.id,
      invoiceUrl: invoice.hosted_invoice_url,
      status: invoice.status,
      amount: price,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Invoice created successfully",
        invoiceUrl: invoice.hosted_invoice_url,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Create Invoice Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
