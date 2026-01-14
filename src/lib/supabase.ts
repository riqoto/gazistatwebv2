import { createClient } from '@supabase/supabase-js';
import { LayoutJSON } from '@/types/schema';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Initialize client only if keys are present (prevents errors during build if env vars missing)
export const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const saveReport = async (slug: string, layout: LayoutJSON) => {
    if (!supabase) throw new Error('Supabase client not initialized. Check environment variables.');

    // Upsert the report based on slug
    const { data, error } = await supabase
        .from('reports')
        .upsert({ slug, data: layout }, { onConflict: 'slug' })
        .select()
        .single();

    if (error) throw error;
    return data;
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
        return null; // treat error as not found for now
    }

    return data?.data as LayoutJSON;
};

export const uploadImage = async (file: File) => {
    if (!supabase) throw new Error('Supabase client not initialized. Check environment variables.');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    const BUCKET_NAME = 'images'; // Must be lowercase to match most Supabase setups

    const { error: uploadError, data } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

    if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return publicUrl;
};
