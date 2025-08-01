/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState, useCallback, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  onSnapshot,
  updateDoc,
  Timestamp,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../providers/AuthProvider";
import { useInfoModalStore } from "../../store/useInfoModalStore";
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Building,
  Tag,
  Check,
  Plus,
  CreditCard,
  Star,
} from "lucide-react";

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

interface Activity {
  id: string;
  message: string;
  actorName: string;
  actorRole: "user" | "admin" | "sales_rep" | "support_agent";
  createdAt: Timestamp;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Task {
  id: string;
  title: string;
  isComplete: boolean;
  createdAt: Timestamp;
}

interface Invoice {
  id: string;
  stripeInvoiceId: string;
  invoiceUrl: string;
  status: string;
  amount: number;
  createdAt: Timestamp;
}

const servicesList = [
  "Social Media Design",
  "Web Development",
  "Digital Marketing (SEO, PPC)",
  "Content Creation",
  "Brand Strategy",
];

// Helper function to call our new API
const logActivity = async (
  requestId: string,
  message: string,
  idToken: string
) => {
  try {
    const response = await fetch("/api/requests/add-activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ requestId, message }),
    });
    if (!response.ok) {
      console.error("Failed to log activity:", await response.json());
    }
  } catch (error) {
    console.error("Error in logActivity:", error);
  }
};

