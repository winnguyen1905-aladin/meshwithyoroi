'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useJobs } from '@/hooks/use-job';
import type { Job } from '@/app/api/job/jobService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreateJobForm } from './create-job-form';

export default function JobPage() {
  const router = useRouter();
  const { wallet, isAuthenticated } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Sử dụng hook để lấy jobs với address của wallet hiện tại (nếu có)
  const { data: jobsResponse, isLoading, refetch } = useJobs(
    wallet?.address ? { address: wallet.address } : undefined
  );
  
  // Xử lý và sắp xếp jobs
  const jobs = useMemo(() => {
    const jobList = jobsResponse?.data || [];
    
    // Sắp xếp theo thời gian cập nhật gần nhất (recent first)
    return jobList.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
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
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
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

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    refetch();
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Jobs</h1>
          <p className="text-gray-600">Manage your job postings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <CreateJobForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No jobs found</p>
          <p className="text-sm text-gray-500 mb-4">Create your first job to get started</p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Job</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <CreateJobForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateDialogOpen(false)} />
            </DialogContent>
          </Dialog>
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
                    {job.title || `Job #${job.id.slice(0, 8)}`}
                  </h3>
                  {job.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Aladin ID:</span>{' '}
                      <span className="font-mono text-xs">
                        {job.aladinId.slice(0, 20)}...
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Genie ID:</span>{' '}
                      <span className="font-mono text-xs">
                        {job.genieId.slice(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(job.status)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                {job.createdAt && <span>Created: {formatDate(job.createdAt)}</span>}
                {job.updatedAt && job.updatedAt !== job.createdAt && (
                  <span>Updated: {formatDate(job.updatedAt)}</span>
                )}
              </div>

              {job.onchainAddress && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Onchain Address: <span className="font-mono">{job.onchainAddress.slice(0, 30)}...</span>
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
