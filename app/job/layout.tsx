"use client"
import type React from "react"
import { JobsSidebar } from "@/components/chat/JobsSidebar"
import { usePathname } from "next/navigation"

export default function JobLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showSidebar = pathname?.startsWith('/job/') === true;
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-12 gap-4 h-[75vh]">
        {showSidebar && (
          <div className="col-span-12 md:col-span-5 lg:col-span-4 xl:col-span-4 bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
            <JobsSidebar />
          </div>
        )}
        <div className={(showSidebar ? "col-span-12 md:col-span-7 lg:col-span-8 xl:col-span-8" : "col-span-12") + " h-full flex flex-col overflow-hidden"}>
          {children}
        </div>
      </div>
    </div>
  )
}