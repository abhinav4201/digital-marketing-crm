/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useAuth, UserRole } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";

interface Request {
  id: string;
  name: string;
  company?: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export default function CommunicationPanel({ request }: { request: Request }) {
  const { user, role } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [emailContent, setEmailContent] = useState({ subject: "", body: "" });
  const [isSending, setIsSending] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  useEffect(() => {
    if (role !== "admin") return;

    const q = query(collection(db, "templates"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTemplates(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Template))
      );
    });
    return () => unsubscribe();
  }, [role]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      let body = template.body.replace(/{{name}}/g, request.name);
      if (request.company) {
        body = body.replace(/{{company}}/g, request.company);
      }
      setEmailContent({ subject: template.subject, body });
    } else {
      setEmailContent({ subject: "", body: "" });
    }
  };

  const handleSendEmail = async () => {
    if (!emailContent.subject || !emailContent.body || !user) return;
    setIsSending(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/communications/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ requestId: request.id, ...emailContent }),
      });
      if (!response.ok) throw new Error("Failed to send email.");
      openInfoModal("Success", "Email sent and logged in activity.");
      setEmailContent({ subject: "", body: "" });
      setSelectedTemplateId("");
    } catch (error) {
      openInfoModal("Error", "Could not send email.");
    } finally {
      setIsSending(false);
    }
  };

  if (role !== "admin") return null;

  return (
    <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
      <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
        Communication
      </h2>
      <div className='space-y-4'>
        <div>
          <label
            htmlFor='template'
            className='block text-sm font-medium text-gray-700'
          >
            Select a Template
          </label>
          <select
            id='template'
            value={selectedTemplateId}
            onChange={handleTemplateChange}
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
          >
            <option value=''>-- Custom Message --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor='subject'
            className='block text-sm font-medium text-gray-700'
          >
            Subject
          </label>
          <input
            type='text'
            id='subject'
            value={emailContent.subject}
            onChange={(e) =>
              setEmailContent({ ...emailContent, subject: e.target.value })
            }
            required
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
          />
        </div>
        <div>
          <label
            htmlFor='body'
            className='block text-sm font-medium text-gray-700'
          >
            Body
          </label>
          <textarea
            id='body'
            rows={10}
            value={emailContent.body}
            onChange={(e) =>
              setEmailContent({ ...emailContent, body: e.target.value })
            }
            required
            className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm'
          />
        </div>
        <button
          onClick={handleSendEmail}
          disabled={isSending}
          className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400'
        >
          {isSending ? "Sending..." : "Send Email"}
        </button>
      </div>
    </div>
  );
}
