/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
import { Timestamp } from "firebase-admin/firestore";

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
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const adminDoc = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // 2. Get data from request body
    const { ticketId, status, priority } = await req.json();
    if (!ticketId || (!status && !priority)) {
      return NextResponse.json(
        { error: "Missing ticketId or update data (status/priority)" },
        { status: 400 }
      );
    }

    // 3. Construct the update payload
    const updatePayload: { [key: string]: any } = {
      lastUpdatedAt: Timestamp.now(),
    };
    if (status) updatePayload.status = status;
    if (priority) updatePayload.priority = priority;

    // 4. Update the ticket document
    const ticketRef = adminDb.collection("tickets").doc(ticketId);
    await ticketRef.update(updatePayload);

    return NextResponse.json(
      { message: "Ticket updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Update Ticket Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
