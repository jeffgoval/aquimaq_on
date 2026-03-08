import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { processPdfForRag } from '@/services/adminService';

interface AdminPdfUploadProps {
    productId: string;
}

const AdminPdfUpload: React.FC<AdminPdfUploadProps> = ({ productId }) => {
    const [uploading, setUploading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setStatus('error');
            setMessage('Por favor, selecione um arquivo PDF válido.');
            return;
        }

        try {
            setUploading(true);
            setStatus('idle');
            setMessage('');

            const fileExt = file.name.split('.').pop()?.toLowerCase();
            const fileName = `${productId}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product-manuals')
                .upload(fileName, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw new Error('Falha ao fazer upload do arquivo.');

            const { data: urlData } = supabase.storage
                .from('product-manuals')
                .getPublicUrl(fileName);

            setUploading(false);
            setProcessing(true);

            const { chunksCount } = await processPdfForRag(productId, urlData.publicUrl);

            setStatus('success');
            setMessage(`Sucesso! ${chunksCount} trechos vetorizados.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Erro inesperado ao processar PDF.';
            setStatus('error');
            setMessage(msg);
        } finally {
            setUploading(false);
            setProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-stone-100 p-5 mt-6">
            <h2 className="text-[14px] font-medium text-stone-700 flex items-center gap-2 mb-4">
                <FileText size={16} className="text-stone-400" />
                Manuais e Bulas (RAG AI)
            </h2>

            <p className="text-stone-500 text-[13px] mb-4">
                Faça o upload de um manual ou bula em PDF. O arquivo será processado pela IA e servirá de conhecimento para o Balconista Digital.
            </p>

            <div className="relative">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || processing}
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || processing}
                    className={`
                        w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-colors
                        ${(uploading || processing) ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-200' : 'cursor-pointer hover:bg-stone-50 border-stone-300'}
                    `}
                >
                    {(uploading || processing) ? (
                        <Loader className="animate-spin text-stone-400 mb-2" size={24} />
                    ) : (
                        <Upload className="text-stone-400 mb-2" size={24} />
                    )}
                    <span className="text-[13px] font-medium text-stone-600">
                        {uploading ? 'Enviando PDF...' : processing ? 'IA vetorizando...' : 'Clique para selecionar o PDF'}
                    </span>
                    <span className="text-[11px] text-stone-400 mt-1">Apenas .pdf</span>
                </button>
            </div>

            {status !== 'idle' && (
                <div className={`mt-3 p-3 flex items-start gap-2 rounded-lg text-[13px] ${status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {status === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                    <span>{message}</span>
                </div>
            )}
        </div>
    );
};

export default AdminPdfUpload;
