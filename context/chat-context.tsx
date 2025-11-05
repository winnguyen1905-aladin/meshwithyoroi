import { 
  createContext, 
  useContext, 
  useEffect, 
  useCallback, 
  ReactNode,
  useMemo,
  useReducer,
  useRef
} from 'react';

import { MessagePayload, SendMessageResponse } from '@/types/chat-response.type';
import { socketManager } from '@/services/socket-manager';
import { useChatStore } from '@/store/use-chat.store';
import { chatReducer, initialChatState } from './chat-reducer';
import { useChatE2ee } from '@/hooks/use-e2ee';
import { useChatKey } from '@/context/chatkey-context';
import { useQueryClient } from '@tanstack/react-query';

const CHAT_NAMESPACE = '/chat' as const;

interface ChatContextValue {
  isConnected: boolean;
  sendMessage: (message: MessagePayload) => Promise<SendMessageResponse>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {

  const addMessage = useChatStore(state => state.addMessage);  
  const [state, dispatch] = useReducer(chatReducer, initialChatState);  
  const socketClientRef = useRef<ReturnType<typeof socketManager.getSocket> | null>(null);
  const { decodeMessage } = useChatE2ee();
  const { privateKey } = useChatKey();
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = socketManager.getSocket(CHAT_NAMESPACE, {});

    const handleConnect = () => dispatch({ type: 'SET_CONNECTED', payload: true });
    const handleDisconnect = () => dispatch({ type: 'SET_CONNECTED', payload: false });
    
    const handleNewMessage = (data: MessagePayload) => {
      // Decrypt message if it's encrypted
      let decryptedMessage = data;
      
      // Check if message is encrypted (has nonce and encrypted content)
      if (data.nonce && data.content && data.metadata?.encrypted && data.metadata?.senderPublicKey) {
        try {
          if (!privateKey) {
            console.warn('Cannot decrypt message: private key not available');
            // Store encrypted message with error indicator
            decryptedMessage = {
              ...data,
              content: '[Encrypted - Key not available]',
              metadata: {
                ...data.metadata,
                decryptionError: 'Private key not available',
              },
            };
          } else {
            const senderPublicKey = Buffer.from(data.metadata.senderPublicKey, 'base64');
            const nonce = Buffer.from(data.nonce, 'base64');
            // content is already base64 string from socket
            const encryptedContent = data.content;
            
            const decrypted = decodeMessage(
              encryptedContent,
              senderPublicKey,
              new Uint8Array(nonce)
            );
            
            if (decrypted) {
              decryptedMessage = {
                ...data,
                content: new TextDecoder().decode(decrypted),
                metadata: {
                  ...data.metadata,
                  decrypted: true,
                },
              };
            } else {
              console.warn('Failed to decrypt message:', data.id);
              decryptedMessage = {
                ...data,
                content: '[Failed to decrypt]',
                metadata: {
                  ...data.metadata,
                  decryptionError: 'Decryption failed',
                },
              };
            }
          }
        } catch (error) {
          console.error('Error decrypting message:', error);
          decryptedMessage = {
            ...data,
            content: '[Decryption error]',
            metadata: {
              ...data.metadata,
              decryptionError: error instanceof Error ? error.message : 'Unknown error',
            },
          };
        }
      }
      
      addMessage(decryptedMessage.jobId, decryptedMessage);
      
      // Invalidate conversations query to update sidebar with new message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socketClientRef.current = client;
    client.on('connect', handleConnect);
    client.on('disconnect', handleDisconnect);
    client.on('chat:newMessage', handleNewMessage);

    return () => {
      client.off('connect', handleConnect);
      client.off('disconnect', handleDisconnect);
      client.off('chat:newMessage', handleNewMessage);
      socketClientRef.current = null;
    };
  }, [addMessage, decodeMessage, privateKey, queryClient]);

  const sendMessage = useCallback((message: MessagePayload): Promise<SendMessageResponse> => {
    return socketClientRef.current?.emitWithAck('chat:sendMessage', message) || Promise.reject(new Error('Socket not connected'));
  }, []);

  const value = useMemo(() => ({ isConnected: state.isConnected, sendMessage }), [state.isConnected, sendMessage]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );

};

export const useSocket = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useSocket should be used within ChatProvider');
  }
  return context;
}; 