"use client";

import React from "react";

export type SocketContextValue = unknown;

export const SocketContext = React.createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider(props: { children: React.ReactNode }) {
    return props.children as React.ReactElement;
}

export function useSocket() {
    return undefined as unknown as SocketContextValue;
}


