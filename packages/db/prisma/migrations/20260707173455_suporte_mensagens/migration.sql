-- CreateTable
CREATE TABLE `SuporteMensagem` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `autorId` VARCHAR(191) NOT NULL,
    `corpo` TEXT NOT NULL,
    `daEquipe` BOOLEAN NOT NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SuporteMensagem_clienteId_createdAt_idx`(`clienteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SuporteMensagem` ADD CONSTRAINT `SuporteMensagem_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SuporteMensagem` ADD CONSTRAINT `SuporteMensagem_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
