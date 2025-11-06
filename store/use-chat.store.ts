import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MessagePayload } from '@/types/chat-response.type';

interface ChatStoreState {
  clearMessages: (jobId: string) => void;
  messagesByJob: Map<string, MessagePayload[]>;
  getMessages: (jobId: string) => MessagePayload[];
  addMessage: (jobId: string, message: MessagePayload) => void;
}

// Returns true if the incoming message is considered a duplicate of any existing one
function isDuplicateMessage(existingMessages: MessagePayload[], incoming: MessagePayload): boolean {
  if (incoming.id && incoming.id !== '') {
    return existingMessages.some((message) => message.id === incoming.id);
  }

  return existingMessages.some((message) =>
    message.timestamp === incoming.timestamp &&
    message.senderId === incoming.senderId &&
    message.plaintext === incoming.plaintext
  );
}

export const useChatStore = create<ChatStoreState>()(
  devtools(
    (set, get) => ({
      clearMessages: (jobId: string) =>
        set((state) => {
          const nextMessagesByJob = new Map(state.messagesByJob);
          nextMessagesByJob.set(jobId, []);
          return { messagesByJob: nextMessagesByJob };
        }, false, 'chat/clearMessages'),
      messagesByJob: new Map(),
      addMessage: (jobId: string, message: MessagePayload) =>
        set((state) => {
          const existingMessages = state.messagesByJob.get(jobId) || [];

          if (isDuplicateMessage(existingMessages, message)) {
            return state;
          }

          const nextMessagesByJob = new Map(state.messagesByJob);
          nextMessagesByJob.set(jobId, [...existingMessages, message]);

          return { messagesByJob: nextMessagesByJob };
        }, false, 'chat/addMessage'),
      getMessages: (jobId: string) => get().messagesByJob.get(jobId) || [],
    }),
    { name: 'chat-store' }
  )
);

const EMPTY_MESSAGES: MessagePayload[] = [];

export const useJobMessages = (jobId: string) => 
  useChatStore((state) => state.messagesByJob.get(jobId) ?? EMPTY_MESSAGES)