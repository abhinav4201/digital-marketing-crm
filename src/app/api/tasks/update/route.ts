import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";

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
    await adminAuth.verifyIdToken(idToken);

    // 2. Get data from request body
    const { requestId, taskId, isComplete } = await req.json();
    if (!requestId || !taskId || typeof isComplete !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Update the task document
    const taskRef = adminDb
      .collection("requests")
      .doc(requestId)
      .collection("tasks")
      .doc(taskId);

    await taskRef.update({ isComplete });

    return NextResponse.json(
      { message: "Task updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Update Task Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
