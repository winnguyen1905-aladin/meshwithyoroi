'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';

import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getJobMessages,
  getConversations,
  markMessagesRead,
  type Job,
  type CreateJobRequest,
  type JobListResponse,
  type ChatMessageTransport,
  type ConversationSummary,
  type MarkMessagesReadRequest,
} from '@/app/api/job/jobService';

import { useChatE2ee } from './use-e2ee';
import { useChatStore } from '@/store/use-chat.store';

// =====================
// Types
// =====================

export interface JobsParams {
  address?: string;
  status?: string;
  role?: 'aladin' | 'genie';
  skip?: number;
  take?: number;
}

interface MarkReadParams {
  jobId: string;
  messageIds: string[];
}

interface UpdateJobParams {
  jobId: string;
  updates: Partial<Job>;
}

// =====================
// Query Hooks
// =====================

/**
 * Fetch list of jobs with optional filters
 */
export function useJobs(params?: JobsParams) {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: () => getJobs(params),
    staleTime: 30000, // Cache 30 seconds
  });
}

/**
 * Fetch a single job by ID
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
 * Fetch conversations list for a wallet address
 */
export function useConversations(address: string | undefined) {

  const { decodeMessage } = useChatE2ee();

  return useQuery<{ data: ConversationSummary[] }>({
    queryKey: ['conversations', address],
    queryFn: async () => {
      if (!address) throw new Error('Address is required');
      const res = await getConversations(address);
      
      // Decrypt message previews for UI
      res.data = res.data.map((conversation) => {
        if (
          conversation.lastMessageEnc &&
          conversation.lastMessageNonce &&
          conversation.lastSenderPublicKey
        ) {
          try {
            const plaintext = decodeMessage(
              conversation.lastMessageEnc,
              Buffer.from(conversation.lastSenderPublicKey, 'base64'),
              Buffer.from(conversation.lastMessageNonce, 'base64')
            );
            const preview = plaintext
              ? new TextDecoder().decode(plaintext)
              : '';
            
            return {
              ...conversation,
              lastMessage: preview,
            } as ConversationSummary & { lastMessage: string };
          } catch {
            // Silently fail decryption for preview
          }
        }
        return conversation;
      });
      
      return res;
    },
    enabled: !!address,
    staleTime: 30000,
  });
}

/**
 * Infinite query for job messages with decryption
 */
export function useJobMessagesInfinite(jobId: string | undefined) {
  const { decodeMessage } = useChatE2ee();
  const addMessage = useChatStore((state) => state.addMessage);

  return useInfiniteQuery({
    queryKey: ['job-messages', jobId],
    initialPageParam: 0 as number,
    queryFn: async ({ pageParam }) => {
      if (!jobId) throw new Error('Job ID is required');
      
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      const res = await getJobMessages(jobId, { offset });
      
      // Decrypt and hydrate store for UI (align shape with socket messages)
      (res.data.data as ChatMessageTransport[]).forEach((message) => {
        try {
          const senderPublicKeyBytes = Buffer.from(message.senderPublicKey, 'base64');
          const nonceBytes = new Uint8Array(Buffer.from(message.nonce, 'base64'));

          const plaintext = decodeMessage(
            message.encryptedContent,
            senderPublicKeyBytes,
            nonceBytes);

          const isDecrypted = !!plaintext;
          const content = isDecrypted
            ? new TextDecoder().decode(plaintext as Uint8Array)
            : '[Failed to decrypt]';

          addMessage(message.jobId, {
            id: message.id,
            senderId: message.senderId,
            jobId: message.jobId,
            nonce: message.nonce,
            content,
            timestamp: new Date(message.createdAt).getTime(),
            messageType: 'text',
            metadata: {
              encrypted: true,
              decrypted: isDecrypted,
              senderPublicKey: message.senderPublicKey,
              // Keep original transport fields for potential debugging/UI
              transport: {
                nonceBase64: message.nonce,
                encryptedContent: true,
              },
            },
          });
        } catch (error) {
          addMessage(message.jobId, {
            id: message.id,
            senderId: message.senderId,
            jobId: message.jobId,
            nonce: message.nonce,
            content: '[Decryption error]',
            timestamp: new Date(message.createdAt).getTime(),
            messageType: 'text',
            metadata: {
              encrypted: true,
              decryptionError:
                error instanceof Error ? error.message : 'Unknown error',
              senderPublicKey: message.senderPublicKey,
            },
          });
        }
      });

      return res;
    },
    getNextPageParam: (lastPage) =>
      lastPage.data.hasMore
        ? lastPage.data.offset + lastPage.data.limit
        : undefined,
    enabled: !!jobId,
  });
}

// =====================
// Mutation Hooks
// =====================

/**
 * Create a new job
 */
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobRequest) => createJob(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (data.data?.id) {
        queryClient.setQueryData(['job', data.data.id], data);
      }
    },
    onError: (error) => {
      console.error('Error creating job:', error);
    },
  });
}

/**
 * Update an existing job
 */
export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, updates }: UpdateJobParams) =>
      updateJob(jobId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.jobId] });
      
      if (data.data) {
        queryClient.setQueryData(['job', variables.jobId], data);
      }
    },
    onError: (error) => {
      console.error('Error updating job:', error);
    },
  });
}

/**
 * Delete a job
 */
export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (jobId: string) => deleteJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.removeQueries({ queryKey: ['job', jobId] });
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
    },
  });
}

/**
 * Mark messages as read for a job
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, messageIds }: MarkReadParams) => {
      const payload: MarkMessagesReadRequest = { messageIds };
      return markMessagesRead(jobId, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['job-messages', variables.jobId],
      });
    },
    onError: (error) => {
      console.error('Error marking messages as read:', error);
    },
  });
}

// =====================
// Combined Operations Hook
// =====================

/**
 * Combined hook for all job operations with cache helpers
 */
export function useJobOperations() {
  const queryClient = useQueryClient();
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const deleteJobMutation = useDeleteJob();

  /**
   * Get jobs by status from cache
   */
  const getJobsByStatus = (status: Job['status']): Job[] => {
    const jobsData = queryClient.getQueryData<JobListResponse>(['jobs']);
    if (!jobsData?.data?.data) return [];
    return jobsData.data.data.filter((job) => job.status === status);
  };

  /**
   * Get jobs by address from cache
   */
  const getJobsByAddress = (address: string): Job[] => {
    const jobsData =
      queryClient.getQueryData<JobListResponse>(['jobs']);
    
    if (!jobsData?.data?.data) return [];
    
    return jobsData.data.data.filter(
      (job) => job.aladinId === address || job.genieId === address
    );
  };

  return {
    // Mutations
    createJob: createJobMutation.mutate,
    updateJob: updateJobMutation.mutate,
    deleteJob: deleteJobMutation.mutate,
    
    // Async mutations
    createJobAsync: createJobMutation.mutateAsync,
    updateJobAsync: updateJobMutation.mutateAsync,
    deleteJobAsync: deleteJobMutation.mutateAsync,
    
    // Loading states
    isCreating: createJobMutation.isPending,
    isUpdating: updateJobMutation.isPending,
    isDeleting: deleteJobMutation.isPending,
    
    // Cache helpers
    getJobsByStatus,
    getJobsByAddress,
  };
}