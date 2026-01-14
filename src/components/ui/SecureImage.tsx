'use client';

import { useState, useEffect } from 'react';
import { getSignedUrl } from '@/lib/supabase';
import { Flex, Text, Box } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    width?: string | number;
    height?: string | number;
}

export function SecureImage({ src, width, height, style, ...props }: SecureImageProps) {
    const [url, setUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchUrl = async () => {
            if (!src) {
                setLoading(false);
                return;
            }

            // Check if it's a Supabase storage URL
            if (src.includes('/storage/v1/object/')) {
                try {
                    const parts = src.split('/');
                    const fileName = parts[parts.length - 1];
                    const signedUrl = await getSignedUrl(fileName);
                    if (signedUrl) {
                        setUrl(signedUrl);
                    } else {
                        setError(true);
                    }
                } catch (err) {
                    console.error('Failed to resolve secure image:', err);
                    setError(true);
                }
            } else {
                setUrl(src);
            }
            setLoading(false);
        };

        fetchUrl();
    }, [src]);

    if (loading) {
        return (
            <Flex align="center" justify="center" style={{ width: width || '100%', height: height || '200px', backgroundColor: '#f9fafb' }}>
                <Loader2 className="animate-spin text-gray-400" size={24} />
            </Flex>
        );
    }

    if (error || !url) {
        return (
            <Flex align="center" justify="center" direction="column" gap="2" style={{ width: width || '100%', height: height || '200px', backgroundColor: '#fff1f2', border: '1px dashed #fecaca' }}>
                <Text size="1" color="red">Görsel yüklenemedi (Erişim Reddedildi)</Text>
            </Flex>
        );
    }

    return (
        <img
            src={url}
            style={{
                width: width,
                height: height,
                maxWidth: '100%',
                objectFit: 'cover',
                ...style
            }}
            {...props}
        />
    );
}
