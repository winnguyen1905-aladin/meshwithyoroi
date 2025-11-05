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
  const [role, setRole] = useState<'aladin' | 'genie' | undefined>(undefined);
  const [skip, setSkip] = useState<number>(0);
  const [take, setTake] = useState<number>(10);
  
  // Build query params - only include valid values
  const queryParams = useMemo(() => {
    const params: {
      address?: string;
      role?: 'aladin' | 'genie';
      skip?: number;
      take?: number;
    } = {};
    
    if (wallet?.address) {
      params.address = wallet.address;
    }
    
    if (role) {
      params.role = role;
    }
    
    // Only include skip if it's a valid number >= 0
    const skipNum = Number(skip);
    if (!isNaN(skipNum) && skipNum >= 0) {
      params.skip = skipNum;
    }
    
    // Only include take if it's a valid number > 0
    const takeNum = Number(take);
    if (!isNaN(takeNum) && takeNum > 0) {
      params.take = takeNum;
    }
    
    // Return undefined if no params to avoid unnecessary API calls
    return Object.keys(params).length > 0 ? params : undefined;
  }, [wallet?.address, role, skip, take]);
  
  // Sử dụng hook để lấy jobs với params đã được validate
  const { data: jobsResponse, isLoading, refetch } = useJobs(queryParams);
  
  // Xử lý và sắp xếp jobs
  const jobs = useMemo(() => {
    // Response structure: { data: { data: Job[], total, skip, take } }
    const jobList = jobsResponse?.data?.data || [];
    
    // Sắp xếp theo thời gian cập nhật gần nhất (recent first)
    return jobList.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [jobsResponse]);
  
  // Get total count for pagination
  const totalCount = jobsResponse?.data?.total || 0;

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

      {/* Filters and Pagination */}
      <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
            Role:
          </label>
          <select
            id="role-filter"
            value={role || ''}
            onChange={(e) => {
              setRole(e.target.value === '' ? undefined : e.target.value as 'aladin' | 'genie');
              setSkip(0); // Reset pagination when filter changes
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="aladin">Aladin</option>
            <option value="genie">Genie</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="take-input" className="text-sm font-medium text-gray-700">
            Per page:
          </label>
          <input
            id="take-input"
            type="number"
            min="1"
            max="100"
            value={take}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Handle empty input - keep current value
              if (inputValue === '') return;
              
              const value = parseInt(inputValue, 10);
              // Only update if valid number and > 0
              if (!isNaN(value) && isFinite(value) && value > 0 && value <= 100) {
                setTake(value);
                setSkip(0); // Reset to first page
              }
            }}
            onBlur={(e) => {
              // Ensure value is valid on blur
              const value = parseInt(e.target.value, 10);
              if (isNaN(value) || value <= 0 || value > 100) {
                setTake(10); // Reset to default
              }
            }}
            className="w-20 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const skipNum = Number(skip);
              const takeNum = Number(take);
              if (!isNaN(skipNum) && !isNaN(takeNum) && takeNum > 0) {
                setSkip(Math.max(0, skipNum - takeNum));
              }
            }}
            disabled={skip === 0 || isLoading || isNaN(Number(skip)) || isNaN(Number(take))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {!isNaN(Number(skip)) && !isNaN(Number(take)) && Number(take) > 0 
              ? Math.floor(Number(skip) / Number(take)) + 1 
              : 1}{' '}
            ({totalCount > 0 ? `${skip + 1}-${Math.min(skip + take, totalCount)} of ${totalCount}` : '0'} jobs)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const skipNum = Number(skip);
              const takeNum = Number(take);
              if (!isNaN(skipNum) && !isNaN(takeNum) && takeNum > 0) {
                setSkip(skipNum + takeNum);
              }
            }}
            disabled={
              isLoading || 
              isNaN(Number(skip)) || 
              isNaN(Number(take)) ||
              (skip + take >= totalCount)
            }
          >
            Next
          </Button>
        </div>
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
