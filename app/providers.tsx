'use client';

import { type ReactNode } from 'react';

// Simplified providers - using viem directly instead of wagmi
export function Providers({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
