'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-job';
import type { Job } from '@/app/api/job/jobService';

export default function JobPage() {
  const router = useRouter();
  const { wallet, isAuthenticated } = useAuth();
  
  // Sử dụng hook để lấy jobs với address của wallet hiện tại (nếu có)
  const { data: jobsResponse, isLoading } = useJobs(
    wallet?.address ? { address: wallet.address } : undefined
  );
  
  // Xử lý và sắp xếp jobs
  const jobs = useMemo(() => {
    const jobList = jobsResponse?.data || [];
    
    // Sắp xếp theo thời gian cập nhật gần nhất (recent first)
    return jobList.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  }, [jobsResponse]);

  const handleJobClick = (jobId: string) => {
    router.push(`/job/${jobId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Jobs</h1>
          <p className="text-gray-600">Please connect your wallet to view jobs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Recent Conversations</h1>
        <p className="text-gray-600">Your recent job conversations</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No recent conversations</p>
          <p className="text-sm text-gray-500">Start a new conversation to see it here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => handleJobClick(job.id)}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    Job #{job.jobId}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Aladin:</span>{' '}
                      <span className="font-mono text-xs">
                        {job.aladinAddress.slice(0, 20)}...
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Genie:</span>{' '}
                      <span className="font-mono text-xs">
                        {job.genieAddress.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(job.status)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                <span>Created: {formatDate(job.createdAt)}</span>
                {job.updatedAt !== job.createdAt && (
                  <span>Updated: {formatDate(job.updatedAt)}</span>
                )}
              </div>

              {job.contractAddress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Contract: <span className="font-mono">{job.contractAddress.slice(0, 30)}...</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
