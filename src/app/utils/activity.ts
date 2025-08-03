// app/utils/activity.ts
export const logActivity = async (
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
