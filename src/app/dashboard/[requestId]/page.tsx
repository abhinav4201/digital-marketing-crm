"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import { ArrowLeft, Edit, CheckCircle } from "lucide-react";

interface Request {
  id: string;
  name: string;
  message: string;
  createdAt: Timestamp;
  userId: string;
  status?: string;
  selectedServices?: string[];
  quotationPrice?: number;
  quotationDetails?: string;
  lastUpdatedBy?: "user" | "admin";
}

const servicesList = [
  "Social Media Design",
  "Web Development",
  "Digital Marketing (SEO, PPC)",
  "Content Creation",
  "Brand Strategy",
];

const ProjectDetailPage = () => {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [quotationPrice, setQuotationPrice] = useState("");
  const [quotationDetails, setQuotationDetails] = useState("");

  // New state to control the admin's edit mode for quotations
  const [isEditingQuotation, setIsEditingQuotation] = useState(false);

  const { openModal: openInfoModal } = useInfoModalStore();

  useEffect(() => {
    if (!requestId) return;
    const docRef = doc(db, "requests", requestId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Request;
        if (user && (data.userId === user.uid || isAdmin)) {
          setRequest(data);
          setSelectedServices(data.selectedServices || []);
          setQuotationPrice(data.quotationPrice?.toString() || "");
          setQuotationDetails(data.quotationDetails || "");
          // If a quotation exists, default to not being in edit mode
          if (data.quotationPrice) {
            setIsEditingQuotation(false);
          } else {
            setIsEditingQuotation(true); // If no quote yet, start in edit mode
          }
        } else {
          setError("You do not have permission to view this project.");
        }
      } else {
        setError("Project not found.");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [requestId, user, isAdmin]);

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleServiceSubmission = async () => {
    if (selectedServices.length === 0) {
      openInfoModal("Selection Error", "Please select at least one service.");
      return;
    }
    setIsSubmitting(true);
    const docRef = doc(db, "requests", requestId);
    try {
      await updateDoc(docRef, {
        selectedServices: selectedServices,
        status: "Services Selected",
        lastUpdatedBy: "user",
      });
      openInfoModal("Success", "Services updated successfully!");
    } catch (err) {
      console.error(err);
      openInfoModal(
        "Update Failed",
        "There was an error updating the services."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuotation = async () => {
    if (!quotationPrice || !quotationDetails) {
      openInfoModal(
        "Input Error",
        "Please fill in both price and details for the quotation."
      );
      return;
    }
    setIsSubmitting(true);
    const docRef = doc(db, "requests", requestId);
    try {
      await updateDoc(docRef, {
        quotationPrice: parseFloat(quotationPrice),
        quotationDetails: quotationDetails,
        status: "Quotation Sent",
        lastUpdatedBy: "admin",
      });
      openInfoModal("Success", "Quotation sent successfully!");
      setIsEditingQuotation(false); // Exit edit mode after sending
    } catch (err) {
      console.error(err);
      openInfoModal("Send Failed", "There was an error sending the quotation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptQuotation = async () => {
    setIsSubmitting(true);
    const docRef = doc(db, "requests", requestId);
    try {
      await updateDoc(docRef, {
        status: "Project Approved",
        lastUpdatedBy: "user",
      });
      openInfoModal("Project Started!", "Quotation accepted!");
    } catch (err) {
      console.error(err);
      openInfoModal(
        "Acceptance Failed",
        "There was an error accepting the quotation."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusChip = (status?: string) => {
    let colorClasses = "bg-yellow-100 text-yellow-800";
    switch (status) {
      case "Project Approved":
        colorClasses = "bg-green-100 text-green-800";
        break;
      case "Quotation Sent":
        colorClasses = "bg-blue-100 text-blue-800";
        break;
      case "Services Selected":
        colorClasses = "bg-indigo-100 text-indigo-800";
        break;
    }
    return (
      <span
        className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}
      >
        {status || "Pending"}
      </span>
    );
  };

  if (loading)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading Project...</p>
      </div>
    );
  if (error)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>{error}</p>
      </div>
    );
  if (!request)
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Project could not be loaded.</p>
      </div>
    );

  const isUserOwner = user?.uid === request.userId;
  const canUserSelectServices = isUserOwner && !request.selectedServices;
  const hasQuotation =
    request.quotationPrice !== undefined && request.quotationPrice > 0;

  return (
    <div className='min-h-screen p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <button
          onClick={() => router.back()}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700'
        >
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Dashboard
        </button>

        <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center'>
            <div className='mb-4 sm:mb-0'>
              <h1 className='text-3xl font-bold text-blue-600'>
                Project Details
              </h1>
              <p className='text-sm text-gray-500 mt-1'>
                Submitted on{" "}
                {new Date(request.createdAt.toDate()).toLocaleString()}
              </p>
            </div>
            {getStatusChip(request.status)}
          </div>
          <div className='mt-6 border-t border-gray-200 pt-6'>
            <h3 className='font-semibold text-lg text-gray-800'>
              Initial Message:
            </h3>
            <blockquote className='mt-2 p-4 bg-slate-50 border-l-4 border-slate-300'>
              <p className='text-gray-600 italic'>
                &quot;{request.message}&quot;
              </p>
            </blockquote>
          </div>
        </div>

        {canUserSelectServices && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
              Select Your Services
            </h2>
            <p className='text-gray-600 mb-6'>
              Please select the services you are interested in for this project.
            </p>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
              {servicesList.map((service) => (
                <button
                  key={service}
                  onClick={() => handleServiceToggle(service)}
                  className={`p-4 rounded-lg text-center font-semibold transition-all duration-200 ${
                    selectedServices.includes(service)
                      ? "bg-blue-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
            <button
              onClick={handleServiceSubmission}
              disabled={isSubmitting}
              className='mt-8 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 transition-colors'
            >
              {isSubmitting ? "Submitting..." : "Confirm Services"}
            </button>
          </div>
        )}

        {isAdmin && request.selectedServices && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
              Client&apos;s Selected Services
            </h2>
            <ul className='flex flex-wrap gap-2 mb-6'>
              {request.selectedServices.map((service) => (
                <li
                  key={service}
                  className='bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full'
                >
                  {service}
                </li>
              ))}
            </ul>

            <div className='border-t border-gray-200 pt-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {hasQuotation && !isEditingQuotation
                    ? "View Quotation"
                    : "Send / Edit Quotation"}
                </h3>
                {hasQuotation && !isEditingQuotation && (
                  <button
                    onClick={() => setIsEditingQuotation(true)}
                    className='inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800'
                  >
                    <Edit className='mr-2 h-4 w-4' /> Edit
                  </button>
                )}
              </div>

              {isEditingQuotation ? (
                <div className='space-y-4'>
                  <div>
                    <label
                      htmlFor='quotationPrice'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Price (INR)
                    </label>
                    <input
                      type='number'
                      name='quotationPrice'
                      id='quotationPrice'
                      value={quotationPrice}
                      onChange={(e) => setQuotationPrice(e.target.value)}
                      className='mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm p-2'
                      placeholder='e.g., 50000'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='quotationDetails'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Quotation Details
                    </label>
                    <textarea
                      name='quotationDetails'
                      id='quotationDetails'
                      rows={4}
                      value={quotationDetails}
                      onChange={(e) => setQuotationDetails(e.target.value)}
                      className='mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm p-2'
                      placeholder='e.g., Includes initial design mockups...'
                    ></textarea>
                  </div>
                  <div className='flex items-center gap-4'>
                    <button
                      onClick={handleSendQuotation}
                      disabled={isSubmitting}
                      className='flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400'
                    >
                      {isSubmitting
                        ? "Sending..."
                        : hasQuotation
                        ? "Update Quotation"
                        : "Send Quotation"}
                    </button>
                    {hasQuotation && (
                      <button
                        onClick={() => setIsEditingQuotation(false)}
                        className='text-sm text-gray-600 hover:underline'
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className='p-4 bg-blue-50 rounded-lg'>
                  <p className='text-sm font-medium text-gray-600'>
                    Project Price
                  </p>
                  <p className='text-3xl font-bold text-blue-600'>
                    ₹{request.quotationPrice!.toLocaleString("en-IN")}
                  </p>
                  <p className='text-sm font-medium text-gray-600 mt-4'>
                    Details
                  </p>
                  <p className='text-gray-700 whitespace-pre-wrap mt-1'>
                    {request.quotationDetails}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {isUserOwner && hasQuotation && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
              Quotation Received
            </h2>
            <div className='space-y-4'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Project Price
                </p>
                <p className='text-3xl font-bold text-blue-600'>
                  ₹{request.quotationPrice!.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Details</p>
                <p className='text-gray-700 whitespace-pre-wrap'>
                  {request.quotationDetails}
                </p>
              </div>
              {request.status === "Quotation Sent" && (
                <button
                  onClick={handleAcceptQuotation}
                  disabled={isSubmitting}
                  className='w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
                >
                  <CheckCircle className='mr-2 h-5 w-5' />
                  {isSubmitting
                    ? "Accepting..."
                    : "Accept Quotation & Start Project"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
