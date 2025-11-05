'use client';

export const ChatHeader = ({ title, status }: { title: string; status: string }) => {
  const badge = (() => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  })();

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>{status}</span>
    </div>
  );
};


