/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";
// import { doc, updateDoc } from "firebase/firestore";

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

    // Check if the user making the request is an admin
    const adminUserRecord = await adminAuth.getUser(decodedToken.uid);
    const adminCustomClaims = adminUserRecord.customClaims || {};
    // A more robust way is to check a custom claim or a field in the admin's own user document
    // For now, we'll check the role from the 'users' collection for simplicity.
    const adminDocRef = adminDb.collection("users").doc(decodedToken.uid);
    const adminDoc = await adminDocRef.get();

    if (!adminDoc.exists || adminDoc.data()?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Not an admin" },
        { status: 403 }
      );
    }

    const { userIdToUpdate, newRole } = await req.json();

    if (!userIdToUpdate || !newRole) {
      return NextResponse.json(
        { error: "Missing userIdToUpdate or newRole" },
        { status: 400 }
      );
    }

    // Roles that an admin can assign
    const validRoles = ["admin", "sales_rep", "support_agent", "user"];
    if (!validRoles.includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid role specified." },
        { status: 400 }
      );
    }

    const userDocRef = adminDb.collection("users").doc(userIdToUpdate);

    // Update the role in Firestore
    await userDocRef.update({ role: newRole });

    return NextResponse.json(
      { message: `User role updated successfully to ${newRole}` },
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
