/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
import { Timestamp, Firestore } from "firebase-admin/firestore";

// Define a type for the lead data to ensure type safety
interface LeadData {
  id: string;
  email?: string;
  name?: string;
  company?: string;
  // Add other potential fields if needed for templates
  [key: string]: any;
}

// Activity logging helper
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
  await activityRef.add({ ...logData, createdAt: Timestamp.now() });
};

export async function POST(req: NextRequest) {
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
    const adminData = adminDoc.data();
    if (!adminData || adminData.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    // 2. Get data from request body
    const { targetStatus, template } = await req.json();
    if (!targetStatus || !template || !template.subject || !template.body) {
      return NextResponse.json(
        { error: "Missing targetStatus or template data" },
        { status: 400 }
      );
    }

    // 3. Find all requests (leads) with the target status
    const requestsSnapshot = await adminDb
      .collection("requests")
      .where("status", "==", targetStatus)
      .get();
    if (requestsSnapshot.empty) {
      return NextResponse.json(
        { message: "No leads found in the target stage. Nothing to send." },
        { status: 200 }
      );
    }

    // **FIX:** Explicitly cast the document data to our LeadData interface
    const leads: LeadData[] = requestsSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as LeadData)
    );
    const adminName = adminData.displayName || adminData.email;

    // 4. Loop through each lead, process template, and "send" email
    for (const lead of leads) {
      const clientEmail = lead.email;
      if (!clientEmail) continue; // Skip if no email

      // Replace placeholders in template for each lead
      let processedBody = template.body.replace(
        /{{name}}/g,
        lead.name || "there"
      );
      if (lead.company) {
        processedBody = processedBody.replace(/{{company}}/g, lead.company);
      }

      // --- !!! EMAIL SENDING LOGIC (SIMULATION) !!! ---
      console.log("--- SIMULATING CAMPAIGN EMAIL ---");
      console.log(`TO: ${clientEmail}`);
      console.log(`SUBJECT: ${template.subject}`);
      console.log(`BODY: ${processedBody}`);
      console.log("---------------------------------");
      // --- !!! END OF SIMULATION !!! ---

      // Log this communication to each lead's activity timeline
      const logMessage = `Admin sent campaign email with subject: "${template.subject}"`;
      await logActivityInDb(adminDb, lead.id, {
        message: logMessage,
        actorId: decodedToken.uid,
        actorName: adminName,
        actorRole: "admin",
      });
    }

    return NextResponse.json(
      { message: `Campaign sent successfully to ${leads.length} lead(s).` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Campaign Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
