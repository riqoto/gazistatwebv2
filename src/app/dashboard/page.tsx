'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ExternalLink, FileText, LayoutDashboard, LogOut, Plus, Search } from 'lucide-react';
import { Box, Button, Callout, Flex, Heading, Spinner, Text, TextField } from '@radix-ui/themes';
import { useAuth } from '@/contexts/AuthContext';
import { getUserReportDrafts, UserReportDraft } from '@/lib/supabase';

function reportHref(slug: string) {
    return `/${slug.split('/').map(encodeURIComponent).join('/')}`;
}

export default function DashboardPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<UserReportDraft[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    useEffect(() => {
        if (!authLoading && !user) router.replace('/login');
    }, [authLoading, router, user]);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;
        getUserReportDrafts(user.id)
            .then(({ reports: ownedReports, error }) => {
                if (!isMounted) return;
                setReports(ownedReports);
                setLoadError(error?.message ?? null);
                setLoading(false);
            })
            .catch((error: unknown) => {
                if (!isMounted) return;
                setLoadError(error instanceof Error ? error.message : 'Raporlar yüklenemedi.');
                setLoading(false);
            });
        return () => {
            isMounted = false;
        };
    }, [user]);

    const filteredReports = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase('tr');
        if (!normalizedQuery) return reports;
        return reports.filter((report) =>
            `${report.title || report.id} ${report.published_slug || ''}`.toLocaleLowerCase('tr').includes(normalizedQuery),
        );
    }, [query, reports]);

    if (authLoading || !user) {
        return <main className="min-h-svh bg-[#f7f8fa]"><Flex align="center" justify="center" className="min-h-svh"><Spinner size="3" /></Flex></main>;
    }

    return (
        <main className="min-h-svh bg-[#f7f8fa] text-[#24272d]">
            <header className="border-b border-[#e2e6ed] bg-white">
                <Flex align="center" justify="between" gap="4" className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
                    <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-[#3455d1]">
                        <LayoutDashboard size={18} /> Gazistat
                    </Link>
                    <Flex align="center" gap="3">
                        <Text size="2" color="gray" className="hidden max-w-56 truncate sm:block">{user.email}</Text>
                        <Button type="button" variant="outline" color="gray" onClick={() => void signOut()}>
                            <LogOut size={15} /> Çıkış
                        </Button>
                    </Flex>
                </Flex>
            </header>

            <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
                <Flex align="end" justify="between" gap="5" className="flex-col border-b border-[#e2e6ed] pb-7 sm:flex-row">
                    <Box>
                        <Heading as="h1" size="7" className="mt-2">Raporlarım</Heading>
                        <Text as="p" size="2" color="gray" className="mt-2">Düzenlediğiniz raporları yönetin ve kaldığınız yerden devam edin.</Text>
                    </Box>
                    <Button asChild variant='classic'  size="3">
                        <Link href="/editor?new=1"><Plus size={17} /> Yeni rapor <ArrowRight size={15} /></Link>
                    </Button>
                </Flex>

                <Flex align="center" justify="between" gap="4" className="mt-6 flex-col sm:flex-row">
                    <TextField.Root value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rapor adı veya adresi ara" aria-label="Rapor ara" className="w-full sm:max-w-sm">
                        <TextField.Slot><Search size={16} /></TextField.Slot>
                    </TextField.Root>
                    {!loading && <Text size="2" color="gray" className="tabular-nums">{filteredReports.length} rapor</Text>}
                </Flex>

                <Box className="mt-5 border-y border-[#e2e6ed] bg-white">
                    {loading ? (
                        <Flex direction="column" className="divide-y divide-[#e8ebf0]">
                            {[0, 1, 2].map((item) => <Box key={item} className="h-20 animate-pulse bg-[#fbfcfd]" />)}
                        </Flex>
                    ) : loadError ? (
                        <Callout.Root color="red" className="m-5">
                            <Callout.Text>Raporlar yüklenemedi. Supabase taslak tablosunu ve erişim politikalarını kontrol edin.</Callout.Text>
                        </Callout.Root>
                    ) : filteredReports.length ? (
                        <ul className="divide-y divide-[#e8ebf0]">
                            {filteredReports.map((report) => (
                                <li key={report.id}>
                                    <Flex align="center" gap="4" className="flex-col px-4 py-4 sm:flex-row sm:px-5">
                                        <Flex align="center" justify="center" className="h-10 w-10 shrink-0 rounded-md bg-[#eef2ff] text-[#3455d1]"><FileText size={19} /></Flex>
                                        <Box className="min-w-0 flex-1">
                                            <Heading as="h2" size="3" className="truncate">{report.title || 'Başlıksız rapor'}</Heading>
                                            <Text as="p" size="1" color="gray" className="mt-1 truncate">{report.published_slug ? `/${report.published_slug}` : 'Taslak'} · {new Date(report.updated_at).toLocaleDateString('tr-TR')}</Text>
                                        </Box>
                                        <Flex align="center" gap="2" className="shrink-0">
                                            <Button asChild size="2"><Link href={`/editor?draft=${encodeURIComponent(report.id)}`}>Düzenle</Link></Button>
                                            {report.published_slug && <Button asChild variant="outline" color="gray" size="2"><Link href={reportHref(report.published_slug)} target="_blank" aria-label={`${report.title} raporunu görüntüle`}><ExternalLink size={16} /></Link></Button>}
                                        </Flex>
                                    </Flex>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <Flex direction="column" align="center" gap="2" className="px-5 py-14 text-center">
                            <FileText size={25} className="text-[#9ba3b1]" />
                            <Heading as="h2" size="3">{query ? 'Eşleşen rapor bulunamadı' : 'Henüz düzenlenmiş raporunuz yok'}</Heading>
                            <Text size="2" color="gray">{query ? 'Farklı bir arama deneyin.' : 'Yeni rapor oluşturduğunuzda taslak olarak burada görünür.'}</Text>
                        </Flex>
                    )}
                </Box>
            </section>
        </main>
    );
}