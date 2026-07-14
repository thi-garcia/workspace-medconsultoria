-- CreateTable
CREATE TABLE `PreferenciaEmail` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,

    INDEX `PreferenciaEmail_userId_idx`(`userId`),
    UNIQUE INDEX `PreferenciaEmail_userId_tipo_key`(`userId`, `tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PreferenciaEmail` ADD CONSTRAINT `PreferenciaEmail_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
