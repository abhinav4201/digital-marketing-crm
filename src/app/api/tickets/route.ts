import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../lib/firestore.server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  if (!adminAuth || !adminDb) {
    console.error("Firebase Admin SDK has not been initialized.");
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

    // 2. Get user details for context
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found." }, { status: 403 });
    }
    const userData = userDoc.data();

    // 3. Get ticket data from request body
    const { subject, description, priority } = await req.json();
    if (!subject || !description || !priority) {
      return NextResponse.json(
        { error: "Missing subject, description, or priority" },
        { status: 400 }
      );
    }

    // 4. Create a new ticket document
    const newTicketRef = await adminDb.collection("tickets").add({
      subject,
      description,
      priority, // e.g., 'Low', 'Medium', 'High'
      status: "Open", // Initial status
      createdAt: Timestamp.now(),
      userId: uid,
      userName: userData?.displayName || userData?.email,
      userEmail: userData?.email,
      lastUpdatedAt: Timestamp.now(),
    });

    return NextResponse.json(
      { message: "Ticket created successfully", ticketId: newTicketRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Create Ticket Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
