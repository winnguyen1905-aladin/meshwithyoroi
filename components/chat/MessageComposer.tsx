'use client';

import { useState, useRef, useEffect } from 'react';
import { useSendChat } from '@/hooks/use-chat';

export const MessageComposer = ({
  jobId,
  resolvePeerPublicKey,
  maxLength = 2000,
  disabled = false,
}: {
  jobId: string;
  resolvePeerPublicKey: () => Buffer;
  maxLength?: number;
  disabled?: boolean;
}) => {
  
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const { sendText } = useSendChat(jobId, resolvePeerPublicKey);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Global type-to-focus behavior: when user types anywhere (and not in an input),
  // focus the composer and append the typed character.
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (disabled || sending) return;
      if (e.defaultPrevented) return;
      if ((e as any).isComposing) return; // avoid IME composition
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (target as any).isContentEditable) return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      // Only handle printable non-repeating characters
      if (key && key.length === 1 && !e.repeat) {
        e.preventDefault();
        textareaRef.current?.focus();
        setValue((prev) => prev + key);
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [disabled, sending]);

  const doSend = async () => {
    const text = value.trim();
    if (!text || disabled) return;
    setSending(true);
    try {
      await sendText(text);
      setValue('');
      // return focus to the composer so user can continue typing
      textareaRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void doSend();
    }
  };

  return (
    <div className="p-3 border-t border-gray-200">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          className="flex-1 resize-none rounded-md border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder={ 'Type a message'}
          value={value}
          maxLength={maxLength}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled || sending}
        />
        <button
          type="button"
          onClick={doSend}
          disabled={disabled || sending || !value.trim()}
          className="px-4 py-2 cursor-pointer rounded-md bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};