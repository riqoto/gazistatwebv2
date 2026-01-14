'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Flex, Spinner, Box } from '@radix-ui/themes';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Flex align="center" justify="center" height="100vh">
                <Spinner size="3" />
            </Flex>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}
