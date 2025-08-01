import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
import { Timestamp, Firestore } from "firebase-admin/firestore";

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
    const { requestId, subject, body } = await req.json();
    if (!requestId || !subject || !body) {
      return NextResponse.json(
        { error: "Missing requestId, subject, or body" },
        { status: 400 }
      );
    }

    // 3. Get client's email from the request document
    const requestDoc = await adminDb
      .collection("requests")
      .doc(requestId)
      .get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const clientEmail = requestDoc.data()?.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: "Client email not found" },
        { status: 400 }
      );
    }

    // --- !!! EMAIL SENDING LOGIC WOULD GO HERE !!! ---
    // In a real application, you would use a service like Nodemailer or an API like SendGrid.
    // For now, we simulate the action by logging to the console.
    console.log("--- SIMULATING EMAIL ---");
    console.log(`TO: ${clientEmail}`);
    console.log(`FROM: admin@digital-agency.com`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY: ${body}`);
    console.log("------------------------");
    // --- !!! END OF SIMULATION !!! ---

    // 5. Log this communication to the activity timeline
    const adminName = adminData.displayName || adminData.email;
    const logMessage = `Admin sent an email with subject: "${subject}"`;
    await logActivityInDb(adminDb, requestId, {
      message: logMessage,
      actorId: decodedToken.uid,
      actorName: adminName,
      actorRole: "admin",
    });

    return NextResponse.json(
      { message: "Email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Send Email Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
