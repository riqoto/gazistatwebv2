/**
 * Image Security Validation & Sanitization Layer
 *
 * Defense-in-depth approach:
 * 1. Magic number (file signature) allowlist — prevents extension spoofing
 * 2. SVG/XML/executable blocking — prevents XSS and code execution
 * 3. Dimension limits — prevents decompression bombs
 * 4. Canvas re-encoding — strips EXIF metadata, embedded payloads, steganographic data
 * 5. URL validation — prevents SSRF via external image URLs
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DIMENSION = 8192; // px — prevents decompression bombs
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

// Known dangerous file signatures (first 4 bytes)
const BLOCKED_SIGNATURES: { hex: string; label: string }[] = [
    { hex: '4D5A', label: 'Windows Executable (EXE/DLL)' },
    { hex: '25504446', label: 'PDF' },
    { hex: '504B0304', label: 'ZIP Archive' },
    { hex: '526172', label: 'RAR Archive' },
    { hex: '377ABCAF', label: '7z Archive' },
    { hex: '7F454C46', label: 'Linux Executable (ELF)' },
    { hex: 'CAFEBABE', label: 'Java Class / Mach-O' },
];

// Valid image signatures
const IMAGE_SIGNATURES = [
    { hex: 'FFD8FF', type: 'image/jpeg' as const },
    { hex: '89504E47', type: 'image/png' as const },
    { hex: '47494638', type: 'image/gif' as const },
    // WebP is a RIFF container — need deeper check
];

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    detectedType?: string;
}

export interface SanitizeResult {
    file: File;
    originalSize: number;
    sanitizedSize: number;
    detectedType: string;
}

// ─── Magic Number Validation ─────────────────────────────────────────────────

/**
 * Read the first N bytes of a file and return as hex string
 */
async function readFileHeader(file: File, bytes: number = 12): Promise<string> {
    const buffer = await file.slice(0, bytes).arrayBuffer();
    const view = new Uint8Array(buffer);
    return Array.from(view)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

/**
 * Check for SVG/XML text content in the first 512 bytes.
 * SVGs can contain <script> tags and are a major XSS vector.
 */
async function containsSvgOrXml(file: File): Promise<boolean> {
    const slice = await file.slice(0, 512).text();
    const lower = slice.toLowerCase().trim();
    return (
        lower.includes('<svg') ||
        lower.includes('<?xml') ||
        lower.includes('<!doctype svg') ||
        lower.includes('xmlns="http://www.w3.org/2000/svg"')
    );
}

/**
 * Detect the real MIME type from magic numbers
 */
function detectTypeFromSignature(hex: string): string | null {
    // Check standard image signatures
    for (const sig of IMAGE_SIGNATURES) {
        if (hex.startsWith(sig.hex)) return sig.type;
    }

    // WebP: must be RIFF....WEBP
    // Bytes 0-3: "RIFF" = 52494646
    // Bytes 8-11: "WEBP" = 57454250
    if (hex.startsWith('52494646') && hex.length >= 24 && hex.substring(16, 24) === '57454250') {
        return 'image/webp';
    }

    return null;
}

// ─── Core Validation ─────────────────────────────────────────────────────────

/**
 * Validates an image file with defense-in-depth checks:
 * 1. File size limit
 * 2. Blocked signature detection
 * 3. SVG/XML content detection
 * 4. Magic number allowlist
 * 5. Dimension limits (anti-decompression-bomb)
 */
export async function validateImageFile(file: File): Promise<ValidationResult> {
    // 1. Size check
    if (file.size > MAX_FILE_SIZE) {
        return { isValid: false, error: `Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'dan büyük olamaz.` };
    }

    if (file.size === 0) {
        return { isValid: false, error: 'Dosya boş.' };
    }

    // 2. Read file header
    const headerHex = await readFileHeader(file, 12);

    // 3. Block known dangerous file types
    for (const blocked of BLOCKED_SIGNATURES) {
        if (headerHex.startsWith(blocked.hex)) {
            return { isValid: false, error: `${blocked.label} dosyaları yüklenemez.` };
        }
    }

    // 4. SVG / XML detection (XSS vector)
    if (await containsSvgOrXml(file)) {
        return { isValid: false, error: 'SVG dosyaları güvenlik nedeniyle desteklenmiyor.' };
    }

    // 5. Magic number allowlist — must be a known image type
    const detectedType = detectTypeFromSignature(headerHex);
    if (!detectedType) {
        return { isValid: false, error: 'Tanınmayan dosya biçimi. Yalnızca JPEG, PNG, GIF ve WebP desteklenir.' };
    }

    // 6. Dimension check via createImageBitmap (prevents decompression bombs)
    try {
        const bitmap = await createImageBitmap(file);
        const { width, height } = bitmap;
        bitmap.close();

        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            return {
                isValid: false,
                error: `Görsel boyutları ${MAX_DIMENSION}x${MAX_DIMENSION} pikselden büyük olamaz (mevcut: ${width}x${height}).`,
            };
        }

        if (width === 0 || height === 0) {
            return { isValid: false, error: 'Geçersiz görsel boyutları.' };
        }
    } catch {
        return { isValid: false, error: 'Dosya geçerli bir görsel olarak okunamadı.' };
    }

    return { isValid: true, detectedType };
}

// ─── EXIF Stripping & Re-encoding ────────────────────────────────────────────

