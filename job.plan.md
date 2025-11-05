<!-- a7fcd58c-844c-4fa8-8db9-d36068c31131 c1aa5f0e-8bf8-48e1-b0dd-20fb52f7f377 -->
# Implement per-job chat with sidebar, WebSocket, and E2EE

## Scope

- Build chat UI for each `jobId` with a 40/60 split: left Jobs list (sorted by latest message), right chat panel.
- Implement FE APIs in `app/api/job/jobService.ts` for messages and conversation summaries (proxy-ready).
- Use existing Chat Context (`context/chat-context.tsx`) + Zustand store for realtime; extend hooks for history and sidebar.
- Add end-to-end encryption (E2EE) using `hooks/use-e2ee.ts` before send and after receive.
- Enforce access: only `job.aladinId` and `job.genieId` can read/send.

## Files to add/update

- Update `app/job/[jobId]/page.tsx`:
- 2-column layout (40/60) per spec.
- Left: conversations list (title, last sender, time, snippet, unread badge), sorted by latest message.
- Right: chat header (job title + status), messages list (top→bottom, self right, peer left), footer composer.
- Join room on mount and leave on unmount using Chat Context + `socketManager`.

- Update `app/api/job/jobService.ts` (extend types + functions):
- Types: `ChatMessage`, `ConversationSummary` with E2EE fields:
- ChatMessage: { id, jobId, senderId, createdAt, contentEnc: string, nonce: string, senderPublicKey: string }
- Functions:
- `getJobMessages(jobId, {cursor|page,size})` (returns encrypted fields)
- `sendJobMessage(jobId, {contentEnc, nonce, senderPublicKey})`
- `getConversations(address)` (latest per job from decrypted preview in FE; BE returns encrypted last message)

- Mount Chat Provider:
- Use existing `context/chat-context.tsx`. Wrap in `app/layout.tsx` (or `app/providers.tsx`).

- Hooks (reuse + extend):
- Add `hooks/use-chat.ts`:
- `useJoinJobRoom(jobId)`, `useLeaveJobRoom(jobId)` via `socketManager.getSocket('/chat')`.
- `useSendChat(jobId)` that uses `useChatE2ee.encodeMessage` to encrypt, then `ChatContext.sendMessage`.
- `useJobMessages(jobId)` selector from `use-chat.store`.
- Extend `hooks/use-job.ts`:
- `useJobMessagesInfinite(jobId)` (InfiniteQuery fetches encrypted messages; decrypt each page with `useChatE2ee.decodeMessage` and hydrate store with plaintext for UI while keeping raw in cache if needed).
- `useConversations(address)` (fetch summaries; FE decrypts last message for preview and sorts by `lastMessageAt`).

- Components:
- `components/chat/JobsSidebar.tsx` (40% panel; clickable items navigate to `/job/[jobId]`).
- `components/chat/ChatHeader.tsx` (job title + status badge).
- `components/chat/MessageList.tsx` (infinite scroll up; bubbles; day grouping; auto-scroll on new; self/right vs peer/left).
- `components/chat/MessageComposer.tsx` (textarea Enter/Shift+Enter; char limit; disabled when empty; uses `useSendChat`).

## WebSocket events (align with existing context)

- Outgoing via context: `chat:sendMessage` { jobId, contentEnc, nonce, senderPublicKey }
- Incoming handled in context: `chat:newMessage` { ...ChatMessage }
- On receive, decrypt using `useChatE2ee.decodeMessage` with `theirPublicKey` inferred from `senderId` → public key lookup; store plaintext in `use-chat.store` alongside raw.
- Page-level rooms: `room:join`/`room:leave` for `job:{jobId}`.

## Access control (FE guard)

- In `page.tsx`, if current wallet not equal `job.aladinId` or `job.genieId`, hide chat and show notice.

## E2EE details

- Use `useChatE2ee`:
- Before send: `encodeMessage(plaintext, theirPublicKey)` → `{ encrypted, nonce }`; send base64 strings plus our `senderPublicKey`.
- On receive/history fetch: `decodeMessage(contentEnc, theirPublicKey, nonce)` to render plaintext.
- Public key sources: from `chatkey-context` (self private/public) and peer’s public key per job (from job details or a key directory API; placeholder in FE until BE ready).

## Notes

- Infinite scroll loads older pages on reaching top; new messages append at bottom.
- Sidebar sorted by `lastMessageAt` desc; unread badge via `ConversationSummary.unreadCount`.
- Optimistic send: push temp plaintext message into store (with sending state), replace on ack; keep encrypted payload for transport.

## Missing implementations (to be completed)

1. **E2EE decryption in chat-context**: Currently `chat-context.tsx` receives encrypted messages via `chat:newMessage` but doesn't decrypt them before adding to store. Need to integrate `useChatE2ee.decodeMessage` in the `handleNewMessage` handler.

2. **Peer public key resolution**: Replace temporary `window.peerPubKeyByJob` with actual API call to `getPeerPublicKey(jobId, peerAddress)`. Should cache keys and integrate into page/hooks.

3. **Mark messages as read**: API exists (`markMessagesRead`) but not integrated. Should auto-mark as read when viewing messages and provide manual mark-as-read.

4. **Refetch conversations on new messages**: When receiving `chat:newMessage`, should invalidate `useConversations` query to update sidebar previews.

5. **Error handling for E2EE**: Handle decryption failures gracefully (show error message in UI, don't crash).

6. **Loading states**: Better loading indicators for infinite scroll, message sending, etc.

7. **Message status indicators**: Show sending/sent/error states in MessageList component.

8. **Peer public key caching**: Cache peer public keys per job to avoid repeated API calls.

## ENV

- Reuse existing Socket manager configuration.
- Ensure peer public keys are accessible (temporary mock if BE not ready).

### To-dos

- [x] Extend jobService with ChatMessage/Conversation types and encrypted APIs