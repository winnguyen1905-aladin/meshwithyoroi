import { create } from 'zustand';
import { MessagePayload } from '@/types/chat-response.type';

interface ChatStoreState {
  clearMessages: (jobId: string) => void;
  messagesByJob: Map<string, MessagePayload[]>;
  getMessages: (jobId: string) => MessagePayload[];
  addMessage: (jobId: string, message: MessagePayload) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  clearMessages: (jobId: string) => set((state) => ({
    messagesByJob: new Map(state.messagesByJob.set(jobId, [])),
  })),
  messagesByJob: new Map(),
  addMessage: (jobId: string, message: MessagePayload) => set((state) => ({
    messagesByJob: new Map(state.messagesByJob.set(jobId, [...(state.messagesByJob.get(jobId) || []), message])),
  })),
  getMessages: (jobId: string) => get().messagesByJob.get(jobId) || [],
}));

// Stable empty array to avoid creating a new array reference per render
const EMPTY_MESSAGES: MessagePayload[] = [];

export const useJobMessages = (jobId: string) => 
  useChatStore((state) => state.messagesByJob.get(jobId) ?? EMPTY_MESSAGES)