-- AlterTable
ALTER TABLE `Evento` ADD COLUMN `clienteConfirmadoEm` DATETIME(3) NULL,
    ADD COLUMN `lembreteClienteEnviado` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `EventoParticipante` (
    `id` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    INDEX `EventoParticipante_userId_idx`(`userId`),
    UNIQUE INDEX `EventoParticipante_eventoId_userId_key`(`eventoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventoParticipante` ADD CONSTRAINT `EventoParticipante_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `Evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventoParticipante` ADD CONSTRAINT `EventoParticipante_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

