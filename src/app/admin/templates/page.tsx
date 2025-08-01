/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { FilePlus, MessageSquareText } from "lucide-react";

// Defines the structure for a single template document from Firestore
interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: Timestamp;
}

// Defines the structure for the form state
interface NewTemplateData {
  name: string;
  subject: string;
  body: string;
}

const TemplatesPage = () => {
  const { user, role } = useAuth();
  const { openModal: openInfoModal } = useInfoModalStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<NewTemplateData>({
    name: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "templates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTemplates = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Template)
      );
      setTemplates(fetchedTemplates);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setNewTemplate((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateTemplate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreating(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create template");
      }

      openInfoModal("Success", "Template created successfully!");
      setNewTemplate({ name: "", subject: "", body: "" }); // Reset form
    } catch (error: any) {
      console.error(error);
      openInfoModal("Error", error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading templates...</p>
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
      <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Create Template Form */}
        <div className='lg:col-span-1'>
          <div className='bg-white p-6 rounded-lg shadow-md sticky top-24'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4 flex items-center'>
              <FilePlus className='mr-2' /> Create New Template
            </h2>
            <form onSubmit={handleCreateTemplate} className='space-y-4'>
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Template Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={newTemplate.name}
                  onChange={handleInputChange}
                  required
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
                  placeholder='e.g., Welcome Email'
                />
              </div>
              <div>
                <label
                  htmlFor='subject'
                  className='block text-sm font-medium text-gray-700'
                >
                  Email Subject
                </label>
                <input
                  type='text'
                  id='subject'
                  value={newTemplate.subject}
                  onChange={handleInputChange}
                  required
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2'
                  placeholder='e.g., Welcome to our Agency!'
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
                  rows={8}
                  value={newTemplate.body}
                  onChange={handleInputChange}
                  required
                  className='mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm'
                  placeholder='Hi {{name}}, welcome...'
                ></textarea>
                <p className='text-xs text-gray-500 mt-1'>
                  Use placeholders like <code>{"{{name}}"}</code>,{" "}
                  <code>{"{{company}}"}</code>.
                </p>
              </div>
              <button
                type='submit'
                disabled={isCreating}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400'
              >
                {isCreating ? "Saving..." : "Save Template"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Templates List */}
        <div className='lg:col-span-2'>
          <h1 className='text-3xl font-bold text-gray-900 mb-6'>
            Email Templates
          </h1>
          <div className='space-y-4'>
            {templates.length > 0 ? (
              templates.map((template) => (
                <div
                  key={template.id}
                  className='bg-white p-4 rounded-lg shadow-sm border'
                >
                  <h3 className='font-bold text-lg text-gray-800'>
                    {template.name}
                  </h3>
                  <p className='text-sm text-gray-600 mt-1'>
                    <strong>Subject:</strong> {template.subject}
                  </p>
                  <pre className='text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded whitespace-pre-wrap font-mono'>
                    {template.body}
                  </pre>
                  <p className='text-xs text-gray-400 mt-2 text-right'>
                    Created on:{" "}
                    {new Date(template.createdAt.toDate()).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className='text-center text-gray-500 py-8 bg-white rounded-lg shadow-sm'>
                <MessageSquareText className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>
                  No templates yet
                </h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Get started by creating a new template.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;
