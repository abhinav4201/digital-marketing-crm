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

    // 2. Get template data from request body
    const { name, subject, body } = await req.json();
    if (!name || !subject || !body) {
      return NextResponse.json(
        { error: "Missing name, subject, or body" },
        { status: 400 }
      );
    }

    // 3. Add new template to the 'templates' collection
    const newTemplateRef = await adminDb.collection("templates").add({
      name,
      subject,
      body,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: decodedToken.uid,
    });

    return NextResponse.json(
      {
        message: "Template created successfully",
        templateId: newTemplateRef.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Templates Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
