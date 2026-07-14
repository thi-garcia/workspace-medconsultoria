-- AlterTable
ALTER TABLE `Servico` ADD COLUMN `percentual` DOUBLE NULL,
    ADD COLUMN `percentualRecorrencia` ENUM('AVULSO', 'MENSAL') NOT NULL DEFAULT 'MENSAL',
    ADD COLUMN `valorRecorrencia` ENUM('AVULSO', 'MENSAL') NOT NULL DEFAULT 'AVULSO';
