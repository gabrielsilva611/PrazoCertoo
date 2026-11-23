-- Adiciona a coluna como opcional primeiro, porque a tabela já tem linhas
-- (não dá pra criar uma coluna obrigatória sem valor pras linhas existentes).
ALTER TABLE "parcelas" ADD COLUMN "saldo_devedor" DECIMAL(10,2);

-- Preenche as linhas que já existem: parcela já paga fica com saldo 0,
-- parcela em aberto recebe o valor integral dela (o abatimento parcial
-- passa a valer só a partir de agora, pra pagamentos futuros).
UPDATE "parcelas" SET "saldo_devedor" = CASE WHEN "pago_em" IS NOT NULL THEN 0 ELSE "valor" END;

-- Agora que toda linha tem valor, pode tornar obrigatória.
ALTER TABLE "parcelas" ALTER COLUMN "saldo_devedor" SET NOT NULL;
