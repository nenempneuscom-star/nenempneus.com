import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// Tipo das feature flags
export type FeatureFlags = {
  importacaoEmMassa: boolean
  exportacaoRelatorios: boolean
  notificacoesWhatsapp: boolean
}

// GET /api/configuracoes/feature-flags
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar loja
    const loja = await db.loja.findFirst()
    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Buscar configurações
    let settings = await db.settings.findUnique({
      where: { lojaId: loja.id },
      select: { featureFlags: true }
    })

    // Se não existir, criar com valores padrão
    if (!settings) {
      settings = await db.settings.create({
        data: {
          lojaId: loja.id,
          featureFlags: {
            importacaoEmMassa: false,
            exportacaoRelatorios: true,
            notificacoesWhatsapp: true
          }
        },
        select: { featureFlags: true }
      })
    }

    // Parse feature flags
    const featureFlags = typeof settings.featureFlags === 'string'
      ? JSON.parse(settings.featureFlags)
      : settings.featureFlags

    return NextResponse.json({
      success: true,
      featureFlags
    })

  } catch (error) {
    console.error('[ERRO] Erro ao buscar feature flags:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// PATCH /api/configuracoes/feature-flags
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verificar permissão
    const usuario: any = await db.usuario.findUnique({
      where: { id: session.userId },
      select: { role: true, permissoes: true }
    })

    // Apenas supremo e admin podem alterar feature flags
    if (usuario.role !== 'supremo' && usuario.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para alterar configurações' },
        { status: 403 }
      )
    }

    // Buscar loja
    const loja = await db.loja.findFirst()
    if (!loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      )
    }

    // Obter dados do body
    const body = await request.json()
    const { featureFlags } = body

    if (!featureFlags || typeof featureFlags !== 'object') {
      return NextResponse.json(
        { error: 'Feature flags inválidas' },
        { status: 400 }
      )
    }

    // Validar estrutura
    const validKeys = ['importacaoEmMassa', 'exportacaoRelatorios', 'notificacoesWhatsapp']
    const invalidKeys = Object.keys(featureFlags).filter(key => !validKeys.includes(key))

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        { error: `Flags inválidas: ${invalidKeys.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tipos (todos devem ser boolean)
    const invalidTypes = Object.entries(featureFlags)
      .filter(([_, value]) => typeof value !== 'boolean')
      .map(([key]) => key)

    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Valores devem ser boolean: ${invalidTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Atualizar configurações
    const settings = await db.settings.upsert({
      where: { lojaId: loja.id },
      update: {
        featureFlags
      },
      create: {
        lojaId: loja.id,
        featureFlags
      },
      select: { featureFlags: true }
    })

    const updatedFlags = typeof settings.featureFlags === 'string'
      ? JSON.parse(settings.featureFlags)
      : settings.featureFlags

    console.log(`[FEATURE FLAGS] Atualizado por ${usuario.role}:`, updatedFlags)

    return NextResponse.json({
      success: true,
      featureFlags: updatedFlags,
      message: 'Configurações atualizadas com sucesso'
    })

  } catch (error) {
    console.error('[ERRO] Erro ao atualizar feature flags:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}
