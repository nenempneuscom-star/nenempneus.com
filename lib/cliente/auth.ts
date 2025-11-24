import { prisma } from '@/lib/prisma'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const LOJA_SLUG = 'nenem-pneus'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cliente-secret-key-change-in-production'
)
const COOKIE_NAME = 'cliente_session'

// Gera codigo de 6 digitos
export function gerarCodigo(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Envia codigo de verificacao (simula envio por WhatsApp)
export async function enviarCodigo(telefone: string): Promise<{ success: boolean; message: string }> {
  try {
    // Buscar ou criar cliente
    const loja = await prisma.loja.findUnique({
      where: { slug: LOJA_SLUG },
    })

    if (!loja) {
      return { success: false, message: 'Loja nao encontrada' }
    }

    // Formatar telefone (remover caracteres especiais)
    const telefoneFormatado = telefone.replace(/\D/g, '')

    if (telefoneFormatado.length < 10) {
      return { success: false, message: 'Telefone invalido' }
    }

    // Buscar cliente existente ou criar novo
    let cliente = await prisma.cliente.findFirst({
      where: {
        lojaId: loja.id,
        telefone: telefoneFormatado,
      },
    })

    const codigo = gerarCodigo()
    const expiraEm = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    if (cliente) {
      // Atualizar codigo
      await prisma.cliente.update({
        where: { id: cliente.id },
        data: {
          codigoVerificacao: codigo,
          codigoExpiraEm: expiraEm,
        },
      })
    } else {
      // Criar novo cliente
      cliente = await prisma.cliente.create({
        data: {
          lojaId: loja.id,
          nome: 'Cliente',
          telefone: telefoneFormatado,
          codigoVerificacao: codigo,
          codigoExpiraEm: expiraEm,
        },
      })
    }

    // TODO: Integrar com WhatsApp API para enviar codigo
    // Por enquanto, vamos logar no console (remover em producao)
    console.log(`[CODIGO VERIFICACAO] Telefone: ${telefoneFormatado}, Codigo: ${codigo}`)

    return {
      success: true,
      message: 'Codigo enviado! Verifique seu WhatsApp.',
    }
  } catch (error) {
    console.error('Erro ao enviar codigo:', error)
    return { success: false, message: 'Erro ao enviar codigo' }
  }
}

// Verifica codigo e cria sessao
export async function verificarCodigo(
  telefone: string,
  codigo: string
): Promise<{ success: boolean; message: string }> {
  try {
    const telefoneFormatado = telefone.replace(/\D/g, '')

    const loja = await prisma.loja.findUnique({
      where: { slug: LOJA_SLUG },
    })

    if (!loja) {
      return { success: false, message: 'Loja nao encontrada' }
    }

    const cliente = await prisma.cliente.findFirst({
      where: {
        lojaId: loja.id,
        telefone: telefoneFormatado,
      },
    })

    if (!cliente) {
      return { success: false, message: 'Cliente nao encontrado' }
    }

    // Verificar codigo
    if (cliente.codigoVerificacao !== codigo) {
      return { success: false, message: 'Codigo incorreto' }
    }

    // Verificar expiracao
    if (!cliente.codigoExpiraEm || new Date() > cliente.codigoExpiraEm) {
      return { success: false, message: 'Codigo expirado. Solicite um novo.' }
    }

    // Limpar codigo usado
    await prisma.cliente.update({
      where: { id: cliente.id },
      data: {
        codigoVerificacao: null,
        codigoExpiraEm: null,
      },
    })

    // Criar JWT
    const token = await new SignJWT({
      clienteId: cliente.id,
      lojaId: loja.id,
      telefone: telefoneFormatado,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(JWT_SECRET)

    // Salvar cookie
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
    })

    return { success: true, message: 'Login realizado com sucesso!' }
  } catch (error) {
    console.error('Erro ao verificar codigo:', error)
    return { success: false, message: 'Erro ao verificar codigo' }
  }
}

// Obter cliente logado
export async function getClienteLogado() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)

    const cliente = await prisma.cliente.findUnique({
      where: { id: payload.clienteId as string },
      include: {
        veiculos: true,
        _count: {
          select: {
            pedidos: true,
            agendamentos: true,
            favoritos: true,
          },
        },
      },
    })

    return cliente
  } catch (error) {
    console.error('Erro ao obter cliente:', error)
    return null
  }
}

// Logout
export async function logoutCliente() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Verifica se cliente esta logado (para middleware)
export async function isClienteLogado(): Promise<boolean> {
  const cliente = await getClienteLogado()
  return cliente !== null
}
