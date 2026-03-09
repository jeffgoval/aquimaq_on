/**
 * Exporta o schema público do Supabase via Management API (database/query)
 * Gera supabase/migrations/00000000000000_schema_base.sql
 */

const PROJECT_REF = 'bzicdqrbqykypzesxayw'
const ACCESS_TOKEN = 'sbp_e6f0140684bd33aca249d0f572398e5be3d7f94e'
const BASE = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`

async function q(query) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Query failed ${res.status}: ${txt}\nQuery: ${query}`)
  }
  return res.json()
}

async function main() {
  console.log('Exportando schema via Supabase Management API...\n')

  // 1. Listar tabelas do schema public (excluir tabelas do supabase internals)
  const tables = await q(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `)
  console.log(`Tabelas encontradas: ${tables.map(t => t.table_name).join(', ')}\n`)

  // 2. Para cada tabela, gerar o DDL usando pg_get_tabledef via pg_dump simulado
  // Alternativa: usar a função generate_create_table_statement
  // Vamos usar information_schema + pg_catalog para montar o DDL manualmente

  const lines = []
  lines.push('-- ============================================================')
  lines.push('-- Schema base do banco Aquimaq — gerado automaticamente')
  lines.push(`-- Data: ${new Date().toISOString()}`)
  lines.push('-- Supabase projeto: ' + PROJECT_REF)
  lines.push('-- ============================================================')
  lines.push('')
  lines.push('-- Extensões necessárias')
  lines.push('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
  lines.push('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
  lines.push('CREATE EXTENSION IF NOT EXISTS "vector";')
  lines.push('')

  for (const { table_name } of tables) {
    console.log(`  Processando tabela: ${table_name}`)

    // Colunas
    const cols = await q(`
      SELECT
        c.column_name,
        c.udt_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        c.ordinal_position,
        -- Para tipos de array e especiais
        CASE
          WHEN c.data_type = 'ARRAY' THEN e.data_type
          ELSE NULL
        END AS array_element_type,
        -- Verificar se é serial/identity
        CASE
          WHEN c.column_default LIKE 'nextval%' THEN true
          ELSE false
        END AS is_serial
      FROM information_schema.columns c
      LEFT JOIN information_schema.element_types e
        ON c.table_catalog = e.object_catalog
        AND c.table_schema = e.object_schema
        AND c.table_name = e.object_name
        AND c.column_name = e.collection_type_identifier
      WHERE c.table_schema = 'public'
        AND c.table_name = '${table_name}'
      ORDER BY c.ordinal_position
    `)

    // Primary key
    const pks = await q(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
      ORDER BY kcu.ordinal_position
    `)

    // Foreign keys
    const fks = await q(`
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule,
        rc.update_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
    `)

    // Unique constraints (excluindo PKs)
    const uqs = await q(`
      SELECT tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
      ORDER BY tc.constraint_name, kcu.ordinal_position
    `)

    // Check constraints
    const checks = await q(`
      SELECT cc.constraint_name, cc.check_clause
      FROM information_schema.check_constraints cc
      JOIN information_schema.table_constraints tc
        ON cc.constraint_name = tc.constraint_name
        AND cc.constraint_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
        AND tc.table_name = '${table_name}'
        AND tc.constraint_type = 'CHECK'
    `)

    // Montar tipo de coluna
    function colType(col) {
      const { data_type, udt_name, character_maximum_length, numeric_precision, numeric_scale } = col
      if (data_type === 'USER-DEFINED') return udt_name  // vector, uuid customizado, etc
      if (data_type === 'ARRAY') return `${col.array_element_type || 'text'}[]`
      if (data_type === 'character varying') {
        return character_maximum_length ? `varchar(${character_maximum_length})` : 'text'
      }
      if (data_type === 'character') return `char(${character_maximum_length || 1})`
      if (data_type === 'numeric') {
        if (numeric_precision && numeric_scale) return `numeric(${numeric_precision},${numeric_scale})`
        return 'numeric'
      }
      // Mapear tipos comuns
      const map = {
        'integer': 'integer',
        'bigint': 'bigint',
        'smallint': 'smallint',
        'boolean': 'boolean',
        'text': 'text',
        'json': 'json',
        'jsonb': 'jsonb',
        'timestamp without time zone': 'timestamp',
        'timestamp with time zone': 'timestamptz',
        'date': 'date',
        'time without time zone': 'time',
        'double precision': 'float8',
        'real': 'float4',
        'uuid': 'uuid',
        'bytea': 'bytea',
      }
      return map[data_type] || udt_name || data_type
    }

    lines.push(`-- ==========================================`)
    lines.push(`-- Tabela: ${table_name}`)
    lines.push(`-- ==========================================`)
    lines.push(`CREATE TABLE IF NOT EXISTS public.${table_name} (`)

    const colDefs = []
    for (const col of cols) {
      let def = `  ${col.column_name} ${colType(col)}`
      // DEFAULT: ignorar defaults de sequences (serial) pois uuid e serial têm sintaxe própria
      if (col.column_default !== null && col.column_default !== undefined) {
        def += ` DEFAULT ${col.column_default}`
      }
      if (col.is_nullable === 'NO') def += ' NOT NULL'
      colDefs.push(def)
    }

    // PK
    if (pks.length > 0) {
      colDefs.push(`  PRIMARY KEY (${pks.map(p => p.column_name).join(', ')})`)
    }

    // FK
    for (const fk of fks) {
      let fkDef = `  CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name})`
      fkDef += ` REFERENCES public.${fk.foreign_table_name} (${fk.foreign_column_name})`
      if (fk.delete_rule && fk.delete_rule !== 'NO ACTION') fkDef += ` ON DELETE ${fk.delete_rule}`
      if (fk.update_rule && fk.update_rule !== 'NO ACTION') fkDef += ` ON UPDATE ${fk.update_rule}`
      colDefs.push(fkDef)
    }

    // UNIQUE
    const uqGroups = {}
    for (const uq of uqs) {
      if (!uqGroups[uq.constraint_name]) uqGroups[uq.constraint_name] = []
      uqGroups[uq.constraint_name].push(uq.column_name)
    }
    for (const [name, cols2] of Object.entries(uqGroups)) {
      colDefs.push(`  CONSTRAINT ${name} UNIQUE (${cols2.join(', ')})`)
    }

    // CHECK
    for (const chk of checks) {
      // Supabase adiciona NOT NULL checks automaticamente, pular
      if (chk.check_clause.includes('IS NOT NULL')) continue
      colDefs.push(`  CONSTRAINT ${chk.constraint_name} CHECK (${chk.check_clause})`)
    }

    lines.push(colDefs.join(',\n'))
    lines.push(');')
    lines.push('')
  }

  // 3. Índices (excluindo PKs e UQs que já foram gerados)
  console.log('\n  Buscando índices...')
  const indexes = await q(`
    SELECT
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      -- excluir PKs e UQs (já declarados no CREATE TABLE)
      AND indexname NOT IN (
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND constraint_type IN ('PRIMARY KEY', 'UNIQUE')
      )
    ORDER BY tablename, indexname
  `)

  if (indexes.length > 0) {
    lines.push('-- ==========================================')
    lines.push('-- Índices')
    lines.push('-- ==========================================')
    for (const idx of indexes) {
      lines.push(`${idx.indexdef};`)
    }
    lines.push('')
  }

  // 4. RLS
  console.log('  Buscando RLS...')
  const rlsTables = await q(`
    SELECT relname AS table_name
    FROM pg_class
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
      AND pg_class.relrowsecurity = true
      AND pg_class.relkind = 'r'
    ORDER BY relname
  `)

  if (rlsTables.length > 0) {
    lines.push('-- ==========================================')
    lines.push('-- Row Level Security')
    lines.push('-- ==========================================')
    for (const { table_name } of rlsTables) {
      lines.push(`ALTER TABLE public.${table_name} ENABLE ROW LEVEL SECURITY;`)
    }
    lines.push('')
  }

  // 5. Políticas RLS
  const policies = await q(`
    SELECT
      polname AS policy_name,
      relname AS table_name,
      CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
      END AS command,
      pg_get_expr(polqual, polrelid) AS using_expr,
      pg_get_expr(polwithcheck, polrelid) AS check_expr,
      ARRAY(SELECT rolname FROM pg_roles WHERE oid = ANY(polroles)) AS roles
    FROM pg_policy
    JOIN pg_class ON pg_class.oid = pg_policy.polrelid
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
    WHERE pg_namespace.nspname = 'public'
    ORDER BY relname, polname
  `)

  if (policies.length > 0) {
    lines.push('-- ==========================================')
    lines.push('-- Políticas RLS')
    lines.push('-- ==========================================')
    for (const pol of policies) {
      const rolesArr = Array.isArray(pol.roles) ? pol.roles : (pol.roles ? [pol.roles] : [])
      const roles = rolesArr.length > 0 ? ` TO ${rolesArr.join(', ')}` : ''
      let polSql = `CREATE POLICY "${pol.policy_name}" ON public.${pol.table_name} FOR ${pol.command}${roles}`
      if (pol.using_expr) polSql += `\n  USING (${pol.using_expr})`
      if (pol.check_expr) polSql += `\n  WITH CHECK (${pol.check_expr})`
      lines.push(polSql + ';')
      lines.push('')
    }
  }

  // 6. Funções customizadas
  console.log('  Buscando funções...')
  const functions = await q(`
    SELECT
      p.proname AS function_name,
      pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    ORDER BY p.proname
  `)

  if (functions.length > 0) {
    lines.push('-- ==========================================')
    lines.push('-- Funções')
    lines.push('-- ==========================================')
    for (const fn of functions) {
      lines.push(fn.definition + ';')
      lines.push('')
    }
  }

  // Salvar arquivo
  const { writeFileSync } = await import('fs')
  const outPath = 'supabase/migrations/00000000000000_schema_base.sql'
  writeFileSync(outPath, lines.join('\n'), 'utf8')

  const lineCount = lines.length
  console.log(`\nSchema exportado com sucesso!`)
  console.log(`Arquivo: ${outPath}`)
  console.log(`Total: ${lineCount} linhas`)
  console.log(`Tabelas: ${tables.length}`)
  console.log(`Índices: ${indexes.length}`)
  console.log(`Políticas RLS: ${policies.length}`)
  console.log(`Funções: ${functions.length}`)
}

main().catch(e => { console.error(e.message); process.exit(1) })
