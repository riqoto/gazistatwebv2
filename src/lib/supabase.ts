import { createClient } from '@supabase/supabase-js';
import { LayoutJSON } from '@/types/schema';
import { validateImageFile, sanitizeAndReencodeImage, sanitizeFileName } from '@/utils/file-validation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize client only if keys are present (prevents errors during build if env vars missing)
export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

// ─── Report CRUD ─────────────────────────────────────────────────────────────

export const saveReport = async (slug: string, layout: LayoutJSON) => {
    if (!supabase) return { data: null, error: new Error('Supabase client not initialized.') };

    const { data, error } = await supabase
        .from('reports')
        .upsert({ slug, data: layout }, { onConflict: 'slug' })
        .select()
        .single();

    return { data, error };
};

export const getReport = async (slug: string): Promise<LayoutJSON | null> => {
    if (!supabase) {
        console.warn('Supabase client not initialized.');
        return null;
    }

    const { data, error } = await supabase
        .from('reports')
        .select('data')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching report:', error);
        return null;
    }

    return data?.data as LayoutJSON;
};

// ─── Secure Image Upload ─────────────────────────────────────────────────────

/**
 * Securely upload an image file to Supabase Storage.
 *
 * Pipeline:
 * 1. Validate file (magic numbers, size, dimensions, SVG/executable blocking)
 * 2. Re-encode through canvas (strips EXIF, metadata, embedded payloads)
 * 3. Generate crypto-random filename (prevents path traversal)
 * 4. Upload with explicit content-type (prevents MIME sniffing)
 */
export const uploadImage = async (file: File) => {
    if (!supabase) throw new Error('Supabase client not initialized. Check environment variables.');

    // Step 1 + 2: Validate and sanitize (re-encode strips EXIF & payloads)
    const { file: sanitizedFile, detectedType } = await sanitizeAndReencodeImage(file);

    // Step 3: Crypto-random filename
    const safeName = sanitizeFileName(sanitizedFile.name);
    const BUCKET_NAME = 'images';

    // Step 4: Upload with explicit content type
    const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(safeName, sanitizedFile, {
            contentType: sanitizedFile.type,
            cacheControl: '3600',
            upsert: false, // Never overwrite existing files
        });

    if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(safeName);

    return { fileName: safeName, publicUrl };
};

// ─── Signed URL with Caching ─────────────────────────────────────────────────

interface CachedSignedUrl {
    url: string;
    expiresAt: number;
}

const signedUrlCache = new Map<string, CachedSignedUrl>();
const SIGNED_URL_TTL = 3500 * 1000; // ~58 minutes (refresh before 1hr expiry)

/**
 * Get a signed URL for a private storage file.
 * Caches results to avoid redundant Supabase API calls.
 */
export const getSignedUrl = async (path: string): Promise<string | null> => {
    if (!supabase) return null;

    // Check cache
    const cached = signedUrlCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.url;
    }

    const { data, error } = await supabase.storage
        .from('images')
        .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
        console.error('Error creating signed URL:', error);
        return null;
    }

    // Cache the result
    signedUrlCache.set(path, {
        url: data.signedUrl,
        expiresAt: Date.now() + SIGNED_URL_TTL,
    });

    return data.signedUrl;
};
