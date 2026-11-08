import { FormField, estiloInput } from './FormField'
import type { Categoria } from '../types'

interface ProdutoFormCamposProps {
  nome: string
  onNomeChange: (valor: string) => void
  unidade: string
  onUnidadeChange: (valor: string) => void
  categoriaId: string
  onCategoriaIdChange: (valor: string) => void
  categorias: Categoria[]
  precoCusto: string
  onPrecoCustoChange: (valor: string) => void
  precoVenda: string
  onPrecoVendaChange: (valor: string) => void
  estoqueMinimo: string
  onEstoqueMinimoChange: (valor: string) => void
}

export function ProdutoFormCampos({
  nome,
  onNomeChange,
  unidade,
  onUnidadeChange,
  categoriaId,
  onCategoriaIdChange,
  categorias,
  precoCusto,
  onPrecoCustoChange,
  precoVenda,
  onPrecoVendaChange,
  estoqueMinimo,
  onEstoqueMinimoChange,
}: ProdutoFormCamposProps) {
  return (
    <>
      <FormField rotulo="Nome do produto" id="nome" obrigatorio>
        <input
          id="nome"
          required
          value={nome}
          onChange={(e) => onNomeChange(e.target.value)}
          className={estiloInput}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField rotulo="Unidade" id="unidade" obrigatorio>
          <input
            id="unidade"
            required
            value={unidade}
            onChange={(e) => onUnidadeChange(e.target.value)}
            placeholder="un, kg, cx..."
            className={estiloInput}
          />
        </FormField>

        <FormField rotulo="Categoria" id="categoriaId">
          <select
            id="categoriaId"
            value={categoriaId}
            onChange={(e) => onCategoriaIdChange(e.target.value)}
            className={estiloInput}
          >
            <option value="">Sem categoria</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField rotulo="Preço de custo (R$)" id="precoCusto" obrigatorio>
          <input
            id="precoCusto"
            required
            inputMode="decimal"
            value={precoCusto}
            onChange={(e) => onPrecoCustoChange(e.target.value)}
            className={estiloInput}
          />
        </FormField>
        <FormField rotulo="Preço de venda (R$)" id="precoVenda" obrigatorio>
          <input
            id="precoVenda"
            required
            inputMode="decimal"
            value={precoVenda}
            onChange={(e) => onPrecoVendaChange(e.target.value)}
            className={estiloInput}
          />
        </FormField>
      </div>

      <FormField rotulo="Estoque mínimo" id="estoqueMinimo" obrigatorio>
        <input
          id="estoqueMinimo"
          required
          type="number"
          min={0}
          value={estoqueMinimo}
          onChange={(e) => onEstoqueMinimoChange(e.target.value)}
          className={estiloInput}
        />
      </FormField>
    </>
  )
}
