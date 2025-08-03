/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { useAuth, UserRole } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";

interface Request {
  id: string;
  leadScore?: number;
  leadScoreReasoning?: string[];
}

export default function LeadScorePanel({ request }: { request: Request }) {
  const { user, role } = useAuth();
  const [isCalculating, setIsCalculating] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  const handleCalculateScore = async () => {
    if (!user) return;
    setIsCalculating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/analytics/calculate-lead-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ requestId: request.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to calculate score.");
      openInfoModal(
        "Score Updated",
        `The new lead score is ${data.leadScore}.`
      );
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 66) return "text-green-500";
    if (score > 33) return "text-yellow-500";
    return "text-red-500";
  };

  if (role !== "admin") return null;

  return (
    <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-semibold text-gray-900'>Lead Score</h2>
        <button
          onClick={handleCalculateScore}
          disabled={isCalculating}
          className='bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg disabled:bg-gray-100'
        >
          {isCalculating ? "Recalculating..." : "Recalculate"}
        </button>
      </div>
      <div className='mt-4 text-center'>
        <p
          className={`font-bold text-7xl ${getScoreColor(
            request.leadScore || 0
          )}`}
        >
          {request.leadScore ?? "N/A"}
        </p>
        <div className='mt-4 text-left text-sm text-gray-600'>
          <h4 className='font-semibold mb-2'>Reasoning:</h4>
          <ul className='list-disc list-inside space-y-1'>
            {request.leadScoreReasoning &&
            request.leadScoreReasoning.length > 0 ? (
              request.leadScoreReasoning.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))
            ) : (
              <li>No score calculated yet. Click &quot;Recalculate&quot;.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
