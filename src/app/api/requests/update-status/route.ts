/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
import { Timestamp, Firestore } from "firebase-admin/firestore";

// Helper to log activity, accepting a Firestore instance to ensure it's not undefined.
const logActivityInDb = async (
  db: Firestore,
  requestId: string,
  logData: {
    message: string;
    actorId: string;
    actorName: string;
    actorRole: string;
  }
) => {
  const activityRef = db
    .collection("requests")
    .doc(requestId)
    .collection("activities");
  await activityRef.add({
    ...logData,
    createdAt: Timestamp.now(),
  });
};

export async function POST(req: NextRequest) {
  // This check at the top ensures adminAuth and adminDb are defined for the rest of the function.
  if (!adminAuth || !adminDb) {
    console.error(
      "Firebase Admin SDK has not been initialized. Check server environment variables."
    );
    return NextResponse.json(
      { error: "Internal Server Error: Server configuration is incomplete." },
      { status: 500 }
    );
  }

  try {
    // 1. Authenticate the user and check their role
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const idToken = authorization.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);

     const userDoc = await adminDb
       .collection("users")
       .doc(decodedToken.uid)
       .get();
     const userData = userDoc.data();
     if (
       !userData ||
       (userData.role !== "admin" && userData.role !== "sales_rep")
     ) {
       return NextResponse.json(
         { error: "Forbidden: Insufficient permissions" },
         { status: 403 }
       );
     }

    // 2. Get request body
    const { requestId, newStatus, oldStatus } = await req.json();

    if (!requestId || !newStatus || !oldStatus) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // 3. Update the request document status
    const requestRef = adminDb.collection("requests").doc(requestId);
    await requestRef.update({
      status: newStatus,
      lastUpdatedBy: "admin",
    });

    // 4. Log this action to the activity timeline
    const actorName = userData.displayName || userData.email;
    const actorRole = userData.role; // Use the actual role for logging
    await logActivityInDb(adminDb, requestId, {
      message: `${
        actorRole === "admin" ? "Admin" : "Sales Rep"
      } changed status from "${oldStatus}" to "${newStatus}".`,
      actorId: decodedToken.uid,
      actorName: actorName,
      actorRole: actorRole,
    });

    return NextResponse.json(
      { message: "Status updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
