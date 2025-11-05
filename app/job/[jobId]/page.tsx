'use client';

import { useParams, useRouter } from 'next/navigation';
import { useJob } from '@/hooks/use-job';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useMemo } from 'react';
import { JobsSidebar } from '@/components/chat/JobsSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';
import { useJoinJobRoom, useLeaveJobRoom, useResolvePeerPublicKey } from '@/hooks/use-chat';
import { useJobMessagesInfinite, useMarkMessagesRead } from '@/hooks/use-job';
import { useJobMessages } from '@/store/use-chat.store';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { wallet, isAuthenticated, stakeAddress } = useAuth();
  const joinRoom = useJoinJobRoom();
  const leaveRoom = useLeaveJobRoom();
  const messages = useJobMessages(jobId);
  const messagesInfinite = useJobMessagesInfinite(jobId);
  const markReadMutation = useMarkMessagesRead();
  
  // Sử dụng React Query hook
  const {
    data: jobResponse,
    isLoading,
    error,
  } = useJob(jobId);

  const job = jobResponse?.data;

  const canChat = useMemo(() => {
    if (!stakeAddress || !job) return false;
    return job.aladinId === stakeAddress || job.genieId === stakeAddress;
  }, [stakeAddress, job]);

  useEffect(() => {
    
    // expose current wallet for message self/right alignment
    (window as any).currentWalletAddress = stakeAddress;
  }, [stakeAddress]);

  useEffect(() => {
    if (!jobId) return;
    joinRoom(jobId);
    return () => leaveRoom(jobId);
  }, [jobId, joinRoom, leaveRoom]);

  // Auto-mark messages as read when viewing
  useEffect(() => {
    

    if (!canChat || !jobId || !stakeAddress || messages.length === 0) return;
    
    // Get unread messages (messages not sent by current user)
    const unreadMessageIds = messages
      .filter(m => m.senderId !== stakeAddress && !m.metadata?.read)
      .map(m => m.id)
      .filter(Boolean) as string[];

    // Mark as read with debounce (only once per batch)
    if (unreadMessageIds.length > 0) {
      const timer = setTimeout(() => {
        markReadMutation.mutate({ jobId, messageIds: unreadMessageIds });
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [messages.length, canChat, jobId, stakeAddress, markReadMutation]);

  const resolvePeerPublicKey = useResolvePeerPublicKey(jobId, job, stakeAddress || undefined);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Details</h1>
          <p className="text-gray-600">Please connect your wallet to view job details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-2 text-red-800">Job Not Found</h2>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'The job you are looking for does not exist'}
          </p>
          <button
            onClick={() => router.push('/job')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 cursor-pointer"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        {/* Sidebar 35-40% */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 xl:col-span-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <JobsSidebar />
        </div>

        {/* Chat Panel 60-65% */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 xl:col-span-8 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
          <ChatHeader title={job.title} status={job.status} />
          {!canChat ? (
            <div className="p-6 text-sm text-gray-600">Only participants can view and send messages for this job.</div>
          ) : (
            <>
              <MessageList
                jobId={jobId}
                onLoadMore={() => messagesInfinite.fetchNextPage()}
              />
              <MessageComposer
                jobId={jobId}
                resolvePeerPublicKey={resolvePeerPublicKey}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

