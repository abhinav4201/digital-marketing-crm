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
    await adminAuth.verifyIdToken(idToken);

    const { attendanceId, breakType, action } = await req.json(); // action is 'start' or 'end'

    if (!attendanceId || !breakType || !action) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const attendanceRef = adminDb.collection("attendance").doc(attendanceId);
    const now = Timestamp.now();
    let updateData = {};

    if (action === "start") {
      updateData = {
        [`${breakType}BreakStartTime`]: now,
        status: `on_${breakType}`,
      };
    } else if (action === "end") {
      updateData = {
        [`${breakType}BreakEndTime`]: now,
        status: "working",
      };
    } else {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    await attendanceRef.update(updateData);

    return NextResponse.json(
      { message: `Break ${action} successful.` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Break Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
