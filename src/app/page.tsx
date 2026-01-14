'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import LoginPage from './login/page';
import { useAuth } from '@/contexts/AuthContext';
import { Flex, Spinner } from '@radix-ui/themes';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Flex align="center" justify="center" height="100vh">
        <Spinner size="3" />
      </Flex>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainLayout />;
}
