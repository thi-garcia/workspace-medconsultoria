-- AlterTable
ALTER TABLE `Categoria` ADD COLUMN `donoId` VARCHAR(191) NULL,
    ADD COLUMN `escopo` ENUM('EMPRESA', 'PESSOAL') NOT NULL DEFAULT 'EMPRESA';

-- AlterTable
ALTER TABLE `Conta` ADD COLUMN `donoId` VARCHAR(191) NULL,
    ADD COLUMN `escopo` ENUM('EMPRESA', 'PESSOAL') NOT NULL DEFAULT 'EMPRESA',
    ADD COLUMN `recorrenciaAte` DATETIME(3) NULL,
    ADD COLUMN `recorrenteId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `Categoria_escopo_donoId_tipo_idx` ON `Categoria`(`escopo`, `donoId`, `tipo`);

-- CreateIndex
CREATE INDEX `Conta_escopo_donoId_idx` ON `Conta`(`escopo`, `donoId`);

-- CreateIndex
CREATE INDEX `Conta_recorrenteId_idx` ON `Conta`(`recorrenteId`);

-- AddForeignKey
ALTER TABLE `Categoria` ADD CONSTRAINT `Categoria_donoId_fkey` FOREIGN KEY (`donoId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conta` ADD CONSTRAINT `Conta_donoId_fkey` FOREIGN KEY (`donoId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
