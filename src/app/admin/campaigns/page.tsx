/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { Send } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const CAMPAIGN_STAGES = [
  "Service Selection Pending",
  "Services Selected",
  "Quotation Sent",
  "Revision Requested",
  "Project Approved",
];

const CampaignsPage = () => {
  const { user, role } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [targetStatus, setTargetStatus] = useState<string>(CAMPAIGN_STAGES[0]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }
    const q = query(collection(db, "templates"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTemplates(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Template))
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, [role]);

  const handleSendCampaign = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTemplateId || !targetStatus) {
      openInfoModal("Error", "Please select a template and a target stage.");
      return;
    }
    setIsSending(true);

    const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);
    if (!selectedTemplate) {
      openInfoModal("Error", "Selected template not found.");
      setIsSending(false);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/communications/send-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ targetStatus, template: selectedTemplate }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to send campaign.");
      }

      openInfoModal("Success", responseData.message);
    } catch (error: any) {
      console.error(error);
      openInfoModal("Error", error.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading campaign data...</p>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>
          You are not authorized to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-2xl mx-auto'>
        <header className='mb-8 text-center'>
          <h1 className='text-4xl font-bold text-gray-900'>Email Campaigns</h1>
          <p className='text-gray-500 mt-2'>
            Send bulk emails to leads based on their pipeline status.
          </p>
        </header>

        <div className='bg-white p-8 rounded-lg shadow-md'>
          <form onSubmit={handleSendCampaign} className='space-y-6'>
            <div>
              <label
                htmlFor='targetStatus'
                className='block text-sm font-medium text-gray-700'
              >
                1. Choose Target Audience
              </label>
              <select
                id='targetStatus'
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 text-lg'
              >
                {CAMPAIGN_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor='template'
                className='block text-sm font-medium text-gray-700'
              >
                2. Select Email Template
              </label>
              <select
                id='template'
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                required
                className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-3 text-lg'
              >
                <option value=''>-- Select a template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='border-t pt-6'>
              <button
                type='submit'
                disabled={isSending || !selectedTemplateId}
                className='w-full flex justify-center items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 text-lg'
              >
                <Send className='mr-3' />
                {isSending ? "Sending Campaign..." : "Launch Campaign"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CampaignsPage;
