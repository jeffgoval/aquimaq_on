import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Printer, FileText, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { ENV } from '@/config/env';
import { AlertDialog } from '@/components/ui/AlertDialog';

type PrintKind = 'label' | 'docs';

const AdminMePrintPage: React.FC = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const kind = (params.get('kind') ?? 'label') as PrintKind;

  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [alertState, setAlertState] = useState<{ open: boolean; title: string; description: string }>({
    open: false,
    title: '',
    description: '',
  });

  const title = useMemo(() => {
    if (kind === 'docs') return 'Docs (A4) — Melhor Envios';
    return 'Etiqueta 10×15 — Melhor Envios';
  }, [kind]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setPdfUrl('');

      try {
        if (!orderId) throw new Error('orderId não informado.');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Sessão expirada. Entre novamente.');

        const body =
          kind === 'docs'
            ? { orderId, printPage: true }
            : { orderId, streamPdf: true };

        const res = await fetch(`${ENV.VITE_SUPABASE_URL}/functions/v1/melhor-envios-print`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: ENV.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let msg = text?.trim() || `Erro ao imprimir (${res.status}).`;
          try {
            const parsed = JSON.parse(text) as { error?: string; detail?: string };
            const combined = [parsed.error, parsed.detail].filter(Boolean).join(' - ');
            if (combined) msg = combined;
          } catch {
            /* corpo não-JSON */
          }
          throw new Error(msg);
        }

        if (kind === 'docs') {
          const data = (await res.json()) as { url?: string };
          if (!data?.url) throw new Error('URL de impressão não retornada.');
          window.location.replace(data.url);
          return;
        }

        const blob = await res.blob();
        if (!blob.size) throw new Error('PDF da etiqueta veio vazio.');

        const url = URL.createObjectURL(blob);
        // Se o objetivo é não ter “uma página dentro da outra”, redireciona a aba para o PDF.
        // Mantemos pdfUrl apenas como fallback caso o redirect falhe por algum motivo.
        setPdfUrl(url);
        window.location.replace(url);
        return;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setAlertState({
          open: true,
          title: 'Falha ao imprimir',
          description: msg,
        });
      } finally {
        setLoading(false);
      }
    };

    run();

    return () => {
      // Sem revogação aqui: ao redirecionar para blob URL, revogar pode quebrar o PDF.
    };
  }, [orderId, kind]);

  const Icon = kind === 'docs' ? FileText : Printer;

  return (
    <>
      <Helmet><title>{title}</title></Helmet>

      <div className="min-h-screen bg-stone-50">
        <AlertDialog
          open={alertState.open}
          title={alertState.title}
          description={alertState.description}
          tone="danger"
          onClose={() => setAlertState({ open: false, title: '', description: '' })}
        />

        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center">
                <Icon className="w-5 h-5 text-stone-800" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-stone-900">{title}</h1>
                <p className="text-xs text-stone-500 font-mono">Pedido: {orderId || '—'}</p>
              </div>
            </div>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm hover:bg-stone-50"
                title="Abrir em nova aba (blob)"
              >
                <ExternalLink className="w-4 h-4" />
                Abrir
              </a>
            )}
          </div>

          <div className="mt-4 bg-white border border-stone-200 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-stone-500">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Preparando impressão...
              </div>
            ) : kind === 'label' ? (
              pdfUrl ? (
                <object data={pdfUrl} type="application/pdf" className="w-full h-[78vh]">
                  <div className="p-6 text-sm text-stone-600">
                    O seu navegador não conseguiu renderizar o PDF.
                    <a className="underline ml-1" href={pdfUrl} target="_blank" rel="noreferrer">Clique aqui para abrir.</a>
                  </div>
                </object>
              ) : (
                <div className="p-6 text-sm text-stone-600">Não foi possível carregar a etiqueta.</div>
              )
            ) : (
              <div className="p-6 text-sm text-stone-600">
                Redirecionando para a página de impressão...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminMePrintPage;

