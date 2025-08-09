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
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // Verify user is an admin or manager
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    if (
      !userData ||
      (userData.role !== "admin" && userData.role !== "manager")
    ) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions." },
        { status: 403 }
      );
    }

    const { attendanceId, requestId, newStatus } = await req.json();

    if (!attendanceId || !requestId || !newStatus) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (newStatus !== "approved" && newStatus !== "denied") {
      return NextResponse.json(
        { error: "Invalid status provided." },
        { status: 400 }
      );
    }

    const requestRef = adminDb
      .collection("attendance")
      .doc(attendanceId)
      .collection("approvalRequests")
      .doc(requestId);

    await requestRef.update({
      status: newStatus,
      actionTakenBy: uid,
      actionTakenAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "Request status updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Approve Request Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
