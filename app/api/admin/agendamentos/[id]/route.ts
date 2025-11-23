import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await req.json()

    // Validar status permitidos
    const statusPermitidos = ['confirmado', 'em_andamento', 'concluido', 'cancelado']
    if (data.status && !statusPermitidos.includes(data.status)) {
      return NextResponse.json(
        { error: 'Status invalido' },
        { status: 400 }
      )
    }

    // Atualizar agendamento
    const agendamento = await db.agendamento.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.observacoes !== undefined && { observacoes: data.observacoes }),
        ...(data.lembreteEnviado !== undefined && { lembreteEnviado: data.lembreteEnviado }),
      },
      include: {
        cliente: {
          select: {
            nome: true,
            telefone: true,
          },
        },
        pedido: {
          select: {
            numero: true,
            total: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, agendamento })
  } catch (error: any) {
    console.error('Erro ao atualizar agendamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar agendamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.agendamento.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar agendamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar agendamento' },
      { status: 500 }
    )
  }
}
