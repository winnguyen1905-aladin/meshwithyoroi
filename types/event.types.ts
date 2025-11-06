// ==============================
// Re-export Request and Response Types
// ==============================

export * from '@/types/call-response.type';
export * from '@/types/call-response.type';
export * from '@/types/chat-response.type';
export * from '@/types/chat-response.type';

// Import types for use in interfaces below
import type {
  JoinRoomRequest,
  AudioChangeRequest,
  ConsumeRequest,
  CreateProducerTransportRequest,
  CreateConsumerTransportRequest,
  CreateProducerRequest,
  CreateConsumerRequest,
  ConnectProducerTransportRequest,
  ConnectConsumerTransportRequest
} from '@/types/call-request.type';

import type {
  JoinRoomResponse,
  ConsumeResponse,
  ActiveSpeakersUpdate,
  NewProducersData,
  ProducerClosedData,
  UserLeftData,
  TransportResponse,
  ProducerResponse,
  ConsumerResponse
} from '@/types/call-response.type';

import type {
  SendMessagePayload,
  MarkMessagesReadRequest,
  EditMessageRequest,
  DeleteMessageRequest,
  GetChatHistoryRequest,
  TypingIndicatorRequest,
} from '@/types/chat-request.type';

import type { 
  SendMessageResponse,
  ChatHistoryResponse,
  EditMessageResponse,
  MessageEditedData,
  DeleteMessageResponse,
  MessageDeletedData,
  MarkMessagesReadResponse,
  MessagesReadData,
  TypingIndicatorData,
  MessagePayload
} from '@/types/chat-response.type'; 

export interface ServerToClientEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connectError: (error: Error) => void;
  
  // Room events
  userLeft: (data: UserLeftData) => void;
  producerClosed: (data: ProducerClosedData) => void;
  updateActiveSpeakers: (data: string[] | ActiveSpeakersUpdate) => void;
  newProducersToConsume: (data: NewProducersData) => void;
  
  // Room status
  roomFull: () => void;
  roomClosed: () => void;
  
  // Normal Chat events (Server to Client)
  'contract:message.new': (data: MessagePayload) => void;
  'chat:messageEdited': (data: MessageEditedData) => void;
  'chat:messageDeleted': (data: MessageDeletedData) => void;
  'chat:messagesRead': (data: MessagesReadData) => void;
  'chat:typing': (data: TypingIndicatorData) => void; 
}

export interface ClientToServerEvents {
  // Room management
  joinRoom: (data: JoinRoomRequest) => Promise<JoinRoomResponse>;
  leaveRoom: () => void;
  
  // Media control
  audioChange: (data: AudioChangeRequest) => void;
  videoChange: (action: 'enable' | 'disable') => void;
  
  // Transport and producer management
  createProducer: (data: CreateProducerRequest) => Promise<ProducerResponse>;
  createConsumer: (data: CreateConsumerRequest) => Promise<ConsumerResponse>;
  createProducerTransport: (data: CreateProducerTransportRequest) => Promise<TransportResponse>;
  createConsumerTransport: (data: CreateConsumerTransportRequest) => Promise<TransportResponse>;
  
  // WebRTC signaling
  connectProducerTransport: (data: ConnectProducerTransportRequest) => Promise<void>;
  connectConsumerTransport: (data: ConnectConsumerTransportRequest) => Promise<void>;
  
  // Consume request
  requestTransport: (data: ConsumeRequest) => Promise<ConsumeResponse>;
  
  // Normal Chat events (Client to Server)
  'contract:message.send': (data: MessagePayload) => Promise<SendMessageResponse>;
  'chat:editMessage': (data: EditMessageRequest) => Promise<EditMessageResponse>;
  'chat:deleteMessage': (data: DeleteMessageRequest) => Promise<DeleteMessageResponse>;
  'chat:markRead': (data: MarkMessagesReadRequest) => Promise<MarkMessagesReadResponse>;
  'chat:typing': (data: TypingIndicatorRequest) => void;
  'chat:getHistory': (data: GetChatHistoryRequest) => Promise<ChatHistoryResponse>;
}

// Map Promise-based client events to callback-ack signature for Socket.IO emit typing
export type WithAck<T> = {
  [K in keyof T]: T[K] extends (arg: infer A) => Promise<infer R>
    ? (arg: A, ack: (response: R) => void) => void
    : T[K];
};

export type ClientToServerAckEvents = WithAck<ClientToServerEvents>;

// ==============================
// Socket Error Types
// ==============================

export interface SocketError {
  message: string;
  code?: string;
  details?: any;
}

export interface SocketTimeoutError extends SocketError {
  timeout: number;
  event: string;
}

// ==============================
// Event Handler Types
// ==============================

export type EventHandler<T = any> = (data: T) => void | Promise<void>;

export type SocketEventHandlers = {
  [K in keyof ServerToClientEvents]: EventHandler<Parameters<ServerToClientEvents[K]>[0]>;
};