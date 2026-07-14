-- Aceite online da PROPOSTA (Fase C — ADR-47): link público por token + trilha de auditoria.
ALTER TABLE `Documento`
  ADD COLUMN `propostaToken` VARCHAR(191) NULL,
  ADD COLUMN `propostaStatus` VARCHAR(191) NULL,
  ADD COLUMN `propostaHash` VARCHAR(191) NULL,
  ADD COLUMN `propostaSolicitadaEm` DATETIME(3) NULL,
  ADD COLUMN `propostaRespondidaEm` DATETIME(3) NULL,
  ADD COLUMN `propostaRespIp` VARCHAR(191) NULL,
  ADD COLUMN `propostaMotivoRecusa` TEXT NULL;

CREATE UNIQUE INDEX `Documento_propostaToken_key` ON `Documento`(`propostaToken`);
