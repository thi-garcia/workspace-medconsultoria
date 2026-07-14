-- Reagrupa ErrorLog por fingerprint (modelo de "issue" estilo Sentry).
-- Telemetria descartável: limpamos as linhas antigas (sem fingerprint) antes de exigir a coluna.
DELETE FROM `ErrorLog`;

ALTER TABLE `ErrorLog`
  ADD COLUMN `fingerprint` VARCHAR(191) NOT NULL,
  ADD COLUMN `ocorrencias` INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN `resolvidoEm` DATETIME(3) NULL,
  ADD COLUMN `regrediu` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `ultimaVez` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

DROP INDEX `ErrorLog_resolvido_createdAt_idx` ON `ErrorLog`;

CREATE UNIQUE INDEX `ErrorLog_fingerprint_key` ON `ErrorLog`(`fingerprint`);

CREATE INDEX `ErrorLog_resolvido_ultimaVez_idx` ON `ErrorLog`(`resolvido`, `ultimaVez`);
