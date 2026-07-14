-- CreateTable
CREATE TABLE `LeadPasso` (
    `id` VARCHAR(191) NOT NULL,
    `leadId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `concluido` BOOLEAN NOT NULL DEFAULT false,
    `concluidoEm` DATETIME(3) NULL,
    `concluidoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeadPasso_leadId_stageId_idx`(`leadId`, `stageId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeadPasso` ADD CONSTRAINT `LeadPasso_leadId_fkey` FOREIGN KEY (`leadId`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
