import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_EMBEDDING_MODEL = 'text-embedding-3-small';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { docId } = await req.json();
    if (!docId) throw new Error('Document ID is required');

    // 1. Get the document info
    const { data: docInfo, error: docError } = await supabase
      .from('ai_knowledge_base')
      .select('*')
      .eq('id', docId)
      .single();

    if (docError || !docInfo) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    // Text is pre-extracted by the browser (PDF parsing happens client-side via pdfjs-dist).
    // Non-PDF files store a URL reference — skip them here.
    const fullText = docInfo.content?.trim() ?? '';

    if (!fullText || fullText.startsWith('[Ficheiro:') || fullText.length < 20) {
      return new Response(
        JSON.stringify({ message: 'No indexable text content — skipping.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get AI Settings
    const { data: aiSettings, error: aiError } = await supabase
      .from('ai_settings')
      .select('*')
      .maybeSingle();

    if (aiError || !aiSettings || !aiSettings.api_key) {
      throw new Error('AI Settings (API Key) not configured in the database.');
    }

    if (aiSettings.provider !== 'openai') {
      throw new Error(`Unsupported AI Provider: ${aiSettings.provider}`);
    }

    // 3. Chunk the text
    const chunks: string[] = [];
    const chunkSize = 1500;
    const overlap = 200;

    let currentIndex = 0;
    while (currentIndex < fullText.length) {
      let end = Math.min(currentIndex + chunkSize, fullText.length);
      if (end < fullText.length) {
        const lastNewline = fullText.lastIndexOf('\n', end);
        if (lastNewline > currentIndex + chunkSize / 2) {
          end = lastNewline;
        } else {
          const lastPeriod = fullText.lastIndexOf('.', end);
          if (lastPeriod > currentIndex + chunkSize / 2) {
            end = lastPeriod + 1;
          }
        }
      }
      chunks.push(fullText.substring(currentIndex, end).trim());
      currentIndex = end - overlap;
    }

    // 4. Generate Embeddings & Save to DB
    const apiKey = aiSettings.api_key;
    const model = aiSettings.model || OPENAI_EMBEDDING_MODEL;

    // Delete the original placeholder row
    await supabase.from('ai_knowledge_base').delete().eq('id', docId);

    const insertedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      if (!chunkText) continue;

      const embedResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: chunkText,
          model: model
        })
      });

      if (!embedResponse.ok) {
        const errBody = await embedResponse.text();
        throw new Error(`OpenAI API error: ${embedResponse.status} - ${errBody}`);
      }

      const embedData = await embedResponse.json();
      const embedding = embedData.data[0].embedding;

      const { data: inserted, error: insertError } = await supabase
        .from('ai_knowledge_base')
        .insert({
          source_type: docInfo.source_type,
          source_id: docInfo.source_id,
          title: `${docInfo.title} (Parte ${i + 1}/${chunks.length})`,
          content: chunkText,
          chunk_index: i,
          embedding: `[${embedding.join(',')}]`
        })
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Error saving chunk to DB: ${insertError.message}`);
      }
      insertedChunks.push(inserted.id);
    }

    return new Response(JSON.stringify({
      message: 'Document successfully processed and vectorized',
      chunksProcessed: chunks.length,
      documentTitle: docInfo.title
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
