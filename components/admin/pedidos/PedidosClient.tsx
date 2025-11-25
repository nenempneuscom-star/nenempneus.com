'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Search,
    Filter,
    MoreHorizontal,
    Eye,
    FileEdit,
    Trash2,
    ArrowUpDown,
    Calendar,
    Download
} from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface PedidosClientProps {
    initialPedidos: any[]
    total: number
    pages: number
}

export function PedidosClient({ initialPedidos, total, pages }: PedidosClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [status, setStatus] = useState(searchParams.get('status') || 'todos')
    const debouncedSearch = useDebounce(search, 500)

    useEffect(() => {
        const params = new URLSearchParams(searchParams)
        if (debouncedSearch) {
            params.set('search', debouncedSearch)
        } else {
            params.delete('search')
        }
        if (status && status !== 'todos') {
            params.set('status', status)
        } else {
            params.delete('status')
        }
        params.set('page', '1') // Reset page on filter change
        router.push(`?${params.toString()}`)
    }, [debouncedSearch, status, router, searchParams])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pago':
                return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
            case 'pendente':
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200'
            case 'cancelado':
                return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
            default:
                return 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
        }
    }

    const handleExport = () => {
        // Preparar dados para CSV
        const csvData = initialPedidos.map(pedido => ({
            'Nº Pedido': pedido.numero,
            'Cliente': pedido.cliente.nome,
            'Email': pedido.cliente.email || '',
            'Telefone': pedido.cliente.telefone || '',
            'Status': pedido.status,
            'Data': formatDate(pedido.createdAt),
            'Total': Number(pedido.total).toFixed(2)
        }))

        // Converter para CSV
        if (csvData.length === 0) {
            alert('Nenhum pedido para exportar')
            return
        }

        const headers = Object.keys(csvData[0])
        const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
        ].join('\n')

        // Criar blob e download
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[300px]">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por cliente ou nº do pedido..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px]">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos os Status</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="pago">Pago</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card className="border-none shadow-md">
                <CardHeader className="px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Listagem de Pedidos</CardTitle>
                            <CardDescription>
                                Gerencie os pedidos da sua loja. Total: {total}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[100px]">Nº Pedido</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialPedidos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhum pedido encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialPedidos.map((pedido) => (
                                    <TableRow key={pedido.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">#{pedido.numero}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{pedido.cliente.nome}</span>
                                                <span className="text-xs text-muted-foreground">{pedido.cliente.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(pedido.status)}>
                                                {pedido.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(pedido.createdAt)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatPrice(Number(pedido.total))}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" /> Ver detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <FileEdit className="mr-2 h-4 w-4" /> Editar status
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Cancelar pedido
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
