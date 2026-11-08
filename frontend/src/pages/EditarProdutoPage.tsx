import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AcoesFormulario } from '../components/AcoesFormulario'
import { AppLayout } from '../components/AppLayout'
import { ProdutoFormCampos } from '../components/ProdutoFormCampos'
import { useSalvarFormulario } from '../hooks/useSalvarFormulario'
import { api, ApiError } from '../lib/api'
import type { Categoria, DadosProduto, Produto } from '../types'

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
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null)
  const navegar = useNavigate()

  const { erro, salvando, submeter } = useSalvarFormulario(
    (dados: DadosProduto) => api.put(`/produtos/${id}`, dados),
    () => navegar('/produtos'),
    'Não foi possível salvar o produto.',
  )

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
      .catch((e) => setErroCarregamento(e instanceof ApiError ? e.message : 'Não foi possível carregar o produto.'))
      .finally(() => setCarregando(false))
  }, [id])

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    await submeter({
      nome,
      unidade,
      categoriaId: categoriaId || null,
      precoCusto: Number(precoCusto.replace(',', '.')),
      precoVenda: Number(precoVenda.replace(',', '.')),
      estoqueMinimo: Number(estoqueMinimo),
    })
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

        {(erro ?? erroCarregamento) && <p className="text-sm text-red-400">{erro ?? erroCarregamento}</p>}

        <AcoesFormulario
          rotuloSalvar="Salvar alterações"
          rotuloSalvando="Salvando..."
          salvando={salvando}
          onCancelar={() => navegar('/produtos')}
        />
      </form>
    </AppLayout>
  )
}
