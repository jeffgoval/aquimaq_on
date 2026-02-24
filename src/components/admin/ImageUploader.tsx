import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, GripVertical, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/services/supabase';

interface ImageUploaderProps {
    images: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
    bucket?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    images,
    onChange,
    maxImages = 6,
    bucket = 'product-images'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const uploadFile = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

        if (!fileExt || !allowedExts.includes(fileExt)) {
            console.error('Invalid file type');
            return null;
        }

        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return urlData.publicUrl;
    };

    const handleFiles = async (files: FileList) => {
        const remainingSlots = maxImages - images.length;
        const filesToUpload = Array.from(files).slice(0, remainingSlots);

        if (filesToUpload.length === 0) return;

        setUploading(true);

        const uploadPromises = filesToUpload.map(uploadFile);
        const results = await Promise.all(uploadPromises);
        const successfulUploads = results.filter((url): url is string => url !== null);

        if (successfulUploads.length > 0) {
            onChange([...images, ...successfulUploads]);
        }

        setUploading(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    }, [images, maxImages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const removeImage = (index: number) => {
        onChange(images.filter((_, i) => i !== index));
    };

    const handleImageDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleImageDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        onChange(newImages);
        setDraggedIndex(index);
    };

    const handleImageDragEnd = () => {
        setDraggedIndex(null);
    };

    return (
        <div className="space-y-3">
            {/* Uploaded Images Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {images.map((url, index) => (
                        <div
                            key={url}
                            draggable
                            onDragStart={() => handleImageDragStart(index)}
                            onDragOver={(e) => handleImageDragOver(e, index)}
                            onDragEnd={handleImageDragEnd}
                            className={`
                                relative aspect-square rounded-lg overflow-hidden bg-white group cursor-move border border-stone-100
                                ${index === 0 ? 'ring-2 ring-stone-400' : ''}
                                ${draggedIndex === index ? 'opacity-50' : ''}
                            `}
                        >
                            <img src={url} alt="" className="w-full h-full object-contain" />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1">
                                <button
                                    type="button"
                                    className="p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-stone-600 hover:text-stone-800"
                                    title="Arrastar para reordenar"
                                    aria-label="Arrastar para reordenar imagem"
                                >
                                    <GripVertical size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="p-1.5 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                    title="Remover"
                                    aria-label="Remover imagem"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Main Image Badge */}
                            {index === 0 && (
                                <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-stone-800 text-white text-[9px] font-medium rounded uppercase">
                                    Principal
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Zone */}
            {images.length < maxImages && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                        ${isDragging
                            ? 'border-stone-400 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                        }
                        ${uploading ? 'pointer-events-none opacity-60' : ''}
                    `}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-2">
                        {uploading ? (
                            <>
                                <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                                <p className="text-stone-500 text-[13px]">Enviando...</p>
                            </>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <p className="text-stone-600 text-[13px] font-medium">
                                        Arraste imagens ou clique para selecionar
                                    </p>
                                    <p className="text-stone-400 text-[11px] mt-0.5">
                                        JPG, PNG, WebP · Máx. {maxImages} imagens
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Helper Text */}
            {images.length > 0 && (
                <p className="text-stone-400 text-[11px]">
                    A primeira imagem será a principal. Arraste para reordenar.
                </p>
            )}
        </div>
    );
};

export default ImageUploader;

