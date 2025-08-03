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

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 403 });
    }
    const userData = userDoc.data()!;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceQuery = await adminDb
      .collection("attendance")
      .where("userId", "==", uid)
      .where("date", ">=", Timestamp.fromDate(today))
      .where("date", "<", Timestamp.fromDate(tomorrow))
      .get();

    if (!attendanceQuery.empty) {
      return NextResponse.json(
        { error: "You have already clocked in for today." },
        { status: 409 }
      );
    }

    const clockInTime = Timestamp.now();
    await adminDb.collection("attendance").add({
      userId: uid,
      userName: userData.displayName || userData.email,
      date: Timestamp.fromDate(today),
      clockInTime: clockInTime,
      clockOutTime: null,
      status: "Present",
      createdAt: Timestamp.now(), // ADDED FOR CONSISTENCY
    });

    return NextResponse.json(
      {
        message: "Clocked in successfully.",
        clockInTime: clockInTime.toDate(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Clock-In Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
