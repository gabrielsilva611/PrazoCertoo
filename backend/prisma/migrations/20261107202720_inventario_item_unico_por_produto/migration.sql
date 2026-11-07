-- CreateIndex
CREATE UNIQUE INDEX "inventario_itens_inventario_id_produto_id_key" ON "inventario_itens"("inventario_id", "produto_id");