const ProjectDetailPage = () => {
  const { user, role } = useAuth();
  const router = useRouter();
  const params = useParams();
  const requestId = params.requestId as string;

  // State for the request itself
  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for activities (timeline)
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivityMessage, setNewActivityMessage] = useState("");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);

  // State for form interactions
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quotationPrice, setQuotationPrice] = useState("");
  const [quotationDetails, setQuotationDetails] = useState("");
  const [isEditingQuotation, setIsEditingQuotation] = useState(false);
  const { openModal: openInfoModal } = useInfoModalStore();

  // Effect to fetch the main request data
  useEffect(() => {
    if (!requestId || !user) return;
    const docRef = doc(db, "requests", requestId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Request;
        if (data.userId === user.uid || role === "admin") {
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
    });
    return () => unsubscribe();
  }, [requestId, user, role]);

  // Effect to fetch the activity timeline
  useEffect(() => {
    if (!requestId) return;
    const activitiesQuery = query(
      collection(db, "requests", requestId, "activities"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const fetchedActivities = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Activity)
      );
      setActivities(fetchedActivities);
    });
    return () => unsubscribe();
  }, [requestId]);

  useEffect(() => {
    if (role === "admin" && request?.adminHasUnreadUpdate) {
      const markAsRead = async () => {
        const docRef = doc(db, "requests", requestId);
        await updateDoc(docRef, {
          adminHasUnreadUpdate: false,
        });
      };
      markAsRead();
    }
  }, [role, request, requestId]);

  const handleManualAddActivity = async () => {
    if (!newActivityMessage.trim() || !user) return;
    setIsLoggingActivity(true);
    const idToken = await user.getIdToken();
    await logActivity(requestId, newActivityMessage, idToken);
    setNewActivityMessage("");
    setIsLoggingActivity(false);
  };

  const handleUpdateAndLog = useCallback(
    async (updateData: object, logMessage: string) => {
      setIsSubmitting(true);
      const docRef = doc(db, "requests", requestId);
      try {
        // We add the adminHasUnreadUpdate flag based on the user's role
        const finalUpdateData = {
          ...updateData,
          adminHasUnreadUpdate: role !== "admin", // true if user updates, false if admin updates
        };
        await updateDoc(docRef, finalUpdateData);
        // The rest of the function remains the same
        if (user && logMessage) {
          const idToken = await user.getIdToken();
          await logActivity(requestId, logMessage, idToken);
        }
        return true;
      } catch (err) {
        console.error("Update and Log Error:", err);
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [requestId, user, role]
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
    else
      openInfoModal("Update Failed", "There was an error updating services.");
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
    } else {
      openInfoModal("Send Failed", "There was an error sending the quotation.");
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
    else openInfoModal("Request Failed", "Could not send revision request.");
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
    else openInfoModal("Approval Failed", "Could not approve revision.");
  };

  const handleAcceptQuotation = async () => {
    const success = await handleUpdateAndLog(
      { status: "Project Approved", lastUpdatedBy: "user" },
      "User accepted the quotation. Project is now approved."
    );
    if (success) openInfoModal("Project Started!", "Quotation accepted!");
    else
      openInfoModal(
        "Acceptance Failed",
        "There was an error accepting the quotation."
      );
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
    else openInfoModal("Request Failed", "Could not submit change request.");
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
        className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClasses}`}
      >
        {currentStatus}
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

  const CommunicationPanel = ({
    request,
    user,
    role,
  }: {
    request: Request;
    user: any;
    role: string;
  }) => {
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
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Template)
          )
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
  };

  const TasksPanel = ({
    requestId,
    user,
    role,
  }: {
    requestId: string;
    user: any;
    role: string;
  }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { openModal: openInfoModal } = useInfoModalStore();

    useEffect(() => {
      if (role !== "admin") return;
      const q = query(
        collection(db, "requests", requestId, "tasks"),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Task))
        );
      });
      return () => unsubscribe();
    }, [requestId, role]);

    const handleAddTask = async (e: FormEvent) => {
      e.preventDefault();
      if (!newTaskTitle.trim() || !user) return;
      setIsSubmitting(true);
      try {
        const idToken = await user.getIdToken();
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ requestId, title: newTaskTitle }),
        });
        if (!response.ok) throw new Error("Failed to add task");
        setNewTaskTitle("");
      } catch (error) {
        openInfoModal("Error", "Could not add the task.");
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleToggleTask = async (task: Task) => {
      if (!user) return;
      try {
        const idToken = await user.getIdToken();
        await fetch("/api/tasks/update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            requestId,
            taskId: task.id,
            isComplete: !task.isComplete,
          }),
        });
      } catch (error) {
        openInfoModal("Error", "Could not update task status.");
      }
    };

    if (role !== "admin") return null;

    return (
      <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
        <h2 className='text-2xl font-semibold mb-4 text-gray-900'>Tasks</h2>
        <form onSubmit={handleAddTask} className='flex gap-2 mb-4'>
          <input
            type='text'
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder='Add a new task...'
            className='flex-grow border-gray-300 rounded-md shadow-sm p-2'
          />
          <button
            type='submit'
            disabled={isSubmitting || !newTaskTitle.trim()}
            className='bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
          >
            <Plus size={20} />
          </button>
        </form>
        <div className='space-y-3'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center p-3 rounded-md transition-colors ${
                task.isComplete
                  ? "bg-green-50 text-gray-500 line-through"
                  : "bg-gray-50"
              }`}
            >
              <button
                onClick={() => handleToggleTask(task)}
                className={`mr-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  task.isComplete
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300"
                }`}
              >
                {task.isComplete && <Check size={16} className='text-white' />}
              </button>
              <span className='flex-grow'>{task.title}</span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className='text-center text-gray-400 py-4'>
              No tasks for this project yet.
            </p>
          )}
        </div>
      </div>
    );
  };
  const BillingPanel = ({
    request,
    user,
    role,
  }: {
    request: Request;
    user: any;
    role: string;
  }) => {
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
            {/* **THE FIX:** Check if quotationPrice exists before rendering the button */}
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
  };

  const LeadScorePanel = ({
    request,
    user,
    role,
  }: {
    request: Request;
    user: any;
    role: string;
  }) => {
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
  };

  

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto space-y-8'>
        <button
          onClick={() => router.back()}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-green-700'
        >
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Dashboard
        </button>

        <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center'>
            <div className='mb-4 sm:mb-0'>
              <h1 className='text-3xl font-bold text-blue-600'>
                {request.name}
              </h1>
              {request.company && (
                <p className='text-md text-gray-600 mt-1 flex items-center'>
                  <Building className='mr-2 h-4 w-4 text-gray-400' />
                  {request.company}
                </p>
              )}
              <p className='text-sm text-gray-500 mt-1'>
                Submitted on{" "}
                {new Date(request.createdAt.toDate()).toLocaleString()}
              </p>
            </div>
            {getStatusChip(request.status)}
          </div>
          {request.tags && request.tags.length > 0 && (
            <div className='mt-4 flex items-center flex-wrap gap-2'>
              <Tag className='h-5 w-5 text-gray-400' />
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

        <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-900'>
            Activity Timeline
          </h2>
          <div className='space-y-6'>
            {activities.map((activity) => (
              <div key={activity.id} className='flex items-start space-x-4'>
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${
                    activity.actorRole === "admin"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                >
                  {activity.actorRole === "admin" ? "A" : "U"}
                </div>
                <div>
                  <p className='text-sm text-gray-500'>
                    <span className='font-bold text-gray-800'>
                      {activity.actorName}
                    </span>{" "}
                    on {new Date(activity.createdAt.toDate()).toLocaleString()}
                  </p>
                  <p className='mt-1 text-gray-700'>{activity.message}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <p className='text-center text-gray-500'>No activities yet.</p>
            )}
          </div>

          <div className='mt-6 border-t pt-6'>
            <h3 className='text-lg font-semibold text-gray-800'>
              Add a Note or Update
            </h3>
            <textarea
              value={newActivityMessage}
              onChange={(e) => setNewActivityMessage(e.target.value)}
              rows={3}
              className='mt-2 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm p-2'
              placeholder='Type your message here...'
            ></textarea>
            <button
              onClick={handleManualAddActivity}
              disabled={isLoggingActivity || !newActivityMessage.trim()}
              className='mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400'
            >
              <MessageSquare className='mr-2 h-4 w-4' />
              {isLoggingActivity ? "Adding..." : "Add Note"}
            </button>
          </div>
        </div>

        <CommunicationPanel request={request} user={user} role={role} />
        <TasksPanel requestId={request.id} user={user} role={role} />
        <BillingPanel request={request} user={user} role={role} />
        <LeadScorePanel request={request} user={user} role={role} />

        <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
          <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
            Service Selection
          </h2>
          {isServiceSelectionLocked && isUserOwner && (
            <div className='p-4 mb-6 bg-yellow-50 border-l-4 border-yellow-400'>
              <p className='text-yellow-700'>
                Service selection is locked. To make changes, please request a
                revision below.
              </p>
            </div>
          )}
          {isNewUserRequest && isUserOwner && !hasSelectedServices && (
            <div className='p-4 mb-6 bg-blue-50 border-l-4 border-blue-400'>
              <p className='text-blue-700'>
                Please select the services you are interested in to request a
                quotation.
              </p>
            </div>
          )}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            {servicesList.map((service) => (
              <button
                key={service}
                onClick={() =>
                  isUserOwner &&
                  !isServiceSelectionLocked &&
                  handleServiceToggle(service)
                }
                disabled={!isUserOwner || isServiceSelectionLocked}
                className={`p-4 rounded-lg text-center font-semibold transition-all duration-200 ${
                  selectedServices.includes(service)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700"
                } ${
                  isUserOwner && !isServiceSelectionLocked
                    ? "hover:bg-gray-200"
                    : "cursor-not-allowed opacity-70"
                }`}
              >
                {service}
              </button>
            ))}
          </div>
          {isUserOwner && !isServiceSelectionLocked && (
            <button
              onClick={handleServiceSubmission}
              disabled={isSubmitting || selectedServices.length === 0}
              className='mt-8 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400'
            >
              {isSubmitting
                ? "Submitting..."
                : "Confirm Services and Request Quotation"}
            </button>
          )}
        </div>

        {isUserOwner && hasSelectedServices && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
              Need to make a change?
            </h2>
            {request.status === "Revision Requested" ? (
              <p className='text-gray-600'>
                Your revision request has been sent. Please wait for the admin
                to approve it.
              </p>
            ) : (
              <>
                <p className='text-gray-600 mb-6'>
                  If you need to add or remove services, please request a
                  revised quotation from the admin.
                </p>
                <button
                  onClick={handleRequestRevision}
                  disabled={isSubmitting}
                  className='w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
                >
                  <RefreshCw className='mr-2 h-5 w-5' />
                  {isSubmitting ? "Requesting..." : "Request Revised Quotation"}
                </button>
              </>
            )}
          </div>
        )}

        {role === "admin" && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            {hasSelectedServices ? (
              <>
                <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
                  Client&apos;s Selected Services
                </h2>
                <ul className='flex flex-wrap gap-2 mb-6'>
                  {request.selectedServices!.map((service) => (
                    <li
                      key={service}
                      className='bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full'
                    >
                      {service}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className='text-gray-500 text-center'>
                The user has not selected any services yet.
              </p>
            )}
            {request.status === "Revision Requested" && (
              <div className='p-4 my-6 bg-orange-50 border-l-4 border-orange-400'>
                <h3 className='font-bold text-orange-800'>
                  Revision Requested
                </h3>
                <p className='text-orange-700 mt-1'>
                  The user wants to change their selected services. Approving
                  this will unlock their selection and reset the current
                  quotation.
                </p>
                <button
                  onClick={handleApproveRevision}
                  disabled={isSubmitting}
                  className='mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg'
                >
                  {isSubmitting ? "Approving..." : "Approve Revision Request"}
                </button>
              </div>
            )}
            {hasSelectedServices && (
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
                  hasQuotation && (
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
                  )
                )}
              </div>
            )}
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

        {request.status === "Project Approved" && (
          <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
            <h2 className='text-2xl font-semibold mb-4 text-gray-900'>
              Post-Approval Changes
            </h2>
            <p className='text-gray-600 mb-6'>
              If you need to make changes to this approved project, please
              submit a request. The admin will review it and get in touch to
              discuss the next steps.
            </p>
            <button
              onClick={handlePostApprovalChangeRequest}
              disabled={isSubmitting}
              className='w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400 flex items-center justify-center'
            >
              <AlertTriangle className='mr-2 h-5 w-5' />
              {isSubmitting
                ? "Submitting..."
                : "Request Changes to Approved Project"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
