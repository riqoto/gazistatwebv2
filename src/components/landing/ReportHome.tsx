'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, KeyboardEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownLeft, ArrowRight, Clock3, FileText, Search, Sparkles } from 'lucide-react';
import { getLatestReports, PublishedReport } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

function reportHref(slug: string) {
    return `/${slug.split('/').map(encodeURIComponent).join('/')}`;
}

function getPreview(report: PublishedReport) {
    for (const page of report.data.pages ?? []) {
        for (const component of page.components ?? []) {
            if (component.type === 'text' || component.type === 'heading') {
                const preview = component.content.replace(/\s+/g, ' ').trim();
                if (preview) return preview;
            }
        }
    }
    return 'Yayınlanmış raporu görüntüleyin.';
}

export function ReportHome() {
    const [reports, setReports] = useState<PublishedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [query, setQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeSuggestion, setActiveSuggestion] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();
    const { user } = useAuth();

    useEffect(() => {
        let isMounted = true;
        getLatestReports()
            .then(({ reports: latestReports, error }) => {
                if (!isMounted) return;
                setReports(latestReports);
                setLoadError(Boolean(error));
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const normalizedQuery = query.trim().toLocaleLowerCase('tr');
    const filteredReports = useMemo(() => {
        if (!normalizedQuery) return reports;
        return reports.filter((report) => {
            const title = report.data.title || report.slug;
            return `${title} ${report.slug} ${getPreview(report)}`
                .toLocaleLowerCase('tr')
                .includes(normalizedQuery);
        });
    }, [normalizedQuery, reports]);

    const suggestionsOpen = isSearchFocused;
    const visibleSuggestions = filteredReports.slice(0, 6);

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (filteredReports[activeSuggestion]) {
            router.push(reportHref(filteredReports[activeSuggestion].slug));
            setIsSearchFocused(false);
        }
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestion((current) => Math.min(current + 1, visibleSuggestions.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestion((current) => Math.max(current - 1, 0));
        } else if (event.key === 'Escape') {
            setIsSearchFocused(false);
        }
    };

    const closeSearch = () => {
        blurTimer.current = setTimeout(() => setIsSearchFocused(false), 120);
    };

    return (
        <main className="min-h-svh bg-[#f7f8fa] text-[#24272d]">
            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
                <Link href="/" className="flex items-center gap-2 font-bold text-[#3455d1]" aria-label="Gazistat ana sayfa">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3455d1] text-sm font-black text-white">G</span>
                    <span className="text-lg">gazistat</span>
                </Link>
                <Link href={user ? '/dashboard' : '/login'} className="rounded-lg border border-[#3455d1]/20 bg-white px-4 py-2 text-sm font-semibold text-[#3455d1] transition hover:border-[#3455d1] hover:bg-[#f1f4ff]">
                    {user ? 'Raporlarım' : 'Giriş'}
                </Link>
            </header>

            <section className="mx-auto w-full max-w-3xl px-5 pb-10 pt-12 text-center sm:px-8 sm:pb-14 sm:pt-20">
             
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Gazi Rapor</h1>
                <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#697386] sm:text-base">
                    Paylaşılan raporları keşfedin, arayın ve okuyun.
                </p>

                <div className="relative mx-auto mt-8 max-w-[620px] text-left sm:mt-10">
                    <form onSubmit={handleSearchSubmit} role="search">
                        <label className={`flex h-14 items-center gap-3 rounded-xl border bg-white px-4 shadow-[0_8px_28px_rgba(25,36,60,0.07)] transition focus-within:border-[#3455d1] focus-within:ring-4 focus-within:ring-[#3455d1]/10 ${isSearchFocused ? 'border-[#3455d1]' : 'border-[#dfe3eb]'}`}>
                            <Search size={20} className="shrink-0 text-[#7c8494]" />
                            <input
                                ref={inputRef}
                                type="search"
                                role="combobox"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveSuggestion(0);
                                }}
                                onFocus={() => {
                                    if (blurTimer.current) clearTimeout(blurTimer.current);
                                    setIsSearchFocused(true);
                                }}
                                onBlur={closeSearch}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Rapor ara..."
                                aria-label="Rapor ara"
                                aria-autocomplete="list"
                                aria-haspopup="listbox"
                                aria-controls="report-suggestions"
                                aria-expanded={suggestionsOpen}
                                className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#9aa1ae]"
                            />
                            <kbd className="hidden rounded border border-[#e5e7eb] bg-[#f8f9fb] px-2 py-1 text-[11px] text-[#7b8493] sm:inline">Enter ↵</kbd>
                        </label>
                    </form>

                    {suggestionsOpen && (
                        <div id="report-suggestions" role="listbox" className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-[#e1e5ed] bg-white shadow-[0_14px_40px_rgba(25,36,60,0.14)]">
                            <div className="flex items-center justify-between border-b border-[#edf0f4] px-4 py-3">
                                <span className="text-xs font-semibold uppercase tracking-wide text-[#818999]">
                                    {normalizedQuery ? 'Eşleşen raporlar' : 'Son raporlar'}
                                </span>
                                <span className="text-xs text-[#a0a6b2]">↑ ↓ gezin · Enter aç</span>
                            </div>
                            {visibleSuggestions.length ? visibleSuggestions.map((report, index) => (
                                <Link
                                    key={report.slug}
                                    href={reportHref(report.slug)}
                                    role="option"
                                    aria-selected={index === activeSuggestion}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => setIsSearchFocused(false)}
                                    className={`flex items-center gap-3 px-4 py-3 transition ${index === activeSuggestion ? 'bg-[#f2f5ff]' : 'hover:bg-[#f8f9fb]'}`}
                                >
                                    <Search size={16} className="shrink-0 text-[#969eac]" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-[#2d3340]">{report.data.title || report.slug}</span>
                                        <span className="block truncate text-xs text-[#858d9b]">{report.slug}</span>
                                    </span>
                                    <ArrowDownLeft size={15} className="text-[#a2a9b5]" />
                                </Link>
                            )) : (
                                <p className="px-4 py-5 text-sm text-[#778091]">Bu aramayla eşleşen rapor bulunamadı.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[#798292]">
                    <span>Örnek:</span>
                    {['veri bilimi', 'araştırma', 'analiz'].map((term) => (
                        <button key={term} type="button" onClick={() => { setQuery(term); inputRef.current?.focus(); }} className="rounded-full border border-[#e1e5ed] bg-white px-3 py-1.5 transition hover:border-[#b9c7ff] hover:text-[#3455d1]">
                            {term}
                        </button>
                    ))}
                </div>
            </section>

            <section className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 sm:pb-24">
                <div className="mb-4 flex items-end justify-between border-b border-[#e2e6ed] pb-3">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#7b8493]">
                            {normalizedQuery ? <Sparkles size={14} /> : <Clock3 size={14} />}
                            {normalizedQuery ? 'Arama sonuçları' : 'Son raporlar'}
                        </div>
                        <h2 className="mt-1 text-xl font-bold sm:text-2xl">{normalizedQuery ? `“${query.trim()}”` : 'Yayınlanan raporlar'}</h2>
                    </div>
                    {!loading && <span className="text-xs text-[#8991a0]">{filteredReports.length} rapor</span>}
                </div>

                {loading ? (
                    <div className="divide-y divide-[#e8ebf0]">
                        {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse bg-white/70" />)}
                    </div>
                ) : loadError ? (
                    <div className="border-y border-[#e8ebf0] py-10 text-center">
                        <p className="text-sm font-semibold">Raporlar şu anda yüklenemiyor.</p>
                        <p className="mt-1 text-sm text-[#7b8493]">Biraz sonra yeniden deneyin.</p>
                    </div>
                ) : filteredReports.length ? (
                    <div className="divide-y divide-[#e8ebf0] border-y border-[#e8ebf0]">
                        {filteredReports.map((report, index) => (
                            <Link key={report.slug} href={reportHref(report.slug)} className="group flex gap-4 bg-white/50 px-3 py-5 transition hover:bg-white sm:px-5">
                                <span className="hidden w-8 shrink-0 pt-0.5 text-sm tabular-nums text-[#a3a9b4] sm:block">{String(index + 1).padStart(2, '0')}</span>
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3455d1] transition group-hover:bg-[#3455d1] group-hover:text-white">
                                    <FileText size={18} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-base font-semibold text-[#2d3340] group-hover:text-[#3455d1]">{report.data.title || report.slug}</span>
                                    <span className="mt-1 line-clamp-2 block text-sm leading-5 text-[#737d8d]">{getPreview(report)}</span>
                                    <span className="mt-2 block truncate text-xs text-[#a0a6b2]">/{report.slug}</span>
                                </span>
                                <span className="hidden items-center gap-1 self-center text-sm font-medium text-[#3455d1] sm:flex">Oku <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="border-y border-[#e8ebf0] py-12 text-center">
                        <FileText size={24} className="mx-auto text-[#9ba3b1]" />
                        <p className="mt-3 text-sm font-semibold">{normalizedQuery ? 'Eşleşen rapor yok' : 'Henüz yayınlanmış rapor yok'}</p>
                        <p className="mt-1 text-sm text-[#7b8493]">{normalizedQuery ? 'Başka bir başlık veya konu deneyin.' : 'Yeni raporlar burada görünecek.'}</p>
                    </div>
                )}
            </section>

            <footer className="border-t border-[#e5e8ee] bg-white px-5 py-5 text-center text-xs text-[#8991a0]">
                Gazistat · Gazi Üniversitesi İstatistik Bölümü
            </footer>
        </main>
    );
}