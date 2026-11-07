-- RF28, RN13: no máximo um inventário ABERTO por negócio, garantido no
-- banco (índice único parcial) em vez de só na aplicação, pra não deixar
-- uma corrida entre duas requisições simultâneas criar dois rascunhos.
CREATE UNIQUE INDEX "inventarios_aberto_unico_por_negocio"
  ON "inventarios" ("negocio_id")
  WHERE "status" = 'ABERTO';
