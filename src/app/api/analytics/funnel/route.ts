import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";

// These are the defined stages for our funnel report.
const FUNNEL_STAGES = [
  "Service Selection Pending",
  "Services Selected",
  "Quotation Sent",
  "Revision Requested",
  "Project Approved",
];

export async function GET(req: NextRequest) {
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK not initialized.");
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

    // 2. Fetch all requests
    const requestsSnapshot = await adminDb.collection("requests").get();

    // 3. Process the data to count leads in each stage
    const funnelData = FUNNEL_STAGES.map((stage) => ({
      name: stage,
      count: 0,
    }));

    requestsSnapshot.forEach((doc) => {
      const status = doc.data().status || "Service Selection Pending";
      const stageIndex = funnelData.findIndex((item) => item.name === status);
      if (stageIndex > -1) {
        funnelData[stageIndex].count++;
      }
    });

    return NextResponse.json({ funnelData }, { status: 200 });
  } catch (error) {
    console.error("API Funnel Analytics Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
