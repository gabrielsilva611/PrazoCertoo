import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { ProdutoFormCampos } from '../components/ProdutoFormCampos'
import { api, ApiError } from '../lib/api'
import type { Categoria, Produto } from '../types'

export function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('')
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [categoriaId, setCategoriaId] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const navegar = useNavigate()

  useEffect(() => {
    Promise.all([
      api.get<{ produto: Produto }>(`/produtos/${id}`),
      api.get<{ categorias: Categoria[] }>('/categorias'),
    ])
      .then(([resProduto, resCategorias]) => {
        const produto = resProduto.produto
        setNome(produto.nome)
        setUnidade(produto.unidade)
        setPrecoCusto(String(produto.precoCusto))
        setPrecoVenda(String(produto.precoVenda))
        setEstoqueMinimo(String(produto.estoqueMinimo))
        setCategoriaId(produto.categoriaId ?? '')
        setCategorias(resCategorias.categorias)
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o produto.'))
      .finally(() => setCarregando(false))
  }, [id])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await api.put<{ produto: Produto }>(`/produtos/${id}`, {
        nome,
        unidade,
        precoCusto: Number(precoCusto.replace(',', '.')),
        precoVenda: Number(precoVenda.replace(',', '.')),
        estoqueMinimo: Number(estoqueMinimo),
        categoriaId: categoriaId || null,
      })
      navegar('/produtos')
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o produto.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return (
      <AppLayout>
        <p className="text-sm text-brand-muted">Carregando...</p>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Editar Produto</h1>
      <p className="text-sm text-brand-muted">Atualize as informações do produto</p>

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-lg flex-col gap-4">
        <ProdutoFormCampos
          nome={nome}
          onNomeChange={setNome}
          unidade={unidade}
          onUnidadeChange={setUnidade}
          categoriaId={categoriaId}
          onCategoriaIdChange={setCategoriaId}
          categorias={categorias}
          precoCusto={precoCusto}
          onPrecoCustoChange={setPrecoCusto}
          precoVenda={precoVenda}
          onPrecoVendaChange={setPrecoVenda}
          estoqueMinimo={estoqueMinimo}
          onEstoqueMinimoChange={setEstoqueMinimo}
        />

        {erro && <p className="text-sm text-red-400">{erro}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar alterações'}
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
