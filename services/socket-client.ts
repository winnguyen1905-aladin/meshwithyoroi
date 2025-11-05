import { io, Socket, SocketOptions } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, ClientToServerAckEvents, SocketTimeoutError, SocketError } from '@/types/event.types';

// Keys of event signatures that return a Promise (i.e., require ack)
type KeysWithPromise<T> = {
  [P in keyof T]-?: T[P] extends (arg: any) => Promise<any> ? P : never
}[keyof T];

import { getAccessTokenCookie } from '@/utils/cookies';
import { FallbackToUntypedListener } from '@socket.io/component-emitter';

export class SocketService {

  private readonly defaultTimeout: number = 8000;
  private socket: Socket<ServerToClientEvents, ClientToServerAckEvents> | null = null;
  

  connect(namespace: string, options: Partial<SocketOptions> = {}) {
    if (this.socket) return;
    this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL + namespace, {
      ...options,
      timeout: this.defaultTimeout,
      transports: ['websocket', 'polling'],
      query: {
        token: getAccessTokenCookie(),
      },
    });

    this.onError((error) => {
      console.error('Socket error:', error);
    });
    
    console.log('Socket connected!', this.socket);
  } 
  
  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: FallbackToUntypedListener<ServerToClientEvents[K]>
  ): void {
    if (!this.socket) return;
    this.socket.on(event, handler as any);
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: FallbackToUntypedListener<ServerToClientEvents[K]>
  ): void {
    if (!this.socket) return;
    if (handler) {
      this.socket.off(event, handler as any);
    } else {
      this.socket.off(event);
    }
  }
  once<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    // @ts-ignore - Socket.IO typing complexity workaround
    this.socket.once(event, handler);
  }

  removeAllListeners<K extends keyof  ServerToClientEvents>(event?: K): void {
    if (!this.socket) return;
    if (event) {
      this.socket.removeAllListeners(event);
    } else {
      this.socket.removeAllListeners();
    }
  }

  emit<K extends keyof ClientToServerAckEvents>(
    event: K,
    ...args: Parameters<ClientToServerAckEvents[K]>
  ): void {
    if (!this.socket) return;
    this.socket.emit(event, ...args);
  }

  async emitWithAck<
    K extends KeysWithPromise<ClientToServerEvents> & keyof ClientToServerAckEvents
  >(
    event: K,
    data:
      ClientToServerEvents[K] extends (arg: infer A) => Promise<any>
        ? A
        : never,
    timeoutMs: number = this.defaultTimeout
  ): Promise<
    ClientToServerEvents[K] extends (arg: any) => Promise<infer R>
      ? Awaited<R>
      : never
  > {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const error: SocketTimeoutError = {
          timeout: timeoutMs,
          event: String(event),
          code: 'SOCKET_TIMEOUT',
          message: `Socket acknowledgment timeout for event: ${String(event)}`,
        };
        reject(error);
      }, timeoutMs);

      type AckParams = Parameters<ClientToServerAckEvents[K]>;
      const params = [
        data as AckParams[0],
        ((response) => {
        clearTimeout(timeout);
        
          console.log(`[SocketClient] ${String(event)} response:`, response);
        
          // Check if response indicates an error in a generic, type-safe way
          const res = response as unknown as { ok?: boolean; error?: any };
          if (res && res.ok === false) {
            let errorMessage = 'Socket operation failed';
            let errorCode = 'SOCKET_ERROR';
            let errorDetails = undefined as unknown;
            if (typeof res.error === 'string') {
              errorMessage = res.error;
            } else if (typeof res.error === 'object' && res.error !== null) {
              errorMessage = (res.error as { message?: string }).message || errorMessage;
              errorCode = (res.error as { code?: string }).code || errorCode;
              errorDetails = (res.error as { details?: unknown }).details;
            }
            console.error(`[SocketClient] ${String(event)} error:`, errorMessage);
            const error: SocketError = {
              message: errorMessage,
              code: errorCode,
                details: errorDetails,
            };
            reject(error);
            return;
          } 
          resolve(response as unknown as ClientToServerEvents[K] extends (arg: any) => Promise<infer R> ? Awaited<R> : never);
        }) as AckParams[1]
      ] as AckParams;
      this.socket!.emit(event, ...params);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  } 

  onError(handler: (error: SocketError) => void): void {
    if (!this.socket) return;

    this.socket.on('connect_error', (error: Error) => {
      const socketError: SocketError = {
        message: error.message || 'Socket connection error',
        code: 'CONNECT_ERROR',
        details: error,
      };
      handler(socketError);
    });

    this.socket.on('disconnect', (reason: string) => {
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // These are normal disconnections
        return;
      }
      
      const socketError: SocketError = {
        message: `Socket disconnected: ${reason}`,
        code: 'DISCONNECT_ERROR',
        details: { reason },
      };
      handler(socketError);
    });
  }

  destroy(): void {
    this.removeAllListeners();
    this.disconnect();
  }
} 