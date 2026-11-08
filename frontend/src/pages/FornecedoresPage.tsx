import { CadastroSimplesPage } from '../components/CadastroSimplesPage'

export function FornecedoresPage() {
  return (
    <CadastroSimplesPage
      recurso="fornecedores"
      plural="fornecedores"
      titulo="Fornecedores"
      singular="fornecedor"
      genero="o"
      campoSecundario={{ chave: 'contato', rotulo: 'Contato', placeholder: 'Telefone ou e-mail' }}
    />
  )
}
