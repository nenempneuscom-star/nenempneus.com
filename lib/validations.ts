import { z } from 'zod'

export const checkoutSchema = z.object({
    // Dados pessoais
    nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().email('E-mail inválido'),
    telefone: z.string().min(10, 'Telefone inválido'),
    cpf: z.string().min(11, 'CPF obrigatório').max(14, 'CPF inválido'),

    // Endereço
    cep: z.string().min(8, 'CEP inválido'),
    endereco: z.string().min(5, 'Endereço inválido'),
    numero: z.string().min(1, 'Número obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro obrigatório'),
    cidade: z.string().min(2, 'Cidade obrigatória'),
    estado: z.string().length(2, 'Estado inválido'),

    // Veículo (opcional)
    veiculoMarca: z.string().optional(),
    veiculoModelo: z.string().optional(),
    veiculoAno: z.string().optional(),
    veiculoPlaca: z.string().optional(),

    // Observações
    observacoes: z.string().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
