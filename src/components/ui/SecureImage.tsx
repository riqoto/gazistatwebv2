'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSignedUrl } from '@/lib/supabase';
import { isAllowedImageUrl } from '@/utils/file-validation';
import { Flex, Text, Box, Button } from '@radix-ui/themes';
import { Loader2, ShieldX, RefreshCw, ImageOff } from 'lucide-react';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    width?: string | number;
    height?: string | number;
}

/**
 * SecureImage — Renders images with defense-in-depth:
 *
 * 1. URL Allowlist — Only renders images from trusted domains
 * 2. Signed URL resolution — Automatically resolves Supabase private storage URLs
 * 3. Security headers — referrerPolicy, crossOrigin
 * 4. Lazy loading — Native browser lazy loading + async decoding
 * 5. Error boundary — Graceful fallback with retry
 */
export function SecureImage({ src, width, height, style, className, ...props }: SecureImageProps) {
    const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'blocked' | 'load_failed' | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const resolveUrl = useCallback(async () => {
        setLoading(true);
        setError(null);
        setResolvedUrl(null);

        if (!src) {
            setLoading(false);
            return;
        }

        // Step 1: URL allowlist check
        if (!isAllowedImageUrl(src)) {
            setError('blocked');
            setLoading(false);
            return;
        }

        // Step 2: Resolve Supabase storage URLs to signed URLs
        if (src.includes('/storage/v1/object/')) {
            try {
                // Extract the file path from the Supabase URL
                const parts = src.split('/');
                const fileName = parts[parts.length - 1];
                const signedUrl = await getSignedUrl(fileName);

                if (signedUrl) {
                    setResolvedUrl(signedUrl);
                } else {
                    setError('load_failed');
                }
            } catch (err) {
                console.error('Failed to resolve secure image:', err);
                setError('load_failed');
            }
        } else {
            // Already an allowed, non-storage URL (e.g., direct public URL or data: URI)
            setResolvedUrl(src);
        }

        setLoading(false);
    }, [src, retryCount]);

    useEffect(() => {
        resolveUrl();
    }, [resolveUrl]);

    const handleRetry = () => {
        setRetryCount((c) => c + 1);
    };

    const handleImageError = () => {
        setError('load_failed');
    };

    const containerStyle = {
        width: width || '100%',
        height: height || '200px',
    };

    // ─── Loading State ───────────────────────────────────────────────────────

    if (loading) {
        return (
            <Flex
                align="center"
                justify="center"
                style={{ ...containerStyle, backgroundColor: '#f9fafb' }}
            >
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </Flex>
        );
    }

    // ─── Blocked by URL Allowlist ────────────────────────────────────────────

    if (error === 'blocked') {
        return (
            <Flex
                align="center"
                justify="center"
                direction="column"
                gap="2"
                style={{
                    ...containerStyle,
                    backgroundColor: '#fef2f2',
                    border: '1px dashed #fecaca',
                    borderRadius: 6,
                }}
            >
                <ShieldX size={20} className="text-red-400" />
                <Text size="1" color="red" weight="medium">
                    Güvenlik: Bu görsel kaynağı engellendi
                </Text>
                <Text size="1" color="gray" align="center" style={{ maxWidth: 200 }}>
                    Yalnızca güvenilir kaynaklardan görseller görüntülenir.
                </Text>
            </Flex>
        );
    }

    // ─── Load Failed ─────────────────────────────────────────────────────────

    if (error === 'load_failed' || !resolvedUrl) {
        return (
            <Flex
                align="center"
                justify="center"
                direction="column"
                gap="2"
                style={{
                    ...containerStyle,
                    backgroundColor: '#fefce8',
                    border: '1px dashed #fde68a',
                    borderRadius: 6,
                }}
            >
                <ImageOff size={20} className="text-amber-400" />
                <Text size="1" color="amber" weight="medium">
                    Görsel yüklenemedi
                </Text>
                <Button
                    size="1"
                    variant="ghost"
                    color="amber"
                    onClick={handleRetry}
                >
                    <RefreshCw size={12} /> Tekrar Dene
                </Button>
            </Flex>
        );
    }

    // ─── Render Image ────────────────────────────────────────────────────────

    return (
        <img
            src={resolvedUrl}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            onError={handleImageError}
            style={{
                width: width,
                height: height,
                maxWidth: '100%',
                objectFit: 'cover',
                ...style,
            }}
            className={className}
            {...props}
        />
    );
}
