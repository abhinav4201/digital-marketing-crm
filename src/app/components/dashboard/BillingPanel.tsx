/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { CreditCard } from "lucide-react";

interface Request {
  id: string;
  quotationPrice?: number;
  selectedServices?: string[];
  status?: string;
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  invoiceUrl: string;
  status: string;
  amount: number;
  createdAt: Timestamp;
}

export default function BillingPanel({ request }: { request: Request }) {
  const { user, role } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  useEffect(() => {
    if (role !== "admin" || !request.id) return;
    const q = query(
      collection(db, "requests", request.id, "invoices"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setInvoices(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Invoice))
      );
    });
    return () => unsubscribe();
  }, [request.id, role]);

  const handleCreateInvoice = async () => {
    if (!user || !request.quotationPrice || !request.selectedServices) {
      openInfoModal(
        "Error",
        "A final quotation and selected services are required to create an invoice."
      );
      return;
    }
    setIsCreating(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/billing/create-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          requestId: request.id,
          price: request.quotationPrice,
          description: `Services: ${request.selectedServices.join(", ")}`,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to create invoice.");
      openInfoModal("Success", "Invoice created and sent successfully!");
    } catch (error: any) {
      openInfoModal("Error", error.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (role !== "admin" || request.status !== "Project Approved") return null;

  return (
    <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
      <h2 className='text-2xl font-semibold mb-4 text-gray-900'>Billing</h2>
      {invoices.length > 0 ? (
        <div className='space-y-4'>
          <h3 className='font-semibold text-gray-800'>Generated Invoices:</h3>
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className='flex justify-between items-center bg-gray-50 p-3 rounded-md'
            >
              <div>
                <p className='font-medium text-gray-700'>
                  Amount: ₹{inv.amount.toLocaleString("en-IN")}
                </p>
                <p className='text-xs text-gray-500'>
                  Status:{" "}
                  <span className='font-mono uppercase'>{inv.status}</span>
                </p>
              </div>
              <a
                href={inv.invoiceUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='text-blue-600 hover:underline text-sm font-semibold'
              >
                View Invoice
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center p-4 border-2 border-dashed rounded-lg'>
          <CreditCard className='mx-auto h-12 w-12 text-gray-400' />
          <p className='mt-2 text-gray-600'>
            No invoices have been created for this project yet.
          </p>
          {request.quotationPrice && (
            <button
              onClick={handleCreateInvoice}
              disabled={isCreating}
              className='mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400'
            >
              {isCreating
                ? "Creating Invoice..."
                : `Create Invoice for ₹${request.quotationPrice.toLocaleString(
                    "en-IN"
                  )}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
