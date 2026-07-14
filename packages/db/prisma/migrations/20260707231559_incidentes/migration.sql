-- AlterTable
ALTER TABLE `ErrorLog` ADD COLUMN `ignorado` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Incidente` (
    `id` VARCHAR(191) NOT NULL,
    `regra` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `severidade` VARCHAR(191) NOT NULL,
    `componente` VARCHAR(191) NOT NULL,
    `detalhe` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ABERTO',
    `valorPico` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reconhecidoEm` DATETIME(3) NULL,
    `resolvidoEm` DATETIME(3) NULL,

    INDEX `Incidente_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
