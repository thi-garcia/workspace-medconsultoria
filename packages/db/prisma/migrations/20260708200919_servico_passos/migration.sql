-- AlterTable
ALTER TABLE `LeadPasso` ADD COLUMN `servicoId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `ServicoPasso` (
    `id` VARCHAR(191) NOT NULL,
    `servicoId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `etapaChave` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServicoPasso_servicoId_etapaChave_idx`(`servicoId`, `etapaChave`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServicoPasso` ADD CONSTRAINT `ServicoPasso_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
