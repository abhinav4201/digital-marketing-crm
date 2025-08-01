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
    // 1. Authenticate the user
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid } = decodedToken;

    // 2. Find today's clock-in record
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendanceQuery = await adminDb
      .collection("attendance")
      .where("userId", "==", uid)
      .where("createdAt", ">=", Timestamp.fromDate(today))
      .where("createdAt", "<", Timestamp.fromDate(tomorrow))
      .limit(1)
      .get();

    if (attendanceQuery.empty) {
      return NextResponse.json(
        { error: "No clock-in record found for today." },
        { status: 404 }
      );
    }

    const attendanceDoc = attendanceQuery.docs[0];
    if (attendanceDoc.data().clockOutTime) {
      return NextResponse.json(
        { error: "You have already clocked out for today." },
        { status: 409 }
      );
    }

    // 3. Update the record with clock-out time
    const clockOutTime = Timestamp.now();
    await attendanceDoc.ref.update({
      clockOutTime: clockOutTime,
    });

    return NextResponse.json(
      {
        message: "Clocked out successfully.",
        clockOutTime: clockOutTime.toDate(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Clock-Out Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
