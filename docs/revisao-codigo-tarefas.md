# Revisão da base de código — tarefas sugeridas

## 1) Corrigir erro de digitação
**Problema encontrado:** O nome do projeto no título do README está como `Aquimap`, enquanto o restante do repositório usa `aquimaq`.

**Tarefa sugerida:**
- Ajustar o título principal do README de `Aquimap` para `Aquimaq` para manter consistência de marca.

**Critério de aceite:**
- O título do README usa o mesmo nome do projeto definido no repositório/package.

---

## 2) Corrigir bug de tipagem que quebra o build (`type-check`)
**Problema encontrado:** `src/services/reviewService.ts` importa `ReviewRow`, mas esse tipo não é exportado por `src/types/database.ts`. Isso aparece como erro no `tsc --noEmit`.

**Tarefa sugerida:**
- Criar e exportar o tipo de linha da tabela `reviews` em `src/types/database.ts` **ou** alterar `reviewService` para usar um tipo existente compatível.
- Garantir que o retorno de `getReviewsByProductId` reflita os campos realmente usados pelo componente de avaliações.

**Critério de aceite:**
- O erro `Module '"@/types/database"' has no exported member 'ReviewRow'` desaparece no `npm run type-check`.

---

## 3) Ajustar discrepância de documentação
**Problema encontrado:** O README instrui aplicar a migration `supabase/migrations/20250223100000_crud_rls_policies.sql`, mas esse arquivo não existe no diretório de migrations atual.

**Tarefa sugerida:**
- Atualizar a seção de setup do README para apontar apenas para migrations reais presentes no projeto.
- Se a migration foi removida, documentar explicitamente o novo caminho/processo para aplicar RLS.

**Critério de aceite:**
- Todas as referências de migrations no README apontam para arquivos existentes em `supabase/migrations/`.

---

## 4) Melhorar cobertura de teste
**Problema encontrado:** Não há script de teste no `package.json`, o que reduz a segurança para refactors e regressões.

**Tarefa sugerida:**
- Adicionar stack de testes (ex.: Vitest + Testing Library para frontend) e criar pelo menos um teste de unidade para utilitários críticos (por exemplo cálculo de carrinho em `src/utils/cart-calculations.ts`).
- Incluir script `npm test` e, opcionalmente, `npm run test:watch`.

**Critério de aceite:**
- `package.json` contém scripts de teste.
- Pelo menos 1 teste automatizado roda com sucesso em CI/local.
