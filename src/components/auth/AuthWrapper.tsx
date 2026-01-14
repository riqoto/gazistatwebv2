'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Flex, Spinner } from '@radix-ui/themes';

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
