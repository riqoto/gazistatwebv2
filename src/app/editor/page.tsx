'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Flex, Spinner } from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getUserReportDraft, saveUserReportDraft } from '@/lib/supabase';
import { useBuilderStore } from '@/store/useBuilderStore';

export default function EditorPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const layout = useBuilderStore((state) => state.layout);
    const reportId = useBuilderStore((state) => state.reportId);
    const reportOwnerId = useBuilderStore((state) => state.reportOwnerId);
    const replaceLayout = useBuilderStore((state) => state.replaceLayout);
    const setReportId = useBuilderStore((state) => state.setReportId);
    const setReportOwnerId = useBuilderStore((state) => state.setReportOwnerId);
    const resetLayout = useBuilderStore((state) => state.resetLayout);
    const [loadingReport, setLoadingReport] = useState(true);

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [loading, router, user]);

    useEffect(() => {
        if (loading || !user) return;
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('draft');
        let isMounted = true;

        if (useBuilderStore.getState().reportOwnerId && useBuilderStore.getState().reportOwnerId !== user.id) resetLayout();
        setReportOwnerId(user.id);

        if (params.get('new') === '1') {
            resetLayout();
            router.replace('/editor');
        }

        if (!draftId) {
            void Promise.resolve().then(() => {
                if (isMounted) setLoadingReport(false);
            });
            return () => { isMounted = false; };
        }

        getUserReportDraft(draftId, user.id).then((draft) => {
            if (!isMounted) return;
            if (draft) {
                replaceLayout(draft.data);
                setReportId(draft.id);
            } else {
                router.replace('/dashboard');
            }
            setLoadingReport(false);
        }).catch((error: unknown) => {
            console.error('Draft load failed:', error);
            if (isMounted) {
                router.replace('/dashboard');
                setLoadingReport(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [loading, replaceLayout, resetLayout, router, setReportId, setReportOwnerId, user]);

    useEffect(() => {
        if (!user || loading || loadingReport || reportOwnerId !== user.id) return;
        const timer = setTimeout(() => {
            void saveUserReportDraft(reportId, user.id, layout).then(({ error }) => {
                if (error) console.error('Draft save failed:', error);
            });
        }, 700);

        return () => clearTimeout(timer);
    }, [layout, loading, loadingReport, reportId, reportOwnerId, user]);

    if (loading || !user || loadingReport) {
        return (
            <Flex align="center" justify="center" className="min-h-svh">
                <Spinner size="3" />
            </Flex>
        );
    }

    return <MainLayout />;
}