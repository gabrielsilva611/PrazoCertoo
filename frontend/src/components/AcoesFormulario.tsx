interface AcoesFormularioProps {
  rotuloSalvar: string
  rotuloSalvando: string
  salvando: boolean
  onCancelar: () => void
}

export function AcoesFormulario({ rotuloSalvar, rotuloSalvando, salvando, onCancelar }: AcoesFormularioProps) {
  return (
    <div className="flex gap-3">
      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-brand-accent px-4 py-2 font-medium text-brand-accent-foreground transition hover:bg-brand-accent-hover disabled:opacity-60"
      >
        {salvando ? rotuloSalvando : rotuloSalvar}
      </button>
      <button
        type="button"
        onClick={onCancelar}
        className="rounded-lg border border-brand-border px-4 py-2 text-brand-text transition hover:border-brand-accent"
      >
        Cancelar
      </button>
    </div>
  )
}
