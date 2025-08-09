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
    const { uid } = await adminAuth.verifyIdToken(idToken);

    const { attendanceId, type, reason, managerId } = await req.json();

    if (!attendanceId || !type || !reason || !managerId) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const requestRef = adminDb
      .collection("attendance")
      .doc(attendanceId)
      .collection("approvalRequests")
      .doc();

    await requestRef.set({
      userId: uid,
      type, // 'overtime' or 'extended_break'
      reason,
      managerId,
      status: "pending", // 'pending', 'approved', 'denied'
      createdAt: Timestamp.now(),
    });

    // You can add logic here to trigger a notification to the manager

    return NextResponse.json(
      { message: "Request submitted successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Approval Request Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
