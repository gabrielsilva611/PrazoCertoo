import { FormField, estiloInput } from './FormField'

interface ClienteFormCamposProps {
  nome: string
  onNomeChange: (valor: string) => void
  telefone: string
  onTelefoneChange: (valor: string) => void
  email: string
  onEmailChange: (valor: string) => void
  cpf: string
  onCpfChange: (valor: string) => void
  observacoes: string
  onObservacoesChange: (valor: string) => void
}

export function ClienteFormCampos({
  nome,
  onNomeChange,
  telefone,
  onTelefoneChange,
  email,
  onEmailChange,
  cpf,
  onCpfChange,
  observacoes,
  onObservacoesChange,
}: ClienteFormCamposProps) {
  return (
    <>
      <FormField rotulo="Nome completo" id="nome" obrigatorio>
        <input
          id="nome"
          required
          value={nome}
          onChange={(e) => onNomeChange(e.target.value)}
          className={estiloInput}
        />
      </FormField>

      <FormField rotulo="Telefone / WhatsApp" id="telefone" obrigatorio>
        <input
          id="telefone"
          required
          value={telefone}
          onChange={(e) => onTelefoneChange(e.target.value)}
          placeholder="(47) 99999-9999"
          className={estiloInput}
        />
      </FormField>

      <FormField rotulo="E-mail" id="email">
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          className={estiloInput}
        />
      </FormField>

      <FormField rotulo="CPF" id="cpf">
        <input id="cpf" value={cpf} onChange={(e) => onCpfChange(e.target.value)} className={estiloInput} />
      </FormField>

      <FormField rotulo="Observações internas" id="observacoes">
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          rows={3}
          className={estiloInput}
        />
      </FormField>
    </>
  )
}
