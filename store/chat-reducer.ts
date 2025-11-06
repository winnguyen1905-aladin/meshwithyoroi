// context/chat-reducer.ts

// State used by ChatContext
export interface ChatState {
  isConnected: boolean;
}

export const initialChatState: ChatState = {
  isConnected: false,
};

// Actions handled by ChatContext
export type ChatAction =| { type: 'SET_CONNECTED'; payload: boolean };

// Reducer
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    default:
      return state;
  }
}