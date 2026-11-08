import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../AuthContext'
import { AppLayout } from './AppLayout'
import { FormField, estiloInput } from './FormField'
import { api, ApiError } from '../lib/api'

interface ItemCadastro {
  id: string
  nome: string
  [chave: string]: unknown
}

interface CampoSecundario {
  chave: string
  rotulo: string
  placeholder?: string
}

interface CadastroSimplesPageProps {
  recurso: string
  plural: string
  titulo: string
  singular: string
  genero: 'a' | 'o'
  campoSecundario?: CampoSecundario
}

// Tela genérica de cadastro de apoio (Categoria, Fornecedor): lista, criação
// inline e exclusão. Os dois recursos são estruturalmente idênticos — nome
// + um campo secundário opcional — por isso uma tela só, em vez de duplicar
// a mesma estrutura duas vezes (igual já foi extraído nos testes do backend).
export function CadastroSimplesPage({
  recurso,
  plural,
  titulo,
  singular,
  genero,
  campoSecundario,
}: CadastroSimplesPageProps) {
  const { usuario } = useAuth()
  const podeExcluir = usuario?.perfil === 'DONO'

  const [itens, setItens] = useState<ItemCadastro[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [nome, setNome] = useState('')
  const [secundario, setSecundario] = useState('')
  const [salvando, setSalvando] = useState(false)

  function carregar() {
    api
      .get<Record<string, ItemCadastro[]>>(`/${recurso}`)
      .then((resposta) => setItens(resposta[plural]))
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [recurso, plural])

  async function aoCriar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await api.post(`/${recurso}`, {
        nome,
        ...(campoSecundario && secundario ? { [campoSecundario.chave]: secundario } : {}),
      })
      setNome('')
      setSecundario('')
      carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cadastrar.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    setErro(null)
    try {
      await api.delete(`/${recurso}/${id}`)
      carregar()
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível excluir.')
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="text-sm text-brand-muted">{itens.length} cadastrados</p>

      <form onSubmit={aoCriar} className="mt-6 flex max-w-lg items-end gap-3">
        <FormField rotulo={`Nome d${genero} ${singular}`} id="nome" obrigatorio>
          <input
            id="nome"
            required
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className={estiloInput}
          />
        </FormField>

        {campoSecundario && (
          <FormField rotulo={campoSecundario.rotulo} id={campoSecundario.chave}>
            <input
              id={campoSecundario.chave}
              value={secundario}
              onChange={(e) => setSecundario(e.target.value)}
              placeholder={campoSecundario.placeholder}
              className={estiloInput}
            />
          </FormField>
        )}

        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : '+ Adicionar'}
        </button>
      </form>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}

      <div className="mt-4 max-w-lg overflow-x-auto rounded-lg border border-brand-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-surface/60 text-xs uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              {campoSecundario && <th className="px-4 py-3 font-medium">{campoSecundario.rotulo}</th>}
              {podeExcluir && <th className="px-4 py-3 font-medium"></th>}
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                  Carregando...
                </td>
              </tr>
            )}

            {!carregando && itens.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                  Nenhum{genero === 'a' ? 'a' : ''} {singular} cadastrad{genero}.
                </td>
              </tr>
            )}

            {itens.map((item) => (
              <tr key={item.id} className="border-t border-brand-border">
                <td className="px-4 py-3">{item.nome}</td>
                {campoSecundario && (
                  <td className="px-4 py-3 text-brand-muted">
                    {(item[campoSecundario.chave] as string | null) ?? '—'}
                  </td>
                )}
                {podeExcluir && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => excluir(item.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  )
}