/**
 * Sanitizes an image by re-encoding it through an HTML Canvas.
 * This strips ALL metadata (EXIF, GPS, camera info, ICC profiles, embedded thumbnails)
 * and neutralizes any steganographic or embedded payloads.
 *
 * The output is always JPEG (for photos) or PNG (for transparency).
 */
export async function sanitizeAndReencodeImage(file: File): Promise<SanitizeResult> {
    const validation = await validateImageFile(file);
    if (!validation.isValid) {
        throw new Error(validation.error || 'Doğrulama başarısız oldu.');
    }

    const detectedType = validation.detectedType || 'image/jpeg';
    const originalSize = file.size;

    // Load the image through the browser's decoder
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Create an offscreen canvas (no DOM needed)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        bitmap.close();
        throw new Error('Canvas bağlamı oluşturulamadı.');
    }

    // Draw image — this inherently strips EXIF + all metadata
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    // Re-encode: use PNG if original was PNG or GIF (preserve transparency), else JPEG
    const outputType = (detectedType === 'image/png' || detectedType === 'image/gif')
        ? 'image/png'
        : 'image/jpeg';
    const quality = outputType === 'image/jpeg' ? 0.92 : undefined;

    const blob = await canvas.convertToBlob({ type: outputType, quality });

    // Generate a sanitized filename
    const ext = outputType === 'image/png' ? 'png' : 'jpg';
    const sanitizedName = sanitizeFileName(`upload.${ext}`);
    const sanitizedFile = new File([blob], sanitizedName, { type: outputType });

    return {
        file: sanitizedFile,
        originalSize,
        sanitizedSize: sanitizedFile.size,
        detectedType,
    };
}

// ─── Filename Sanitization ───────────────────────────────────────────────────

/**
 * Generate a crypto-random, path-traversal-safe filename.
 * Never use the original user-provided filename.
 */
export function sanitizeFileName(originalName: string): string {
    const ext = originalName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const safeExt = allowedExts.includes(ext) ? ext : 'png';

    // Crypto-random ID
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const randomStr = Array.from(array)
        .map((b) => b.toString(36).padStart(2, '0'))
        .join('')
        .substring(0, 20);

    return `img-${Date.now()}-${randomStr}.${safeExt}`;
}

// ─── URL Validation ──────────────────────────────────────────────────────────

/**
 * Validate that an image URL is safe to render.
 * Only allows HTTPS URLs from the app's Supabase storage domain.
 */
export function isAllowedImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;

    // Allow data: URIs (only image types)
    if (url.startsWith('data:image/')) return true;

    // Allow blob: URIs (browser-generated)
    if (url.startsWith('blob:')) return true;

    // Must be HTTPS
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;

        // Allow the app's Supabase storage domain
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
            const supabaseDomain = new URL(supabaseUrl).hostname;
            if (parsed.hostname === supabaseDomain) return true;
        }

        // Block all other external domains by default
        // Uncomment below if you want to allow all HTTPS images:
        // return true;

        return false;
    } catch {
        return false;
    }
}

// ─── Crop Helper ─────────────────────────────────────────────────────────────

/**
 * Process a cropped image area into a clean, re-encoded File.
 * Output is always re-encoded (strips EXIF, neutralizes payloads).
 *
 * IMPORTANT: pixelCrop values from react-easy-crop are floats.
 * They MUST be rounded to integers for canvas drawImage to work correctly.
 */
export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    fileName: string
): Promise<File | null> {
    const image = await loadImage(imageSrc);

    // Round all crop values — react-easy-crop returns floats which cause
    // sub-pixel rendering issues and can result in the full image being drawn
    const sx = Math.round(pixelCrop.x);
    const sy = Math.round(pixelCrop.y);
    const sw = Math.round(pixelCrop.width);
    const sh = Math.round(pixelCrop.height);

    if (sw <= 0 || sh <= 0) {
        console.error('Invalid crop dimensions:', { sx, sy, sw, sh });
        return null;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Set canvas to the exact crop dimensions
    canvas.width = sw;
    canvas.height = sh;

    // Draw ONLY the cropped region onto the canvas
    ctx.drawImage(
        image,
        sx, sy, sw, sh,  // source rectangle (crop area from original)
        0, 0, sw, sh     // destination rectangle (full canvas)
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas boş — kırpma başarısız.'));
                    return;
                }
                const safeFileName = sanitizeFileName(fileName);
                const file = new File([blob], safeFileName, { type: 'image/jpeg' });
                resolve(file);
            },
            'image/jpeg',
            0.92
        );
    });
}

/**
 * Safely load an image with timeout.
 * Only sets crossOrigin for http(s) URLs — blob: and data: URLs are
 * same-origin and setting crossOrigin on them can taint the canvas.
 */
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        const timeout = setTimeout(() => {
            reject(new Error('Görsel yükleme zaman aşımına uğradı.'));
        }, 15000);

        image.addEventListener('load', () => {
            clearTimeout(timeout);
            resolve(image);
        });
        image.addEventListener('error', () => {
            clearTimeout(timeout);
            reject(new Error('Görsel yüklenemedi.'));
        });

        // Only set crossOrigin for remote URLs — blob: and data: are same-origin
        // Setting crossOrigin on blob URLs can taint the canvas in some browsers
        if (url.startsWith('http://') || url.startsWith('https://')) {
            image.crossOrigin = 'anonymous';
        }

        image.src = url;
    });
}
