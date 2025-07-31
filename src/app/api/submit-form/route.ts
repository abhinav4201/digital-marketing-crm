/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../lib/firestore.server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin has not been initialized.");
    return NextResponse.json(
      { error: "Internal Server Error: Server configuration issue." },
      { status: 500 }
    );
  }

  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedToken;

    const isAdmin = email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    if (!isAdmin) {
      const twentyFourHoursAgo = Timestamp.fromMillis(
        Date.now() - 24 * 60 * 60 * 1000
      );
      const requestsSnapshot = await adminDb
        .collection("requests")
        .where("userId", "==", uid)
        .where("createdAt", ">=", twentyFourHoursAgo)
        .get();

      if (requestsSnapshot.size >= 3) {
        return NextResponse.json(
          { error: "You have exceeded the daily submission limit." },
          { status: 429 }
        );
      }
    }

    const formData = await req.json();

    const newRequestRef = await adminDb.collection("requests").add({
      ...formData,
      userId: uid,
      createdAt: Timestamp.now(),
      status: "Service Selection Pending", // Set initial status
    });

    // Return the ID of the new document
    return NextResponse.json(
      { message: "Form submitted successfully", requestId: newRequestRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Route Error:", error);
    if (
      error instanceof Error &&
      "code" in error &&
      (error as any).code === "auth/id-token-expired"
    ) {
      return NextResponse.json(
        { error: "Authentication token expired. Please sign in again." },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
