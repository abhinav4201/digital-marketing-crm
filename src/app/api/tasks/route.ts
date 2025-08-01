import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../lib/firestore.server";
import { Timestamp } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  if (!adminAuth || !adminDb) {
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

    // 2. Get task data from request body
    const { requestId, title } = await req.json();
    if (!requestId || !title) {
      return NextResponse.json(
        { error: "Missing requestId or title" },
        { status: 400 }
      );
    }

    // 3. Add new task to the 'tasks' subcollection of the request
    const newTaskRef = await adminDb
      .collection("requests")
      .doc(requestId)
      .collection("tasks")
      .add({
        title,
        isComplete: false,
        createdAt: Timestamp.now(),
        createdBy: decodedToken.uid,
      });

    return NextResponse.json(
      { message: "Task created successfully", taskId: newTaskRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Create Task Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
