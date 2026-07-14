-- AlterTable
ALTER TABLE `Lead` ADD COLUMN `clienteId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Lead_clienteId_idx` ON `Lead`(`clienteId`);

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
