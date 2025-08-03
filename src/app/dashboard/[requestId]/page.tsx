"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Building,
  Tag,
} from "lucide-react";
import dynamic from "next/dynamic";
import { logActivity } from "../../utils/activity";
import { FaSpinner } from "react-icons/fa";

const ActivityTimeline = dynamic(
  () => import("../../components/dashboard/ActivityTimeline"),
  { ssr: false }
);
const CommunicationPanel = dynamic(
  () => import("../../components/dashboard/CommunicationPanel"),
  { ssr: false }
);
const TasksPanel = dynamic(
  () => import("../../components/dashboard/TasksPanel"),
  { ssr: false }
);
const BillingPanel = dynamic(
  () => import("../../components/dashboard/BillingPanel"),
  { ssr: false }
);
const LeadScorePanel = dynamic(
  () => import("../../components/dashboard/LeadScorePanel"),
  { ssr: false }
);

// Interfaces
interface Request {
  id: string;
  name: string;
  message: string;
  createdAt: Timestamp;
  userId: string;
  company?: string;
  tags?: string[];
  status?: string;
  selectedServices?: string[];
  quotationPrice?: number;
  quotationDetails?: string;
  leadScore?: number;
  leadScoreReasoning?: string[];
  lastUpdatedBy?: "user" | "admin";
  adminHasUnreadUpdate?: boolean;
}

const servicesList = [
  "Social Media Design",
  "Web Development",
  "Digital Marketing (SEO, PPC)",
  "Content Creation",
  "Brand Strategy",
];

