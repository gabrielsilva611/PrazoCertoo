import { CadastroSimplesPage } from '../components/CadastroSimplesPage'

export function CategoriasPage() {
  return (
    <CadastroSimplesPage
      recurso="categorias"
      plural="categorias"
      titulo="Categorias"
      singular="categoria"
      genero="a"
      campoSecundario={{ chave: 'descricao', rotulo: 'Descrição', placeholder: 'Opcional' }}
    />
  )
}
