-- CreateTable
CREATE TABLE `ProjetoParticipante` (
    `id` VARCHAR(191) NOT NULL,
    `projetoId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjetoParticipante_userId_idx`(`userId`),
    UNIQUE INDEX `ProjetoParticipante_projetoId_userId_key`(`projetoId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjetoParticipante` ADD CONSTRAINT `ProjetoParticipante_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `Projeto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjetoParticipante` ADD CONSTRAINT `ProjetoParticipante_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
