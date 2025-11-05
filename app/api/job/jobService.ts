import { api } from '../apiClient';

// API prefix for all job-related endpoints
const API_PREFIX = '/jobs';

export interface Job {
  id: string;
  aladinId: string;
  genieId: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  onchainAddress: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateJobRequest {
  aladinId: string;
  genieId: string;
  title: string;
  description: string;
}

export interface JobResponse {
  data: Job;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface JobListResponse {
  data: {
    data: Job[];
    total: number;
    skip?: number;
    take?: number;
  };
  message: string;
  statusCode: number;
  timestamp: string;
}

// =====================
// Chat types (encrypted transport + UI-friendly)
// =====================

export interface ChatMessageTransport {
  id: string;
  jobId: string;
  senderId: string;
  createdAt: string;
  updatedAt?: string;
  // Encrypted payload
  encryptedContent: string; // base64 or hex string
  nonce: string; // base64 or hex string
  senderPublicKey: string; // base64 or hex string
  // Optional fields for extensibility
  isEdited?: boolean;
  editedAt?: string;
  replyTo?: string; // messageId being replied to
  messageType?: 'text' | 'file' | 'image' | 'audio' | 'system';
  attachments?: Array<{
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  jobId: string;
  senderId: string;
  createdAt: string;
  content: string; // decrypted plaintext for UI
  status?: 'sending' | 'sent' | 'error';
}

export interface ConversationSummary {
  jobId: string;
  title: string;
  lastMessageAt: string;
  lastSenderId: string;
  // Encrypted preview from backend; FE may decrypt for display
  lastMessageEnc?: string;
  lastMessageNonce?: string;
  lastSenderPublicKey?: string;
  unreadCount: number;
  status: Job['status'];
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string | null;
  total?: number;
}

export interface GetMessagesParams {
  offset?: number;
  limit?: number;
}

export interface SendJobMessageRequest {
  encryptedContent: string;
  nonce: string;
  senderPublicKey: string;
}

export interface SendJobMessageResponse {
  data: ChatMessageTransport;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Mark messages as read for a job
 */
export interface MarkMessagesReadRequest {
  messageIds: string[];
  readAt?: string;
}

export interface MarkMessagesReadResponse {
  success: boolean;
  messageIds: string[];
  jobId: string;
  readAt: string;
}

/**
 * Get peer public key for E2EE
 */
export interface PeerPublicKeyResponse {
  jobId: string;
  peerAddress: string;
  publicKey: string; // base64 encoded
  keyType?: 'ed25519';
}

/**
 * Update/edit a message (encrypted)
 */
export interface UpdateJobMessageRequest {
  encryptedContent: string;
  nonce: string;
  senderPublicKey: string;
}

export interface UpdateJobMessageResponse {
  data: ChatMessageTransport;
  message: string;
  statusCode: number;
}

/**
 * Delete a message
 */
export interface DeleteJobMessageResponse {
  success: boolean;
  messageId: string;
  jobId: string;
  deletedAt: string;
}

/**
 * Get unread count for a job
 */
export interface UnreadCountResponse {
  jobId: string;
  unreadCount: number;
  lastReadMessageId?: string;
  lastReadAt?: string;
}

/**
 * Lấy danh sách tất cả jobs
 * @param {object} params - Query parameters (address, status, role, skip, take)
 */
export const getJobs = async (params?: {
  address?: string;
  status?: string;
  role?: 'aladin' | 'genie';
  skip?: number;
  take?: number;
}) => {
  const queryParams = new URLSearchParams();
  
  if (params?.address) queryParams.append('address', params.address);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.role) queryParams.append('role', params.role);
  
  // Validate skip: must be a valid number >= 0
  if (params?.skip !== undefined && params.skip !== null) {
    const skipValue = Number(params.skip);
    if (!isNaN(skipValue) && skipValue >= 0) {
      queryParams.append('skip', String(skipValue));
    }
  }
  
  // Validate take: must be a valid number > 0
  if (params?.take !== undefined && params.take !== null) {
    const takeValue = Number(params.take);
    if (!isNaN(takeValue) && takeValue > 0) {
      queryParams.append('take', String(takeValue));
    }
  }
  
  const queryString = queryParams.toString();
  const url = `${API_PREFIX}${queryString ? `?${queryString}` : ''}`;
  
