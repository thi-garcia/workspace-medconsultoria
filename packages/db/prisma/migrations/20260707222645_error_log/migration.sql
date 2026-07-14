-- CreateTable
CREATE TABLE `ErrorLog` (
    `id` VARCHAR(191) NOT NULL,
    `rota` VARCHAR(191) NULL,
    `mensagem` TEXT NOT NULL,
    `stack` TEXT NULL,
    `userId` VARCHAR(191) NULL,
    `resolvido` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ErrorLog_resolvido_createdAt_idx`(`resolvido`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
