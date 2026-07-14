-- Protege os modelos editados pela equipe da semente (ADR-50/modelos).
ALTER TABLE `ModeloDocumento` ADD COLUMN `editadoManualmente` BOOLEAN NOT NULL DEFAULT false;
