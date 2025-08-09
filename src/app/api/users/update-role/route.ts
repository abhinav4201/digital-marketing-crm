/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";

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

    const adminDocRef = adminDb.collection("users").doc(decodedToken.uid);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // --- FIX STARTS HERE ---
    // Destructure all the fields sent from the frontend
    const {
      userIdToUpdate,
      newRole,
      managerId,
      managerName,
      shiftStartTime,
      shiftEndTime,
      lunchBreakStart,
      lunchBreakEnd,
      teaBreakStart,
      teaBreakEnd,
    } = await req.json();

    if (!userIdToUpdate || !newRole) {
      return NextResponse.json(
        { error: "Missing userIdToUpdate or newRole" },
        { status: 400 }
      );
    }

    const validRoles = [
      "admin",
      "sales_rep",
      "support_agent",
      "user",
      "manager",
    ];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(userIdToUpdate);

    // Construct the update payload with all fields
    const updatePayload: { [key: string]: any } = {
      role: newRole,
      managerId: managerId || null,
      managerName: managerName || null,
      shiftStartTime: shiftStartTime || null,
      shiftEndTime: shiftEndTime || null,
      lunchBreakStart: lunchBreakStart || null,
      lunchBreakEnd: lunchBreakEnd || null,
      teaBreakStart: teaBreakStart || null,
      teaBreakEnd: teaBreakEnd || null,
    };

    await userDocRef.update(updatePayload);
    // --- FIX ENDS HERE ---

    return NextResponse.json(
      { message: `User details updated successfully for role: ${newRole}` },
      { status: 200 }
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
