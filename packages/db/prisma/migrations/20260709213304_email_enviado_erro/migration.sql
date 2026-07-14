-- AlterTable
ALTER TABLE `EmailEnviado` ADD COLUMN `erro` TEXT NULL;

-- CreateIndex
CREATE INDEX `EmailEnviado_status_createdAt_idx` ON `EmailEnviado`(`status`, `createdAt`);
