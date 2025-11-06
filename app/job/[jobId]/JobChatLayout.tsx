'use client';
import React from 'react';

type Props = {
  topLayer?: React.ReactNode;   // new layer ở trên
  header?: React.ReactNode;
  list: React.ReactNode;
  composer: React.ReactNode;
  className?: string;
};

const JobChatLayout = React.memo(function JobChatLayout({
  topLayer, header, list, composer, className,
}: Props) {
  return (
    <div className={`relative bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden h-full ${className ?? ''}`}>
      {topLayer ? <div className="sticky top-0 z-30">{topLayer}</div> : null}
      {header ? <div className="sticky top-0 z-20 bg-white">{header}</div> : null}
      <div className="flex-1 min-h-0 overflow-y-auto">{list}</div>
      <div className="sticky bottom-0 z-20 bg-white border-t">{composer}</div>
    </div>
  );
});

export default JobChatLayout;