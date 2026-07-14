-- AlterTable
ALTER TABLE `Conversa` ADD COLUMN `assunto` VARCHAR(191) NULL,
    ADD COLUMN `criadoPorId` VARCHAR(191) NULL,
    ADD COLUMN `responsavelId` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('ABERTO', 'EM_ANDAMENTO', 'RESOLVIDO') NOT NULL DEFAULT 'ABERTO';

-- CreateIndex
CREATE INDEX `Conversa_clienteId_idx` ON `Conversa`(`clienteId`);

-- AddForeignKey
ALTER TABLE `Conversa` ADD CONSTRAINT `Conversa_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversa` ADD CONSTRAINT `Conversa_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversa` ADD CONSTRAINT `Conversa_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

