-- AlterTable
ALTER TABLE `Conversa` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `numero` INTEGER NULL,
    ADD COLUMN `prioridade` ENUM('BAIXA', 'NORMAL', 'ALTA') NOT NULL DEFAULT 'NORMAL',
    ADD COLUMN `resolvidoEm` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ConversaParticipante` ADD COLUMN `arquivadoEm` DATETIME(3) NULL,
    ADD COLUMN `fixadoEm` DATETIME(3) NULL,
    ADD COLUMN `ocultoEm` DATETIME(3) NULL,
    ADD COLUMN `silenciadoEm` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Mensagem` ADD COLUMN `editadoEm` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `Conversa_numero_idx` ON `Conversa`(`numero`);

