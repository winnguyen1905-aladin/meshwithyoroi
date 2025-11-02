import { api } from '../apiClient';

export interface Job {
  id: string;
  jobId: string;
  aladinAddress: string;
  genieAddress: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  contractAddress?: string;
}

export interface CreateJobRequest {
  aladinAddress: string;
  genieAddress: string;
  contractAddress?: string;
}

export interface JobResponse {
  success: boolean;
  data: Job;
  message?: string;
}

export interface JobListResponse {
  success: boolean;
  data: Job[];
  total: number;
  message?: string;
}

/**
 * Lấy danh sách tất cả jobs
 * @param {object} params - Query parameters (address, status, etc.)
 */
export const getJobs = async (params?: {
  address?: string;
  status?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.address) queryParams.append('address', params.address);
  if (params?.status) queryParams.append('status', params.status);
  
  const queryString = queryParams.toString();
  const url = `/job${queryString ? `?${queryString}` : ''}`;
  
  const { data } = await api.get(url);
  return data as JobListResponse;
};

/**
 * Lấy một job theo ID
 * @param {string} jobId - ID của job
 */
export const getJob = async (jobId: string) => {
  const { data } = await api.get(`/job/${jobId}`);
  return data as JobResponse;
};

/**
 * Tạo một job mới
 * @param {CreateJobRequest} payload - Thông tin job
 */
export const createJob = async (payload: CreateJobRequest) => {
  const { data } = await api.post('/job', payload);
  return data as JobResponse;
};

/**
 * Cập nhật job
 * @param {string} jobId - ID của job
 * @param {Partial<Job>} updates - Thông tin cần cập nhật
 */
export const updateJob = async (
  jobId: string,
  updates: Partial<Job>
) => {
  const { data } = await api.patch(`/job/${jobId}`, updates);
  return data as JobResponse;
};

/**
 * Xóa job
 * @param {string} jobId - ID của job
 */
export const deleteJob = async (jobId: string) => {
  const { data } = await api.delete(`/job/${jobId}`);
  return data as { success: boolean; message?: string };
};
