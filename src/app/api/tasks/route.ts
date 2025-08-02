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
    // 1. Authenticate and authorize admin/sales_rep
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

    // 2. Get task data from request body
    const { requestId, title, assignedTo } = await req.json();
    if (!requestId || !title || !assignedTo) {
      return NextResponse.json(
        { error: "Missing requestId, title, or assignedTo" },
        { status: 400 }
      );
    }

    // 3. Add new task to the TOP-LEVEL 'tasks' collection
    const newTaskRef = await adminDb.collection("tasks").add({
      requestId,
      title,
      assignedTo, // The UID of the user the task is for
      isComplete: false,
      createdAt: Timestamp.now(),
      createdBy: decodedToken.uid, // The UID of the user who created the task
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
