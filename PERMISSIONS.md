# 🔐 Sistema de Permissões - NenemPneus.com

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Como Funciona](#como-funciona)
- [Como Usar](#como-usar)
- [Protegendo Páginas](#protegendo-páginas)
- [Permissões Disponíveis](#permissões-disponíveis)
- [Segurança em Camadas](#segurança-em-camadas)

---

## 🎯 Visão Geral

O sistema de permissões controla o que cada usuário pode ver e acessar no painel administrativo.

**Hierarquia de Roles:**
- **Supremo**: Acesso total (criador do sistema)
- **Admin**: Acesso administrativo completo
- **Funcionário**: Acesso limitado baseado em permissões

---

## ⚙️ Como Funciona

### 1. **Banco de Dados**
```prisma
model Usuario {
  permissoes Json @default("{
    \"dashboard\":true,
    \"produtos\":true,
    \"pedidos\":true,
    \"agendamentos\":true,
    \"whatsapp\":true,
    \"configuracoes\":false,
    \"usuarios\":false
  }")
}
```

### 2. **Fluxo de Autenticação**
```
Login → AdminLayout busca permissoes → PermissionsProvider → Componentes
```

### 3. **Níveis de Proteção**

#### ✅ Nível 1: Menu Sidebar
Filtra automaticamente items do menu baseado em permissões.

```typescript
// Sidebar.tsx
const navigation = allNavigation.filter(
  item => permissoes[item.permission] === true
)
```

#### ✅ Nível 2: Proteção de Páginas
Usa `PermissionGuard` para bloquear acesso direto via URL.

#### ✅ Nível 3: Componentes Condicionais
Usa hook `usePermissions()` para mostrar/ocultar elementos.

---

## 🚀 Como Usar

### **Método 1: Proteger Página Completa**

```typescript
// app/(admin)/dashboard/produtos/page.tsx
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function ProdutosPage() {
  const session = await getSession()
  const usuario: any = await db.usuario.findUnique({
    where: { id: session.userId },
    select: { permissoes: true }
  })

  const permissoes = typeof usuario.permissoes === 'string'
    ? JSON.parse(usuario.permissoes)
    : usuario.permissoes

  return (
    <PermissionGuard
      requiredPermission="produtos"
      userPermissions={permissoes}
    >
      {/* Conteúdo da página aqui */}
      <h1>Produtos</h1>
    </PermissionGuard>
  )
}
```

### **Método 2: Usar Hook em Componentes**

```typescript
'use client'
import { usePermissions } from '@/contexts/PermissionsContext'

export function ProdutosActions() {
  const { hasPermission } = usePermissions()

  return (
    <div>
      {hasPermission('produtos') && (
        <Button>Adicionar Produto</Button>
      )}

      {hasPermission('configuracoes') && (
        <Button>Configurações</Button>
      )}
    </div>
  )
}
```

### **Método 3: Verificar Múltiplas Permissões**

```typescript
const { hasAllPermissions, hasAnyPermission } = usePermissions()

// Usuário precisa TER TODAS as permissões
if (hasAllPermissions(['produtos', 'configuracoes'])) {
  // Mostrar funcionalidade avançada
}

// Usuário precisa TER PELO MENOS UMA permissão
if (hasAnyPermission(['produtos', 'pedidos'])) {
  // Mostrar menu de vendas
}
```

---

## 🛡️ Permissões Disponíveis

| Permissão | Descrição | Acesso |
|-----------|-----------|--------|
| `dashboard` | Página inicial do painel | Dashboard principal |
| `produtos` | Gerenciamento de produtos | CRUD de produtos |
| `pedidos` | Visualizar e gerenciar pedidos | Lista e detalhes |
| `agendamentos` | Gerenciar agendamentos | CRUD de agendamentos |
| `whatsapp` | Configuração de WhatsApp | Integração WhatsApp |
| `configuracoes` | Configurações do sistema | Ajustes gerais |
| `usuarios` | Gerenciar usuários | CRUD de usuários |

---

## 🔒 Segurança em Camadas

### **Camada 1: Interface (UI)**
```typescript
// Sidebar filtra menu automaticamente
const navigation = allNavigation.filter(item =>
  permissoes[item.permission] === true
)
```
✅ Funcionária só vê: Agendamentos
❌ Não vê: Produtos, Configurações, etc.

### **Camada 2: Rotas (Pages)**
```typescript
// PermissionGuard bloqueia acesso direto
<PermissionGuard requiredPermission="produtos">
  <ProdutosContent />
</PermissionGuard>
```
✅ Se tentar acessar `/dashboard/produtos` diretamente → **Acesso Negado**

### **Camada 3: API (Backend)**
```typescript
// TODO: Implementar verificação em API routes
export async function POST(request: Request) {
  const session = await getSession()
  const usuario = await db.usuario.findUnique(...)

  if (!usuario.permissoes.produtos) {
    return Response.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Continua processamento...
}
```

---

## 📊 Exemplo Real: Funcionária Juliana

### **Configuração no Banco:**
```json
{
  "dashboard": false,
  "produtos": false,
  "pedidos": false,
  "agendamentos": true,  ← APENAS ISSO
  "whatsapp": false,
  "configuracoes": false,
  "usuarios": false
}
```

### **O que ela vê:**
```
Sidebar:
✅ Agendamentos

Não vê:
❌ Dashboard
❌ Produtos
❌ Pedidos
❌ WhatsApp
❌ Configurações
```

### **Se tentar acessar diretamente:**
```
/dashboard/produtos → ❌ Tela "Acesso Negado"
/dashboard/agendamentos → ✅ Acesso permitido
```

---

## 🧪 Como Testar

### **1. Criar Usuário Restrito**
```sql
-- No painel de configurações → Usuários → Adicionar
-- Marque apenas: Agendamentos
```

### **2. Fazer Login**
```
Email: funcionaria@nenempneus.com
Senha: [senha configurada]
```

### **3. Verificar Menu**
- ✅ Deve ver APENAS "Agendamentos"
- ❌ Outros itens devem estar ocultos

### **4. Tentar Acesso Direto**
```
Abrir URL: /dashboard/produtos
Resultado: Tela de "Acesso Negado"
```

---

## 🔧 Modificando Permissões

### **Via Painel Admin:**
1. Login como Admin/Supremo
2. Configurações → Usuários
3. Editar usuário
4. Marcar/desmarcar permissões
5. Salvar

### **Via Código:**
```typescript
// lib/permissions.ts
export const DEFAULT_PERMISSIONS = {
  funcionario: {
    dashboard: true,
    produtos: false,
    // ... outras permissões
  }
}
```

---

## 📝 Checklist de Segurança

Ao criar nova funcionalidade admin:

- [ ] Adicionar permissão na Sidebar com `permission: 'nome'`
- [ ] Proteger página com `PermissionGuard`
- [ ] Adicionar tipo em `lib/permissions.ts` → `type Permission`
- [ ] Testar acesso com usuário restrito
- [ ] Testar acesso direto via URL
- [ ] Verificar se API routes também verificam permissão

---

## 🆘 Troubleshooting

### **Problema: Usuário vê tudo mesmo sem permissão**
✅ **Solução:**
- Verificar se `permissoes` está sendo passado para Sidebar
- Verificar console do navegador para erros
- Confirmar que permissões estão corretas no banco

### **Problema: Erro ao fazer login**
✅ **Solução:**
- Verificar se campo `permissoes` existe no banco
- Rodar: `npx prisma generate`
- Reiniciar servidor: `npm run dev`

### **Problema: PermissionGuard não funciona**
✅ **Solução:**
- Verificar se página está dentro de `(admin)` group
- Verificar se `PermissionsProvider` está no layout
- Checar imports dos componentes

---

## 🎓 Boas Práticas

1. **Princípio do Menor Privilégio**: Dê apenas as permissões necessárias
2. **Teste com Usuários Restritos**: Sempre teste funcionalidades com diferentes níveis
3. **Log de Acessos**: PermissionGuard já loga tentativas não autorizadas
4. **Auditoria Regular**: Revise permissões periodicamente
5. **Documentação**: Documente mudanças nas permissões

---

## 🚀 Roadmap Futuro

- [ ] Proteção automática de API routes
- [ ] Dashboard de auditoria de acessos
- [ ] Permissões granulares (ex: `produtos.criar`, `produtos.editar`)
- [ ] Grupos de permissões personalizados
- [ ] Histórico de mudanças de permissões

---

**Última atualização:** 2025-11-25
**Versão:** 1.0.0
**Status:** ✅ Implementado e Funcional
