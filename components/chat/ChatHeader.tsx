'use client';

import { useEffect, useState } from 'react';

export const ChatHeader = ({ title, status }: { title: string; status: string }) => {

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger fade-in animation when component mounts or updates
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, [title, status]);

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
    <div 
      className={`flex items-center justify-between p-4 border-b border-gray-200 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-10px]'
      }`}
    >
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>{status}</span>
    </div>
  );
};


