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
  addMessage: (jobId: string, message: MessagePayload) => set((state) => {
    const existingMessages = state.messagesByJob.get(jobId) || [];
    
    // Check if message already exists by ID (only if ID is not empty)
    if (message.id && message.id !== '') {
      const messageExists = existingMessages.some(m => m.id === message.id);
      if (messageExists) {
        // Message already exists, return state unchanged
        return state;
      }
    }
    
    // For messages without ID, check by timestamp + senderId + content to prevent duplicates
    if (!message.id || message.id === '') {
      const duplicateExists = existingMessages.some(m => 
        m.timestamp === message.timestamp && 
        m.senderId === message.senderId &&
        m.plaintext === message.plaintext
      );
      if (duplicateExists) {
        // Duplicate message found, return state unchanged
        return state;
      }
    }
    
    // Add new message
    return {
      messagesByJob: new Map(state.messagesByJob.set(jobId, [...existingMessages, message])),
    };
  }),
  getMessages: (jobId: string) => get().messagesByJob.get(jobId) || [],
}));

// Stable empty array to avoid creating a new array reference per render
const EMPTY_MESSAGES: MessagePayload[] = [];

export const useJobMessages = (jobId: string) => 
  useChatStore((state) => state.messagesByJob.get(jobId) ?? EMPTY_MESSAGES)