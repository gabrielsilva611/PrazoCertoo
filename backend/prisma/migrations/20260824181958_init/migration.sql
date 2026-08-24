-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('DONO', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "TipoMovimentacao" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO');

-- CreateEnum
CREATE TYPE "StatusInventario" AS ENUM ('ABERTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" "Perfil" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150),
    "cpf" VARCHAR(14),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "produto_id" UUID,
    "descricao" VARCHAR(255),
    "observacoes" TEXT,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "num_parcelas" INTEGER NOT NULL,
    "data_inicio" DATE NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcelas" (
    "id" UUID NOT NULL,
    "venda_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" DATE NOT NULL,
    "pago_em" TIMESTAMP(3),

    CONSTRAINT "parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_cobrancas" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "parcela_id" UUID,
    "mensagem" TEXT NOT NULL,
    "canal" VARCHAR(30) NOT NULL,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_cobrancas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "contato" VARCHAR(100),

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "categoria_id" UUID,
    "nome" VARCHAR(150) NOT NULL,
    "unidade" VARCHAR(20) NOT NULL,
    "preco_custo" DECIMAL(10,2) NOT NULL,
    "preco_venda" DECIMAL(10,2) NOT NULL,
    "saldo_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "fornecedor_id" UUID,
    "tipo" "TipoMovimentacao" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "saldo_anterior" INTEGER NOT NULL,
    "saldo_posterior" INTEGER NOT NULL,
    "motivo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios" (
    "id" UUID NOT NULL,
    "negocio_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "status" "StatusInventario" NOT NULL DEFAULT 'ABERTO',
    "iniciado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluido_em" TIMESTAMP(3),

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_itens" (
    "id" UUID NOT NULL,
    "inventario_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "saldo_sistema" INTEGER NOT NULL,
    "saldo_fisico" INTEGER NOT NULL,
    "diferenca" INTEGER NOT NULL,
    "justificativa" TEXT,

    CONSTRAINT "inventario_itens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_negocio_id_idx" ON "usuarios"("negocio_id");

-- CreateIndex
CREATE INDEX "clientes_negocio_id_idx" ON "clientes"("negocio_id");

-- CreateIndex
CREATE INDEX "vendas_negocio_id_idx" ON "vendas"("negocio_id");

-- CreateIndex
CREATE INDEX "vendas_cliente_id_idx" ON "vendas"("cliente_id");

-- CreateIndex
CREATE INDEX "parcelas_venda_id_idx" ON "parcelas"("venda_id");

-- CreateIndex
CREATE INDEX "parcelas_vencimento_idx" ON "parcelas"("vencimento");

-- CreateIndex
CREATE INDEX "historico_cobrancas_cliente_id_idx" ON "historico_cobrancas"("cliente_id");

-- CreateIndex
CREATE INDEX "categorias_negocio_id_idx" ON "categorias"("negocio_id");

-- CreateIndex
CREATE INDEX "fornecedores_negocio_id_idx" ON "fornecedores"("negocio_id");

-- CreateIndex
CREATE INDEX "produtos_negocio_id_idx" ON "produtos"("negocio_id");

-- CreateIndex
CREATE INDEX "produtos_categoria_id_idx" ON "produtos"("categoria_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_produto_id_idx" ON "movimentacoes_estoque"("produto_id");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_criado_em_idx" ON "movimentacoes_estoque"("criado_em");

-- CreateIndex
CREATE INDEX "inventarios_negocio_id_idx" ON "inventarios"("negocio_id");

-- CreateIndex
CREATE INDEX "inventario_itens_inventario_id_idx" ON "inventario_itens"("inventario_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcelas" ADD CONSTRAINT "parcelas_venda_id_fkey" FOREIGN KEY ("venda_id") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cobrancas" ADD CONSTRAINT "historico_cobrancas_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cobrancas" ADD CONSTRAINT "historico_cobrancas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_cobrancas" ADD CONSTRAINT "historico_cobrancas_parcela_id_fkey" FOREIGN KEY ("parcela_id") REFERENCES "parcelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fornecedores" ADD CONSTRAINT "fornecedores_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
