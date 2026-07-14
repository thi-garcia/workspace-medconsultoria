-- CreateTable
CREATE TABLE `PipelineStage` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ordem` INTEGER NOT NULL,
    `cor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PipelineStage_ordem_idx`(`ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lead` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `telefone` VARCHAR(191) NULL,
    `origem` VARCHAR(191) NULL,
    `valorEstimado` DOUBLE NULL,
    `observacoes` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `pipelineStageId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NULL,
    `convertidoEmClienteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Lead_pipelineStageId_ordem_idx`(`pipelineStageId`, `ordem`),
    INDEX `Lead_responsavelId_idx`(`responsavelId`),
    INDEX `Lead_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_pipelineStageId_fkey` FOREIGN KEY (`pipelineStageId`) REFERENCES `PipelineStage`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lead` ADD CONSTRAINT `Lead_convertidoEmClienteId_fkey` FOREIGN KEY (`convertidoEmClienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
