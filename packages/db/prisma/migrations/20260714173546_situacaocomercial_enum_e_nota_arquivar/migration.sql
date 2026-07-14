-- Decisao #1: situacaoComercial vira ENUM (estrutura controlada).
-- GUARDA: em MySQL 8 (sql_mode STRICT), converter uma coluna para ENUM FALHA com erro
-- ("Data truncated for column 'situacaoComercial'") se existir qualquer valor fora do conjunto
-- abaixo. Ou seja, esta migration ABORTA de forma clara diante de valor desconhecido, preservando
-- os dados (nao coage silenciosamente). Valores existentes mapeados: PROSPECT/NEGOCIACAO/ATIVO.
-- AlterTable
ALTER TABLE `Cliente` MODIFY `situacaoComercial` ENUM('PROSPECT', 'NEGOCIACAO', 'ATIVO', 'INATIVO', 'PERDIDO') NOT NULL DEFAULT 'ATIVO';

-- Decisao #2: Nota vira historico IMUTAVEL com arquivamento reversivel (nao apaga/edita o conteudo).
-- AlterTable
ALTER TABLE `Nota` ADD COLUMN `arquivadaEm` DATETIME(3) NULL,
    ADD COLUMN `arquivadaPorId` VARCHAR(191) NULL;
