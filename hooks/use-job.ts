'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  type Job,
  type CreateJobRequest,
} from '@/app/api/job/jobService';

/**
 * Hook để lấy danh sách jobs
 */
export function useJobs(params?: {
  address?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => getJobs(params),
    enabled: !!params?.address, // Chỉ fetch khi có address
  });
}

/**
 * Hook để lấy một job theo ID
 */
export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => {
      if (!jobId) throw new Error('Job ID is required');
      return getJob(jobId);
    },
    enabled: !!jobId,
  });
}

/**
 * Hook để tạo job mới
 */
export function useCreateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateJobRequest) => createJob(payload),
    onSuccess: (data) => {
      // Invalidate và refetch danh sách jobs
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Thêm job mới vào cache nếu có jobId
      if (data.success && data.data) {
        queryClient.setQueryData(['job', data.data.id], data);
      }
    },
    onError: (error) => {
      console.error('Error creating job:', error);
    },
  });
}

/**
 * Hook để cập nhật job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: Partial<Job> }) =>
      updateJob(jobId, updates),
    onSuccess: (data, variables) => {
      // Invalidate queries để refetch
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      
      // Cập nhật cache trực tiếp nếu có
      if (data.success && data.data) {
        queryClient.setQueryData(['job', variables.jobId], data);
      }
    },
    onError: (error) => {
      console.error('Error updating job:', error);
    },
  });
}

/**
 * Hook để xóa job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),
    onSuccess: (_, jobId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      // Xóa job khỏi cache
      queryClient.removeQueries({ queryKey: ['job', jobId] });
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
    },
  });
}

/**
 * Hook tổng hợp để sử dụng các chức năng job
 */
export function useJobOperations() {
  const queryClient = useQueryClient();
  
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();
  
  /**
   * Lọc jobs theo status từ cache
   */
  const getJobsByStatus = (status: Job['status']) => {
    const jobsData = queryClient.getQueryData<{ data: Job[] }>(['jobs']);
    if (!jobsData?.data) return [];
    return jobsData.data.filter((job) => job.status === status);
  };
  
  /**
   * Lọc jobs theo address từ cache
   */
  const getJobsByAddress = (address: string) => {
    const jobsData = queryClient.getQueryData<{ data: Job[] }>(['jobs']);
    if (!jobsData?.data) return [];
    return jobsData.data.filter(
      (job) => job.aladinAddress === address || job.genieAddress === address
    );
  };
  
  return {
    createJob: createJobMutation.mutate,
    updateJob: updateJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
    createJobAsync: createJobMutation.mutateAsync,
    updateJobAsync: updateJobMutation.mutateAsync,
    deleteJobAsync: deleteJobMutation.mutateAsync,
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending,
    isDeleting: deleteJobMutation.isPending,
    getJobsByStatus,
    getJobsByAddress,
  };
}
