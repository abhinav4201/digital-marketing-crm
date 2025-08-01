/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../lib/firestore.server";

// This function contains our rule-based "AI" scoring model.
const calculateScore = (
  leadData: any
): { score: number; reasoning: string[] } => {
  let score = 0;
  const reasoning: string[] = [];

  // Rule 1: Score based on selected services (more services = higher interest)
  if (leadData.selectedServices && leadData.selectedServices.length > 0) {
    const serviceScore = leadData.selectedServices.length * 10;
    score += serviceScore;
    reasoning.push(
      `+${serviceScore} points for ${leadData.selectedServices.length} selected service(s).`
    );
  }

  // Rule 2: Score based on message length (longer message = more detailed request)
  if (leadData.message && leadData.message.length > 50) {
    score += 15;
    reasoning.push("+15 points for a detailed message.");
  }

  // Rule 3: Score based on company name (B2B leads are often higher value)
  if (leadData.company) {
    score += 20;
    reasoning.push("+20 points for providing a company name (B2B lead).");
  }

  // Rule 4: Score based on specific keywords in the message
  const highValueKeywords = ["urgent", "budget", "quote", "timeline", "asap"];
  const messageText = leadData.message?.toLowerCase() || "";
  highValueKeywords.forEach((keyword) => {
    if (messageText.includes(keyword)) {
      score += 5;
      reasoning.push(`+5 points for keyword "${keyword}".`);
    }
  });

  // Rule 5: Penalize for old, untouched leads in the initial stage
  if (leadData.status === "Service Selection Pending") {
    const daysOld =
      (Date.now() - leadData.createdAt.toDate().getTime()) / (1000 * 3600 * 24);
    if (daysOld > 14) {
      score -= 10;
      reasoning.push("-10 points for being an old, unengaged lead.");
    }
  }

  // Normalize score to be between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { score, reasoning };
};

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

    // 2. Get requestId from body
    const { requestId } = await req.json();
    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    // 3. Fetch the request document
    const requestRef = adminDb.collection("requests").doc(requestId);
    const requestDoc = await requestRef.get();
    if (!requestDoc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    const requestData = requestDoc.data()!;

    // 4. Calculate the score
    const { score, reasoning } = calculateScore(requestData);

    // 5. Update the request document with the new score and reasoning
    await requestRef.update({
      leadScore: score,
      leadScoreReasoning: reasoning,
    });

    return NextResponse.json(
      {
        message: "Lead score calculated successfully",
        leadScore: score,
        reasoning: reasoning,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Lead Score Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
