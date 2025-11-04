'use client';

import { useParams, useRouter } from 'next/navigation';
import { useJob } from '@/hooks/use-job';
import { useAuth } from '@/hooks/use-auth';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { wallet, isAuthenticated } = useAuth();
  
  // Sử dụng React Query hook
  const {
    data: jobResponse,
    isLoading,
    error,
  } = useJob(jobId);

  const job = jobResponse?.data;

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Job #{job.id}</h1>
            <p className="text-gray-600">Job Details</p>
          </div>
          {getStatusBadge(job.status)}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Aladin Address</h3>
              <p className="font-mono text-sm break-all">{job.aladinId}</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-2">Genie Address</h3>
              <p className="font-mono text-sm break-all">{job.genieId}</p>
            </div>
          </div>
        </div>

        {job.onchainAddress && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Contract</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-mono text-sm break-all">{job.onchainAddress}</p>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-2">Timeline</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{formatDate(job.createdAt || '')}</span>
            </div>
            {job.updatedAt !== job.createdAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium">{formatDate(job.updatedAt || '')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

