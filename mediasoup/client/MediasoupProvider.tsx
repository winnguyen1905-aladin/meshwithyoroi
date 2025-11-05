"use client";

import React from "react";

export type MediasoupContextValue = unknown;

export const MediasoupContext = React.createContext<MediasoupContextValue | undefined>(undefined);

export function MediasoupProvider(props: { children: React.ReactNode }) {
    return props.children as React.ReactElement;
}

export function useMediasoup() {
    return undefined as unknown as MediasoupContextValue;
}


