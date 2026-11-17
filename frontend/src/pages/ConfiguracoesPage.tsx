import { useState, type FormEvent } from 'react'
import { AppLayout } from '../components/AppLayout'
import { FormField, estiloInput } from '../components/FormField'
import { useAuth } from '../AuthContext'
import { api, ApiError } from '../lib/api'
import { corTextoLegivel } from '../lib/cor'

const HEX_VALIDO = /^#[0-9a-fA-F]{6}$/

export function ConfiguracoesPage() {
  const { usuario, atualizarCorDestaque } = useAuth()
  const [corDestaque, setCorDestaque] = useState(usuario?.corDestaque ?? '#22c55e')
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const corValida = HEX_VALIDO.test(corDestaque)
  const corPreview = corValida ? corDestaque : (usuario?.corDestaque ?? '#7c3aed')
  const textoPreview = corTextoLegivel(corPreview)

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
      <h1 className="text-2xl font-bold tracking-tight text-brand-text">Configurações</h1>
      <p className="text-sm text-brand-muted">Personalize a aparência do sistema pro seu negócio</p>

      <form onSubmit={aoSubmeter} className="mt-6 flex max-w-sm flex-col gap-4">
        <FormField rotulo="Cor de destaque" id="corDestaque" obrigatorio>
          <div className="mt-1 flex items-center gap-3">
            <input
              id="corDestaque"
              type="color"
              value={corDestaque}
              onChange={(e) => setCorDestaque(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-brand-border bg-brand-surface"
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

        <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Prévia</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              tabIndex={-1}
              style={{ backgroundColor: corPreview, color: textoPreview }}
              className="rounded-lg px-4 py-2 text-sm font-medium"
            >
              Botão de exemplo
            </button>
            <span
              style={{ backgroundColor: `${corPreview}1a`, color: corPreview }}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              Rótulo de exemplo
            </span>
          </div>
          {!corValida && (
            <p className="mt-2 text-xs text-amber-400">
              Esse valor ainda não é um hex válido (ex: #7c3aed) — mostrando a cor atual.
            </p>
          )}
        </div>

        {erro && <p className="text-sm text-red-400">{erro}</p>}
        {sucesso && <p className="text-sm text-brand-accent">Cor atualizada com sucesso.</p>}

        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-brand-accent px-4 py-2 font-medium text-brand-accent-foreground hover:bg-brand-accent-hover disabled:opacity-60"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </AppLayout>
  )
}
