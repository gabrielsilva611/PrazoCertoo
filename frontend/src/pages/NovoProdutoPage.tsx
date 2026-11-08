import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AcoesFormulario } from '../components/AcoesFormulario'
import { AppLayout } from '../components/AppLayout'
import { ProdutoFormCampos } from '../components/ProdutoFormCampos'
import { useSalvarFormulario } from '../hooks/useSalvarFormulario'
import { api } from '../lib/api'
import type { Categoria, DadosProduto } from '../types'

export function NovoProdutoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nome, setNome] = useState('')
  const [unidade, setUnidade] = useState('un')
  const [precoCusto, setPrecoCusto] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [estoqueMinimo, setEstoqueMinimo] = useState('0')
  const [categoriaId, setCategoriaId] = useState('')
  const navegar = useNavigate()

  const { erro, salvando, submeter } = useSalvarFormulario(
    (dados: DadosProduto) => api.post('/produtos', dados),
    () => navegar('/produtos'),
    'Não foi possível cadastrar o produto.',
  )

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
    await submeter({
      nome,
      unidade,
      categoriaId: categoriaId || undefined,
      precoCusto: Number(precoCusto.replace(',', '.')),
      precoVenda: Number(precoVenda.replace(',', '.')),
      estoqueMinimo: Number(estoqueMinimo),
    })
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Novo Produto</h1>
      <p className="text-sm text-brand-muted">Preencha as informações para cadastrar o produto</p>

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

        <AcoesFormulario
          rotuloSalvar="Cadastrar Produto"
          rotuloSalvando="Salvando..."
          salvando={salvando}
          onCancelar={() => navegar('/produtos')}
        />
      </form>
    </AppLayout>
  )
}
