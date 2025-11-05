import { SocketService } from '@/services/socket-client';
import type { SocketOptions } from 'socket.io-client';

class SocketManager {
  
  private readonly namespaceToClient = new Map<string, SocketService>();

  getSocket(namespace: string, options: Partial<SocketOptions> = {}): SocketService {
    const existing = this.namespaceToClient.get(namespace);
    if (existing) return existing;

    const client = new SocketService();
    // Only connect on the client
    if (typeof window !== 'undefined') {
      client.connect(namespace, options);
    }
    
    this.namespaceToClient.set(namespace, client);
    return client;
  }

  has(namespace: string): boolean {
    return this.namespaceToClient.has(namespace);
  }

  destroy(namespace: string): void {
    const client = this.namespaceToClient.get(namespace);
    if (!client) return;
    client.destroy();
    this.namespaceToClient.delete(namespace);
  }

  destroyAll(): void {
    for (const [ns, client] of this.namespaceToClient.entries()) {
      client.destroy();
      this.namespaceToClient.delete(ns);
    }
  }
}

export const socketManager = new SocketManager();


