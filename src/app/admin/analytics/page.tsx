/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";
import { BarChart, TrendingUp, PieChart } from "lucide-react";

interface FunnelStage {
  name: string;
  count: number;
}

interface ServiceData {
  name: string;
  count: number;
}

const AnalyticsPage = () => {
  const { user, role } = useAuth();
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]); // New state for service data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || role !== "admin") {
        setLoading(false);
        return;
      }
      try {
        const idToken = await user.getIdToken();
        const headers = { Authorization: `Bearer ${idToken}` };

        // Fetch both sets of data concurrently
        const [funnelRes, serviceRes] = await Promise.all([
          fetch("/api/analytics/funnel", { headers }),
          fetch("/api/analytics/services", { headers }),
        ]);

        if (!funnelRes.ok || !serviceRes.ok) {
          throw new Error("Failed to fetch all analytics data.");
        }

        const funnelJson = await funnelRes.json();
        const serviceJson = await serviceRes.json();

        setFunnelData(funnelJson.funnelData);
        setServiceData(serviceJson.serviceData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, role]);

  const maxFunnelCount = Math.max(...funnelData.map((d) => d.count), 0);
  const maxServiceCount = Math.max(...serviceData.map((d) => d.count), 0);

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p>Loading analytics...</p>
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
  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>{error}</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-100 p-4 sm:p-8'>
      <div className='max-w-4xl mx-auto'>
        <header className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 flex items-center'>
            <TrendingUp className='mr-3 text-blue-600' /> Analytics Dashboard
          </h1>
          <p className='text-gray-500 mt-2'>
            An overview of your sales and service performance.
          </p>
        </header>

        <div className='grid grid-cols-1 gap-8'>
          {/* Sales Funnel Chart */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-6 flex items-center'>
              <BarChart className='mr-2 text-gray-500' /> Sales Funnel by Lead
              Status
            </h2>
            <div className='space-y-4'>
              {funnelData.map((stage) => (
                <div key={stage.name} className='flex items-center'>
                  <div className='w-1/3 text-sm font-medium text-gray-600 truncate pr-4'>
                    {stage.name}
                  </div>
                  <div className='w-2/3 flex items-center'>
                    <div className='w-full bg-gray-200 rounded-full h-6'>
                      <div
                        className='bg-blue-600 h-6 rounded-full'
                        style={{
                          width:
                            maxFunnelCount > 0
                              ? `${(stage.count / maxFunnelCount) * 100}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <span className='ml-4 font-bold text-gray-800'>
                      {stage.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Service Popularity Chart */}
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <h2 className='text-2xl font-semibold text-gray-800 mb-6 flex items-center'>
              <PieChart className='mr-2 text-gray-500' /> Service Popularity
            </h2>
            <div className='space-y-4'>
              {serviceData.map((service) => (
                <div key={service.name} className='flex items-center'>
                  <div className='w-1/3 text-sm font-medium text-gray-600 truncate pr-4'>
                    {service.name}
                  </div>
                  <div className='w-2/3 flex items-center'>
                    <div className='w-full bg-gray-200 rounded-full h-6'>
                      <div
                        className='bg-green-600 h-6 rounded-full'
                        style={{
                          width:
                            maxServiceCount > 0
                              ? `${(service.count / maxServiceCount) * 100}%`
                              : "0%",
                        }}
                      ></div>
                    </div>
                    <span className='ml-4 font-bold text-gray-800'>
                      {service.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {serviceData.length === 0 && (
              <p className='text-center text-gray-500 py-8'>
                No service data available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
