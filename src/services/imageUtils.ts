import { supabase } from './supabase';

export const IMAGE_SIZES = {
    productThumb: { width: 400, height: 400, quality: 75 },
    productDetail: { width: 800, height: 800, quality: 85 },
    productGallery: { width: 600, height: 600, quality: 80 },
    bannerFull: { width: 1920, height: 600, quality: 80 },
    bannerMobile: { width: 768, height: 400, quality: 75 },
} as const;

type ImagePreset = keyof typeof IMAGE_SIZES;

export function getOptimizedUrl(
    publicUrl: string,
    _options?: { width?: number; height?: number; quality?: number; resize?: 'cover' | 'contain' | 'fill' }
): string {
    return publicUrl;
}

export function getPresetUrl(publicUrl: string, _preset: ImagePreset): string {
    return publicUrl;
}

export async function compressImage(file: File, maxWidth = 1600, quality = 0.8): Promise<File> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new globalThis.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) return resolve(file);
                        const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}

export async function uploadProductImage(
    originalFile: File,
    productId: string,
    index: number = 0
): Promise<{ url: string; error: string | null }> {
    const file = await compressImage(originalFile, 1200, 0.8);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = `products/${productId}/${index}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) return { url: '', error: error.message };
    const { data } = supabase.storage.from('product-images').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
}

export async function uploadBannerImage(
    originalFile: File,
    bannerId: string
): Promise<{ url: string; error: string | null }> {
    const file = await compressImage(originalFile, 1920, 0.85);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = `banners/${bannerId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('store-assets').upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) return { url: '', error: error.message };
    const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
}

/** Upload de foto de perfil do utilizador (bucket store-assets, pasta avatars). */
export async function uploadAvatar(originalFile: File, userId: string): Promise<{ url: string; error: string | null }> {
    const file = await compressImage(originalFile, 600, 0.8);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'webp';
    const path = `avatars/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('store-assets').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) return { url: '', error: error.message };
    const { data } = supabase.storage.from('store-assets').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
}

export async function deleteImage(
    bucket: 'product-images' | 'store-assets',
    path: string
): Promise<{ error: string | null }> {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    return { error: error?.message ?? null };
}

export function validateImageFile(
    file: File,
    maxSizeMB: number = 5
): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: `Tipo não suportado: ${file.type}. Use JPEG, PNG, WebP, AVIF ou GIF.` };
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
        return { valid: false, error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB.` };
    }
    return { valid: true };
}
