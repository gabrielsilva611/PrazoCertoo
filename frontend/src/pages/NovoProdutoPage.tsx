import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { api, ApiError } from '../lib/api'
import type { Categoria, Produto } from '../types'

export function NovoProdutoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('un')
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [categoriaId, setCategoriaId] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const navegar = useNavigate()

  useEffect(() => {
    api
      .get<{ categorias: Categoria[] }>('/categorias')
      .then((r) => setCategorias(r.categorias))
      .catch(() => {
        // Categoria é opcional no cadastro — se a listagem falhar, segue sem o select populado.
      })
  }, [])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await api.post<{ produto: Produto }>('/produtos', {
        nome,
        unidade,
        precoCusto: Number(precoCusto.replace(',', '.')),
        precoVenda: Number(precoVenda.replace(',', '.')),
        estoqueMinimo: Number(estoqueMinimo),
        categoriaId: categoriaId || undefined,
      })
      navegar('/produtos')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cadastrar o produto.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Novo Produto</h1>
      <p className="text-sm text-brand-muted">Preencha as informações para cadastrar o produto</p>

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-lg flex-col gap-4">
        <FormField rotulo="Nome do produto" id="nome" obrigatorio>
          <input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField rotulo="Unidade" id="unidade" obrigatorio>
            <input
              id="unidade"
              required
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              placeholder="un, kg, cx..."
              className={estiloInput}
            />
          </FormField>

          <FormField rotulo="Categoria" id="categoriaId">
            <select
              id="categoriaId"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
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
              onChange={(e) => setPrecoCusto(e.target.value)}
              className={estiloInput}
            />
          </FormField>
          <FormField rotulo="Preço de venda (R$)" id="precoVenda" obrigatorio>
            <input
              id="precoVenda"
              required
              inputMode="decimal"
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
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
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Cadastrar Produto'}
          </button>
          <button
            type="button"
            onClick={() => navegar('/produtos')}
            className="rounded-md border border-brand-border px-4 py-2 text-brand-text hover:border-brand-accent"
          >
            Cancelar
          </button>
        </div>
      </form>
    </AppLayout>
  )
}
