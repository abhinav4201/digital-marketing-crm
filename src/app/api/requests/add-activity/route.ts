/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
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
    // 1. Authenticate the user
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // 2. Get user details from Firestore
    const userDocRef = adminDb.collection("users").doc(uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    const userData = userDoc.data();
    const actorName = userData?.displayName || userData?.email;
    const actorRole = userData?.role || "user";

    // 3. Get request body
    const { requestId, message } = await req.json();

    if (!requestId || !message) {
      return NextResponse.json(
        { error: "Missing requestId or message" },
        { status: 400 }
      );
    }

    // 4. Add the new activity to the subcollection
    const activityRef = adminDb
      .collection("requests")
      .doc(requestId)
      .collection("activities");

    await activityRef.add({
      message,
      actorId: uid,
      actorName,
      actorRole,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "Activity logged successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Route Error:", error);
    if (error.code === "auth/id-token-expired") {
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
