# 🏺 Minhas Coleções

MVP para organizar qualquer tipo de coleção (moedas, livros, mangás, cartas, medalhas...).

**Stack:** React + TypeScript + Vite · Tailwind · Supabase (Auth, PostgreSQL, Storage) · TanStack Query · React Hook Form + Zod · Vercel

## Funcionalidades do MVP

1. Cadastro, login e recuperação de senha (Supabase Auth)
2. Criar coleção (nome, descrição, categoria, capa, visibilidade, objetivo)
3. Editar e excluir coleção
4. Cadastrar item com campos universais (ano, autor/emissor, código, estado, quantidade, preços, data e local da compra)
5. Editar e excluir item
6. Upload de até 5 fotos por item (foto principal escolhível, imagens comprimidas no navegador)
7. Tags (muitos-para-muitos)
8. Wishlist global (prioridade, preço desejado, "marcar como adquirido")
9. Pesquisa, filtros (ano, estado, tag, preço), ordenação e visualização em grade/lista
10. Dashboard e estatísticas (investido, valor estimado, valorização, evolução, distribuição por tags)

Extras do documento: landing page, sidebar no desktop + menu inferior no celular, objetivo da coleção com barra de progresso, moeda padrão (BRL/USD/EUR), modo escuro.

## Passo a passo: criar o banco de dados

### 1. Criar o projeto no Supabase
1. Acesse https://supabase.com → **New project**.
2. Escolha nome, senha do banco e região (ex: South America — São Paulo).

### 2. Criar as tabelas, regras de segurança e o bucket de fotos
1. No painel: **SQL Editor → New query**.
2. Cole **todo** o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
3. Isso cria: `profiles`, `collections`, `items`, `item_images`, `tags`, `item_tags`, o trigger que cria o profile ao cadastrar, as políticas RLS (cada usuário só acessa os próprios dados) e o bucket `item-images`.

> Rode o script **uma única vez**. Para recomeçar do zero, apague as tabelas antes.

### 3. Configurar o login
- **Authentication → Providers → Email**: já vem ativo.
- Para testar rápido, desative **Confirm email** (Authentication → Sign In / Providers → Email). Em produção, mantenha ativo.
- **Authentication → URL Configuration**: defina **Site URL** (`http://localhost:5173` em dev; a URL da Vercel em produção) e adicione `…/reset-password` em **Redirect URLs**.

### 4. Pegar as chaves
**Project Settings → API**: copie a **Project URL** e a chave **anon public**.

### 5. Variáveis de ambiente
Copie `.env.example` para `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 6. Rodar
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + build de produção
```

### 7. Deploy (Vercel)
Importe o repositório, adicione as 2 variáveis `VITE_SUPABASE_*` e faça o deploy. O `vercel.json` já cuida das rotas do React Router. Depois atualize **Site URL** e **Redirect URLs** no Supabase.

## Modelo de dados

```
auth.users 1─1 profiles 1─N collections 1─N items 1─N item_images
                    └──N tags ──N:N── items (item_tags)
```

- **Wishlist não tem tabela própria**: é `items.status = 'wishlist'`. Ao comprar, vira `owned` (sem duplicar dados).
- Colunas adicionadas ao desenho original: `collections.goal_count` (objetivo), `items.desired_price` (preço desejado da wishlist) e `item_images.user_id` (simplifica a RLS).

## Regras de cálculo

- **Investido** = soma do preço pago dos itens `owned`.
- **Valor estimado** = soma do valor estimado dos itens `owned` (se vazio, usa o preço pago).
- **Valorização** = (estimado − pago) ÷ pago × 100.
- **Evolução** usa `items.created_at` (itens acumulados por mês).
- Preço pago é o valor total do item; a quantidade é informativa.

## Observações

- O bucket de fotos é **público para leitura** (quem tem o link vê a imagem); só o dono escreve na própria pasta.
- Itens de coleções com visibilidade **pública** já ficam legíveis por RLS, mas o MVP ainda não tem a página pública (`/username`). É o próximo passo natural.
- Todos os itens do usuário são carregados de uma vez e filtrados no navegador: ótimo para centenas/poucos milhares de itens. Acima disso, vale paginar no servidor.
- Campos personalizados por coleção (`custom_fields`) ficaram para a V2, como no plano.
