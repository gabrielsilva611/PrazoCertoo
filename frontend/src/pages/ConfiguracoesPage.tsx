import { useState, type FormEvent } from 'react'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { useAuth } from '../AuthContext'
import { api, ApiError } from '../lib/api'

export function ConfiguracoesPage() {
  const { usuario, atualizarCorDestaque } = useAuth()
  const [corDestaque, setCorDestaque] = useState(usuario?.corDestaque ?? '#22c55e')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setSucesso(false)
    setSalvando(true)
    try {
      const resposta = await api.put<{ corDestaque: string }>('/configuracoes', { corDestaque })
      atualizarCorDestaque(resposta.corDestaque)
      setSucesso(true)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar a cor.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold">Configurações</h1>
      <p className="text-sm text-brand-muted">Personalize a aparência do sistema pro seu negócio</p>

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-sm flex-col gap-4">
        <FormField rotulo="Cor de destaque" id="corDestaque" obrigatorio>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="corDestaque"
              type="color"
              value={corDestaque}
              onChange={(e) => setCorDestaque(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-md border border-brand-border bg-brand-surface"
            />
            <input
              value={corDestaque}
              onChange={(e) => setCorDestaque(e.target.value)}
              pattern="#[0-9a-fA-F]{6}"
              placeholder="#22c55e"
              className={estiloInput}
            />
          </div>
        </FormField>

        <p className="text-xs text-brand-muted">
          Usada nos botões, destaques e indicadores em todo o sistema.
        </p>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm text-brand-accent">Cor atualizada com sucesso.</p>}

        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-brand-accent px-4 py-2 font-medium text-brand-bg hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </AppLayout>
  )
}
