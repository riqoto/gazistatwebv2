'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpenText, Menu } from 'lucide-react';
import { Flex, Heading, Text } from '@radix-ui/themes';
import { LayoutJSON, ComponentSchema, HeadingComponent } from '@/types/schema';
import { getReport } from '@/lib/supabase';
import { ComponentRenderer } from '@/components/canvas/ComponentRenderer';

function collectHeadings(components: ComponentSchema[]): HeadingComponent[] {
    return components.flatMap((component) => {
        const ownHeading = component.type === 'heading' ? [component] : [];
        const childHeadings = 'children' in component && Array.isArray(component.children)
            ? collectHeadings(component.children)
            : [];
        return [...ownHeading, ...childHeadings];
    });
}

export default function ViewerPage() {
    const params = useParams();
    const routeSlug = params?.slug;
    const slug = Array.isArray(routeSlug) ? routeSlug.join('/') : routeSlug;
    const [layout, setLayout] = useState<LayoutJSON | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        let isMounted = true;

        getReport(slug)
            .then((report) => {
                if (!isMounted) return;
                if (report) setLayout(report);
                else setError(`Rapor bulunamadı: ${slug}`);
            })
            .catch((fetchError: unknown) => {
                console.error(fetchError);
                if (isMounted) setError('Rapor yüklenirken hata oluştu.');
            });

        return () => {
            isMounted = false;
        };
    }, [slug]);

    const sections = useMemo(() => layout?.pages.flatMap((page) => collectHeadings(page.components)) ?? [], [layout]);

    const handleScrollTo = (id: string) => {
        document.getElementById(`comp-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (error) {
        return (
            <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[#f7f8fa] px-5 text-center">
                <Heading color="red">Rapor bulunamadı</Heading>
                <Text color="gray">{error}</Text>
                <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#3455d1] px-4 py-2.5 text-sm font-semibold text-white">
                    <ArrowLeft size={16} /> Raporlara dön
                </Link>
            </main>
        );
    }

    if (!layout) {
        return (
            <main className="flex min-h-svh items-center justify-center bg-[#f7f8fa]">
                <Text color="gray">Rapor yükleniyor...</Text>
            </main>
        );
    }

    return (
        <div className="min-h-svh bg-[#f7f8fa] text-[#24272d] md:flex md:h-svh md:overflow-hidden">
            <header className="sticky top-0 z-20 border-b border-[#e6e9ef] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
                <div className="flex min-w-0 items-center gap-3">
                    <Link href="/" aria-label="Tüm raporlar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3455d1]">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{layout.title}</p>
                        <p className="text-xs text-[#838b99]">Gazistat raporu</p>
                    </div>
                    {sections.length > 0 && (
                        <label className="flex h-9 max-w-[44%] shrink-0 items-center gap-1.5 rounded-lg border border-[#e1e5ed] bg-white px-2 text-[#596273]">
                            <Menu size={15} />
                            <select
                                aria-label="Bölüme git"
                                defaultValue=""
                                onChange={(event) => {
                                    if (event.target.value) handleScrollTo(event.target.value);
                                    event.target.value = '';
                                }}
                                className="min-w-0 bg-transparent text-xs outline-none"
                            >
                                <option value="">Bölümler</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>{section.content || 'Başlıksız bölüm'}</option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </header>

            <aside className="hidden h-full w-72 shrink-0 flex-col border-r border-[#e5e8ee] bg-white md:flex">
                <div className="border-b border-[#edf0f4] p-5">
                    <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3455d1]">
                        <ArrowLeft size={16} /> Tüm raporlar
                    </Link>
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#8a92a0]">
                        <BookOpenText size={14} /> Rapor
                    </div>
                    <Heading size="4" className="mt-2 break-words">{layout.title}</Heading>
                </div>
                <nav aria-label="Rapor bölümleri" className="min-h-0 flex-1 overflow-y-auto p-4">
                    <Text size="1" weight="bold" color="gray" className="mb-2 block uppercase tracking-wide">Bölümler</Text>
                    {sections.length === 0 ? (
                        <Text size="2" color="gray">Tanımlanmış bölüm yok</Text>
                    ) : (
                        <Flex direction="column" gap="1">
                            {sections.map((section) => (
                                <button key={section.id} type="button" onClick={() => handleScrollTo(section.id)} className="rounded-md px-3 py-2 text-left text-sm leading-5 text-[#5d6675] transition hover:bg-[#f1f4fb] hover:text-[#3455d1]">
                                    {section.content || 'Başlıksız bölüm'}
                                </button>
                            ))}
                        </Flex>
                    )}
                </nav>
            </aside>

            <main className="min-w-0 flex-1 overflow-x-hidden bg-white md:h-full md:overflow-y-auto">
                <article className="mx-auto w-full min-w-0 max-w-5xl px-4 py-6 sm:px-8 sm:py-10 lg:px-12">
                    <div className="mb-8 border-b border-[#edf0f4] pb-5 md:hidden">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#8790a0]">Gazistat · Rapor</p>
                        <h1 className="mt-2 break-words text-2xl font-bold leading-tight">{layout.title}</h1>
                    </div>
                    <Flex direction="column" gap={{ initial: '6', sm: '8' }} className="min-w-0 pb-16">
                        {layout.pages?.filter((page) => page.components.length > 0).map((page) => (
                            <section key={page.id} className="flex min-w-0 flex-col gap-4 sm:gap-6">
                                {page.components.map((component) => (
                                    <div key={component.id} id={`comp-${component.id}`} className="min-w-0 max-w-full scroll-mt-24 [overflow-wrap:anywhere]">
                                        <ComponentRenderer component={component} readOnly />
                                    </div>
                                ))}
                            </section>
                        ))}
                    </Flex>
                </article>
            </main>
        </div>
    );
}