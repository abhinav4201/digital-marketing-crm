import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";

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
    await adminAuth.verifyIdToken(idToken);

    // 2. Fetch all requests that have selected services
    const requestsSnapshot = await adminDb
      .collection("requests")
      .where("selectedServices", "!=", null)
      .get();

    // 3. Process the data to count each service
    const serviceCounts: { [key: string]: number } = {};

    requestsSnapshot.forEach((doc) => {
      const services = doc.data().selectedServices;
      if (Array.isArray(services)) {
        services.forEach((service) => {
          serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        });
      }
    });

    // 4. Format the data for the chart
    const serviceData = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by most popular

    return NextResponse.json({ serviceData }, { status: 200 });
  } catch (error) {
    console.error("API Service Analytics Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
