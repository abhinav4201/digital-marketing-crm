"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import {
  collection,
  query,
  orderBy,
  startAfter,
  limit,
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { MessageSquare } from "lucide-react";
import { logActivity } from "../../utils/activity";

interface Activity {
  id: string;
  message: string;
  actorName: string;
  actorRole: "user" | "admin" | "sales_rep" | "support_agent";
  createdAt: {
    toDate: () => Date;
  };
}

export default function ActivityTimeline({ requestId }: { requestId: string }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivityMessage, setNewActivityMessage] = useState("");
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [lastVisible, setLastVisible] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Listener for latest activities (real-time)
  useEffect(() => {
    if (!requestId) return;

    const latestQuery = query(
      collection(db, "requests", requestId, "activities"),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribe = onSnapshot(latestQuery, (snapshot) => {
      const newActivities = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Activity)
      );
      setActivities(newActivities); // Reset activities to show latest
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(newActivities.length === 5);
    });

    return () => unsubscribe();
  }, [requestId]);

  // Function to load more activities (pagination)
  const loadMoreActivities = useCallback(() => {
    if (!requestId || !hasMore || !lastVisible) return;

    const nextQuery = query(
      collection(db, "requests", requestId, "activities"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(5)
    );

    const unsubscribe = onSnapshot(nextQuery, (snapshot) => {
      const newActivities = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as Activity)
      );
      setActivities((prev) => [...prev, ...newActivities]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(newActivities.length === 5);
    });

    return () => unsubscribe();
  }, [requestId, hasMore, lastVisible]);

  const handleManualAddActivity = async () => {
    if (!newActivityMessage.trim() || !user) return;
    setIsLoggingActivity(true);
    const idToken = await user.getIdToken();
    await logActivity(requestId, newActivityMessage, idToken);
    setNewActivityMessage("");
    setIsLoggingActivity(false);
  };

  return (
    <div className='bg-white p-6 rounded-lg shadow-md border border-gray-200'>
      <h2 className='text-2xl font-semibold mb-6 text-gray-900'>
        Activity Timeline
      </h2>
      <div className='space-y-6'>
        {activities.map((activity) => (
          <div key={activity.id} className='flex items-start space-x-4'>
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white ${
                activity.actorRole === "admin" ? "bg-red-500" : "bg-blue-500"
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
      {hasMore && (
        <div className='text-center mt-6'>
          <button
            onClick={loadMoreActivities}
            className='text-blue-600 hover:underline'
          >
            Load More
          </button>
        </div>
      )}

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
  );
}
