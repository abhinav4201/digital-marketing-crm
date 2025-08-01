/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Define the structure of a lead/request
interface Lead {
  id: string;
  name: string;
  company?: string;
  createdAt: Timestamp;
  status: string;
}

// Define the pipeline stages
const STAGES = [
  "Service Selection Pending",
  "Services Selected",
  "Quotation Sent",
  "Revision Requested",
  "Project Approved",
  // Add any other statuses you want as columns
];

// Draggable Lead Card Component
const LeadCard = ({ lead }: { lead: Lead }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lead.id });
  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='bg-white p-4 mb-4 rounded-lg shadow-sm border border-gray-200 touch-none'
    >
      <div className='flex justify-between items-center'>
        <div className='flex-grow'>
          <p className='font-bold text-gray-800'>{lead.name}</p>
          <p className='text-sm text-gray-500'>
            {lead.company || "No company"}
          </p>
        </div>
        <div
          {...attributes}
          {...listeners}
          className='cursor-grab p-2 text-gray-400'
        >
          <GripVertical size={16} />
        </div>
      </div>
    </div>
  );
};

// Pipeline Page Component
const PipelinePage = () => {
  const { user, role } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role !== "admin") {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            status: doc.data().status || "Service Selection Pending",
            ...doc.data(),
          } as Lead)
      );
      setLeads(fetchedLeads);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeLead = leads.find((l) => l.id === active.id);
      const overColumnStatus = over.id as string;

      if (activeLead && activeLead.status !== overColumnStatus) {
        const oldStatus = activeLead.status;

        // Optimistic UI update
        setLeads((prevLeads) => {
          const activeIndex = prevLeads.findIndex((l) => l.id === active.id);
          const updatedLead = {
            ...prevLeads[activeIndex],
            status: overColumnStatus,
          };
          const newLeads = [...prevLeads];
          newLeads[activeIndex] = updatedLead;
          return newLeads;
        });

        // API call to update backend
        if (!user) return;
        try {
          const idToken = await user.getIdToken();
          await fetch("/api/requests/update-status", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              requestId: active.id,
              newStatus: overColumnStatus,
              oldStatus: oldStatus,
            }),
          });
        } catch (error) {
          console.error("Failed to update status:", error);
          // Revert UI on failure
          setLeads((prevLeads) => {
            const activeIndex = prevLeads.findIndex((l) => l.id === active.id);
            const revertedLead = {
              ...prevLeads[activeIndex],
              status: oldStatus,
            };
            const newLeads = [...prevLeads];
            newLeads[activeIndex] = revertedLead;
            return newLeads;
          });
        }
      }
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading pipeline...</p>
      </div>
    );
  }

  if (role !== "admin" && role !== "sales_rep") {
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
      <header className='mb-8'>
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900'>
          Sales Pipeline
        </h1>
        <p className='text-gray-500 mt-2'>
          Drag and drop leads to update their status.
        </p>
      </header>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
          {STAGES.map((stage) => (
            <div key={stage} className='bg-gray-200 p-4 rounded-lg'>
              <h2 className='font-bold text-lg text-gray-700 mb-4'>{stage}</h2>
              <SortableContext
                id={stage}
                items={leads.filter((l) => l.status === stage).map((l) => l.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className='min-h-[200px]'>
                  {leads
                    .filter((l) => l.status === stage)
                    .map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
};

export default PipelinePage;