const ProjectDetailPage = () => {
  const { user, role, loading: authLoading } = useAuth();
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
  const [isEditingQuotation, setIsEditingQuotation] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  // Fetch request data
  useEffect(() => {
    if (authLoading || !requestId || !user) {
      return;
    }
    const docRef = doc(db, "requests", requestId);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Request;
          const isOwner = data.userId === user.uid;
          const isManager = role === "admin" || role === "sales_rep";

          if (isOwner || isManager) {
            setRequest(data);
            setSelectedServices(data.selectedServices || []);
            setQuotationPrice(data.quotationPrice?.toString() || "");
            setQuotationDetails(data.quotationDetails || "");
            setIsEditingQuotation(!data.quotationPrice);
          } else {
            setError("You do not have permission to view this project.");
          }
        } else {
          setError("Project not found.");
        }
        setLoading(false);
      },
      (error) => {
        openInfoModal("Error", `Failed to load project: ${error.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId, user, role, authLoading, openInfoModal]);

  // Mark admin updates as read
  useEffect(() => {
    if (role === "admin" && request?.adminHasUnreadUpdate) {
      const markAsRead = async () => {
        const docRef = doc(db, "requests", requestId);
        await updateDoc(docRef, { adminHasUnreadUpdate: false });
      };
      markAsRead();
    }
  }, [role, request, requestId]);

  // Update and log actions
  const handleUpdateAndLog = useCallback(
    async (updateData: object, logMessage: string) => {
      setIsSubmitting(true);
      const docRef = doc(db, "requests", requestId);
      try {
        const finalUpdateData = {
          ...updateData,
          adminHasUnreadUpdate: role !== "admin",
        };
        await updateDoc(docRef, finalUpdateData);
        if (user && logMessage) {
          const idToken = await user.getIdToken();
          await logActivity(requestId, logMessage, idToken);
        }
        return true;
      } catch (err) {
        openInfoModal("Error", `Update failed: ${(err as Error).message}`);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [requestId, user, role, openInfoModal]
  );

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
    const success = await handleUpdateAndLog(
      {
        selectedServices,
        status: "Services Selected",
        lastUpdatedBy: "user",
      },
      `User confirmed services: ${selectedServices.join(", ")}.`
    );
    if (success) openInfoModal("Success", "Services updated successfully!");
  };

  const handleSendQuotation = async () => {
    if (!quotationPrice || !quotationDetails) {
      openInfoModal("Input Error", "Please fill in both price and details.");
      return;
    }
    const success = await handleUpdateAndLog(
      {
        quotationPrice: parseFloat(quotationPrice),
        quotationDetails: quotationDetails,
        status: "Quotation Sent",
        lastUpdatedBy: "admin",
      },
      `Admin sent a quotation of ₹${parseFloat(quotationPrice).toLocaleString(
        "en-IN"
      )}.`
    );
    if (success) {
      openInfoModal("Success", "Quotation sent successfully!");
      setIsEditingQuotation(false);
    }
  };

  const handleRequestRevision = async () => {
    const success = await handleUpdateAndLog(
      { status: "Revision Requested", lastUpdatedBy: "user" },
      "User requested a revision to the quotation."
    );
    if (success)
      openInfoModal(
        "Request Sent",
        "Your request for a revised quotation has been sent."
      );
  };

  const handleApproveRevision = async () => {
    const success = await handleUpdateAndLog(
      {
        status: "Service Selection Pending",
        lastUpdatedBy: "admin",
        selectedServices: [],
        quotationPrice: null,
        quotationDetails: null,
      },
      "Admin approved the revision request. User can now re-select services."
    );
    if (success)
      openInfoModal(
        "Revision Approved",
        "The user can now edit their selected services."
      );
  };

  const handleAcceptQuotation = async () => {
    const success = await handleUpdateAndLog(
      { status: "Project Approved", lastUpdatedBy: "user" },
      "User accepted the quotation. Project is now approved."
    );
    if (success) openInfoModal("Project Started!", "Quotation accepted!");
  };

  const handlePostApprovalChangeRequest = async () => {
    const success = await handleUpdateAndLog(
      {
        status: "Change Request Pending",
        lastUpdatedBy: role === "admin" ? "admin" : "user",
      },
      `${
        role === "admin" ? "Admin" : "User"
      } submitted a post-approval change request.`
    );
    if (success)
      openInfoModal(
        "Request Sent",
        "A request for changes has been submitted."
      );
  };

  const getStatusChip = (status?: string) => {
    let colorClasses = "bg-yellow-100 text-yellow-800";
    const currentStatus = status || "Service Selection Pending";
    switch (currentStatus) {
      case "Project Approved":
        colorClasses = "bg-green-100 text-green-800";
        break;
      case "Quotation Sent":
        colorClasses = "bg-blue-100 text-blue-800";
        break;
      case "Services Selected":
        colorClasses = "bg-indigo-100 text-indigo-800";
        break;
      case "Revision Requested":
        colorClasses = "bg-orange-100 text-orange-800";
        break;
      case "Change Request Pending":
        colorClasses = "bg-pink-100 text-pink-800";
        break;
    }
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses}`}
      >
        {currentStatus}
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='flex items-center space-x-3'>
          <FaSpinner className='animate-spin text-blue-600' size={24} />
          <p className='text-gray-600 text-base'>Loading Project...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <p className='text-red-600 text-base'>{error}</p>
      </div>
    );
  }
  if (!request) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <p className='text-gray-600 text-base'>Project could not be loaded.</p>
      </div>
    );
  }

  const isUserOwner = user?.uid === request.userId;
  const isManager = role === "admin" || role === "sales_rep";
  const isNewUserRequest =
    request.status === "Service Selection Pending" ||
    request.status === "Pending" ||
    request.status === undefined ||
    request.status === "";
  const isServiceSelectionLocked =
    isUserOwner && !isNewUserRequest && request.status !== "Revision Requested";
  const hasQuotation =
    request.quotationPrice != null && request.quotationPrice > 0;
  const hasSelectedServices =
    request.selectedServices && request.selectedServices.length > 0;

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Sticky Header */}
      <header className='sticky top-0 z-20 bg-white shadow-sm py-4 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4'>
          <button
            onClick={() => router.back()}
            className='inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
            aria-label='Back to Dashboard'
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </button>
          <div className='flex items-center gap-3'>
            <h1 className='text-xl sm:text-2xl font-bold text-gray-900 truncate'>
              {request.name}
            </h1>
            {getStatusChip(request.status)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6'>
        {/* Project Details */}
        <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
          <div className='space-y-4'>
            {request.company && (
              <p className='text-sm text-gray-600 flex items-center'>
                <Building className='mr-2 h-4 w-4 text-gray-400' />
                {request.company}
              </p>
            )}
            <p className='text-sm text-gray-500'>
              Submitted: {new Date(request.createdAt.toDate()).toLocaleString()}
            </p>
            {request.tags && request.tags.length > 0 && (
              <div className='flex items-center flex-wrap gap-2'>
                <Tag className='h-4 w-4 text-gray-400' />
                {request.tags.map((tag) => (
                  <span
                    key={tag}
                    className='px-2 py-1 bg-gray-200 text-gray-800 text-xs font-medium rounded-full'
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className='pt-4 border-t border-gray-200'>
              <h3 className='text-base font-semibold text-gray-900'>
                Initial Message
              </h3>
              <blockquote className='mt-2 p-3 bg-gray-50 border-l-4 border-gray-300'>
                <p className='text-sm text-gray-600 italic'>
                  &quot;{request.message}&quot;
                </p>
              </blockquote>
            </div>
          </div>
        </section>

        {/* Activity Timeline */}
        <ActivityTimeline requestId={requestId} />

        {/* Manager-only Panels */}
        {isManager && <TasksPanel requestId={requestId} />}

        {/* Admin-only Panels */}
        {role === "admin" && <CommunicationPanel request={request} />}
        {role === "admin" && <BillingPanel request={request} />}
        {role === "admin" && <LeadScorePanel request={request} />}

        {/* Service Selection */}
        <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
            Service Selection
          </h2>
          {isServiceSelectionLocked && isUserOwner && (
            <div className='p-3 mb-4 bg-yellow-50 border-l-4 border-yellow-400'>
              <p className='text-sm text-yellow-700'>
                Service selection is locked. Request a revision below to make
                changes.
              </p>
            </div>
          )}
          {isNewUserRequest && isUserOwner && !hasSelectedServices && (
            <div className='p-3 mb-4 bg-blue-50 border-l-4 border-blue-400'>
              <p className='text-sm text-blue-700'>
                Select services to request a quotation.
              </p>
            </div>
          )}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {servicesList.map((service) => (
              <button
                key={service}
                onClick={() =>
                  isUserOwner &&
                  !isServiceSelectionLocked &&
                  handleServiceToggle(service)
                }
                disabled={!isUserOwner || isServiceSelectionLocked}
                className={`p-3 rounded-md text-sm font-medium text-center transition-all ${
                  selectedServices.includes(service)
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700"
                } ${
                  isUserOwner && !isServiceSelectionLocked
                    ? "hover:bg-blue-100"
                    : "cursor-not-allowed opacity-70"
                }`}
                aria-label={`Toggle ${service} service`}
              >
                {service}
              </button>
            ))}
          </div>
          {isUserOwner && !isServiceSelectionLocked && (
            <button
              onClick={handleServiceSubmission}
              disabled={isSubmitting || selectedServices.length === 0}
              className='mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500'
              aria-label='Confirm services and request quotation'
            >
              {isSubmitting
                ? "Submitting..."
                : "Confirm Services and Request Quotation"}
            </button>
          )}
        </section>

        {/* Revision Request (User) */}
        {isUserOwner && hasSelectedServices && (
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
              Need to Make a Change?
            </h2>
            {request.status === "Revision Requested" ? (
              <p className='text-sm text-gray-600'>
                Your revision request has been sent. Please wait for admin
                approval.
              </p>
            ) : (
              <>
                <p className='text-sm text-gray-600 mb-4'>
                  Request a revised quotation to add or remove services.
                </p>
                <button
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className='w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500'
                  aria-label='Request revised quotation'
                >
                  <RefreshCw className='inline mr-2 h-4 w-4' />
                  {isSubmitting ? "Requesting..." : "Request Revised Quotation"}
                </button>
              </>
            )}
          </section>
        )}

        {/* Admin Actions */}
        {role === "admin" && (
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            {hasSelectedServices ? (
              <>
                <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
                  Client&apos;s Selected Services
                </h2>
                <ul className='flex flex-wrap gap-2 mb-4'>
                  {request.selectedServices!.map((service) => (
                    <li
                      key={service}
                      className='px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full'
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className='text-sm text-gray-600 text-center'>
                The user has not selected any services yet.
              </p>
            )}
            {request.status === "Revision Requested" && (
              <div className='p-3 mb-4 bg-orange-50 border-l-4 border-orange-400'>
                <h3 className='text-base font-semibold text-orange-800'>
                  Revision Requested
                </h3>
                <p className='text-sm text-orange-700 mt-1'>
                  The user wants to change their services. Approving will unlock
                  selection and reset the quotation.
                </p>
                <button
                  onClick={handleApproveRevision}
                  disabled={isSubmitting}
                  className='mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500'
                  aria-label='Approve revision request'
                >
                  {isSubmitting ? "Approving..." : "Approve Revision Request"}
                </button>
              </div>
            )}
            {hasSelectedServices && (
              <div className='pt-4 border-t border-gray-200'>
                <div className='flex justify-between items-center mb-4'>
                  <h3 className='text-base font-semibold text-gray-900'>
                    {hasQuotation && !isEditingQuotation
                      ? "View Quotation"
                      : "Send / Edit Quotation"}
                  </h3>
                  {hasQuotation && !isEditingQuotation && (
                    <button
                      onClick={() => setIsEditingQuotation(true)}
                      className='inline-flex items-center text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded'
                      aria-label='Edit quotation'
                    >
                      <Edit className='mr-1 h-4 w-4' /> Edit
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
                        className='mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500'
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
                        className='mt-1 block w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500'
                        placeholder='e.g., Includes initial design mockups...'
                      ></textarea>
                    </div>
                    <div className='flex items-center gap-3'>
                      <button
                        onClick={handleSendQuotation}
                        disabled={isSubmitting}
                        className='flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500'
                        aria-label={
                          hasQuotation ? "Update quotation" : "Send quotation"
                        }
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
                          className='text-sm text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-500 rounded'
                          aria-label='Cancel editing quotation'
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  hasQuotation && (
                    <div className='p-3 bg-blue-50 rounded-md'>
                      <p className='text-sm font-medium text-gray-600'>
                        Project Price
                      </p>
                      <p className='text-xl font-bold text-blue-600'>
                        ₹{request.quotationPrice!.toLocaleString("en-IN")}
                      </p>
                      <p className='text-sm font-medium text-gray-600 mt-3'>
                        Details
                      </p>
                      <p className='text-sm text-gray-700 whitespace-pre-wrap mt-1'>
                        {request.quotationDetails}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* Quotation Received (User) */}
        {isUserOwner && hasQuotation && (
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
              Quotation Received
            </h2>
            <div className='space-y-4'>
              <div>
                <p className='text-sm font-medium text-gray-600'>
                  Project Price
                </p>
                <p className='text-xl font-bold text-blue-600'>
                  ₹{request.quotationPrice!.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-gray-600'>Details</p>
                <p className='text-sm text-gray-700 whitespace-pre-wrap'>
                  {request.quotationDetails}
                </p>
              </div>
              {request.status === "Quotation Sent" && (
                <button
                  onClick={handleAcceptQuotation}
                  disabled={isSubmitting}
                  className='w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  aria-label='Accept quotation and start project'
                >
                  <CheckCircle className='inline mr-2 h-4 w-4' />
                  {isSubmitting
                    ? "Accepting..."
                    : "Accept Quotation & Start Project"}
                </button>
              )}
            </div>
          </section>
        )}

        {/* Post-Approval Changes (Admin) */}
        {request.status === "Project Approved" && role === "admin" && (
          <section className='bg-white rounded-lg shadow-md border border-gray-200 p-5'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4'>
              Post-Approval Changes
            </h2>
            <p className='text-sm text-gray-600 mb-4'>
              Submit a request for changes to this approved project. The admin
              will review and discuss next steps.
            </p>
            <button
              onClick={handlePostApprovalChangeRequest}
              disabled={isSubmitting}
              className='w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2.5 rounded-md disabled:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500'
              aria-label='Request changes to approved project'
            >
              <AlertTriangle className='inline mr-2 h-4 w-4' />
              {isSubmitting
                ? "Submitting..."
                : "Request Changes to Approved Project"}
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProjectDetailPage;
