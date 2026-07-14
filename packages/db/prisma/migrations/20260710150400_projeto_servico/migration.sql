-- AlterTable
ALTER TABLE `Projeto` ADD COLUMN `servicoId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Projeto_servicoId_idx` ON `Projeto`(`servicoId`);

-- AddForeignKey
ALTER TABLE `Projeto` ADD CONSTRAINT `Projeto_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