  const { data } = await api.get(url);
  return data as JobListResponse;
};

/**
 * Lấy một job theo ID
 * @param {string} jobId - ID của job
 */
export const getJob = async (jobId: string) => {
  const { data } = await api.get(`${API_PREFIX}/${jobId}`);
  return data as JobResponse;
};

/**
 * Tạo một job mới
 * @param {CreateJobRequest} payload - Thông tin job
 */
export const createJob = async (payload: CreateJobRequest) => {
  const { data } = await api.post(API_PREFIX, payload);
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
  const { data } = await api.patch(`${API_PREFIX}/${jobId}`, updates);
  return data as JobResponse;
};

/**
 * Xóa job
 * @param {string} jobId - ID của job
 */
export const deleteJob = async (jobId: string) => {
  const { data } = await api.delete(`${API_PREFIX}/${jobId}`);
  return data as { success: boolean; message?: string };
};

// =====================
// Chat APIs
// =====================

/**
 * Lấy lịch sử tin nhắn (encrypted) của một job
 */
export const getJobMessages = async (
  jobId: string,
  params?: GetMessagesParams
) => {
  const queryParams = new URLSearchParams();
  if (params?.offset !== undefined) queryParams.append('offset', String(params.offset));
  if (params?.limit !== undefined) queryParams.append('limit', String(params.limit));
  const qs = queryParams.toString();
  const url = `${API_PREFIX}/${jobId}/messages${qs ? `?${qs}` : ''}`;
  const { data } = await api.get(url);
  return data as {
    data: {
      data: ChatMessageTransport[];
      total: number;
      remaining: number;
      hasMore: boolean;
      limit: number;
      offset: number;
    };
    message: string;
    statusCode: number;
    timestamp: string;
  };
};

/**
 * Gửi tin nhắn (encrypted) cho một job
 */
export const sendJobMessage = async (
  jobId: string,
  payload: SendJobMessageRequest
) => {
  const { data } = await api.post(`${API_PREFIX}/${jobId}/messages`, payload);
  return data as SendJobMessageResponse;
};

/**
 * Lấy danh sách hội thoại (conversations) cho một địa chỉ ví
 * Sắp xếp theo lastMessageAt desc ở BE (nếu có) hoặc FE tự sắp xếp
 */
// TODO: ở đây có thể thiết kế theo kiểu channel cho từng job
export const getConversations = async (address: string) => {
  const queryParams = new URLSearchParams();
  queryParams.append('address', address);
  const { data } = await api.get(`${API_PREFIX}/jobs/channels?${queryParams.toString()}`);
  return data as { data: ConversationSummary[] };
};

/**
 * Mark messages as read for a job
 */
export const markMessagesRead = async (
  jobId: string,
  payload: MarkMessagesReadRequest
) => {
  const { data } = await api.post(`${API_PREFIX}/${jobId}/messages/read`, payload);
  return data as MarkMessagesReadResponse;
};

/**
 * Get peer public key for E2EE encryption
 * This is essential for resolving the recipient's public key
 */
export const getPeerPublicKey = async (
  jobId: string,
  peerAddress: string
) => {
  const queryParams = new URLSearchParams();
  queryParams.append('peerAddress', peerAddress);
  const { data } = await api.get(`${API_PREFIX}/${jobId}/peer-key?${queryParams.toString()}`);
  return data as PeerPublicKeyResponse;
};

/**
 * Update/edit a message (encrypted)
 */
export const updateJobMessage = async (
  jobId: string,
  messageId: string,
  payload: UpdateJobMessageRequest
) => {
  const { data } = await api.patch(`${API_PREFIX}/${jobId}/messages/${messageId}`, payload);
  return data as UpdateJobMessageResponse;
};

/**
 * Delete a message
 */
export const deleteJobMessage = async (
  jobId: string,
  messageId: string
) => {
  const { data } = await api.delete(`${API_PREFIX}/${jobId}/messages/${messageId}`);
  return data as DeleteJobMessageResponse;
};

/**
 * Get unread message count for a job
 */
export const getUnreadCount = async (jobId: string) => {
  const { data } = await api.get(`${API_PREFIX}/${jobId}/messages/unread`);
  return data as UnreadCountResponse;
};

/**
 * Batch mark messages as read across multiple jobs
 */
export interface BatchMarkReadRequest {
  jobId: string;
  messageIds: string[];
}

export interface BatchMarkReadResponse {
  success: boolean;
  results: Array<{
    jobId: string;
    messageIds: string[];
    readAt: string;
  }>;
}

export const batchMarkMessagesRead = async (
  requests: BatchMarkReadRequest[]
) => {
  const { data } = await api.post(`${API_PREFIX}/messages/batch-read`, { requests });
  return data as BatchMarkReadResponse;
};

/**
 * Error response type for chat operations
 */
export interface ChatErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  jobId?: string;
  timestamp: string;
}

// =====================
// Helper utilities for type conversion
// =====================

/**
 * Convert ChatMessageTransport (encrypted from API) to MessagePayload format
 * Used for compatibility with chat context and socket events
 */
export const transportToMessagePayload = (
  transport: ChatMessageTransport
): import('@/types/chat-response.type').MessagePayload => {
  return {
    id: transport.id,
    senderId: transport.senderId,
    jobId: transport.jobId,
    nonce: transport.nonce,
    content: transport.encryptedContent, // Encrypted content in MessagePayload.content
    timestamp: new Date(transport.createdAt).getTime(),
    messageType: transport.messageType || 'text',
    isEdited: transport.isEdited,
    editedAt: transport.editedAt ? new Date(transport.editedAt).getTime() : undefined,
    attachments: transport.attachments,
    metadata: {
      ...transport.metadata,
      senderPublicKey: transport.senderPublicKey,
      encrypted: true,
      replyTo: transport.replyTo,
      updatedAt: transport.updatedAt,
    },
  };
};

/**
 * Convert MessagePayload (from socket/context) to ChatMessageTransport
 * Used when sending messages via REST API
 */
export const messagePayloadToTransport = (
  payload: import('@/types/chat-response.type').MessagePayload
): SendJobMessageRequest => {
  return {
    encryptedContent: payload.content,
    nonce: payload.nonce,
    senderPublicKey: payload.metadata?.senderPublicKey || '',
  };
};
