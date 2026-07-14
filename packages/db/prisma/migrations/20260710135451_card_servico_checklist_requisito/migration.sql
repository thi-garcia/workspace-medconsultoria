-- Liga o card ao serviço e o item de checklist a uma exigência do cliente,
-- para a automação (entregas do cliente marcam-se sozinhas + status automático).
ALTER TABLE `Card` ADD COLUMN `servicoId` VARCHAR(191) NULL;
ALTER TABLE `ChecklistItem` ADD COLUMN `requisitoId` VARCHAR(191) NULL;
CREATE INDEX `Card_servicoId_idx` ON `Card`(`servicoId`);
CREATE INDEX `ChecklistItem_requisitoId_idx` ON `ChecklistItem`(`requisitoId`);
ALTER TABLE `Card` ADD CONSTRAINT `Card_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ChecklistItem` ADD CONSTRAINT `ChecklistItem_requisitoId_fkey` FOREIGN KEY (`requisitoId`) REFERENCES `ServicoRequisito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
