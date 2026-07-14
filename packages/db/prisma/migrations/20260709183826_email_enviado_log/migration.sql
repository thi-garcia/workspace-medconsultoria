-- CreateTable
CREATE TABLE `EmailEnviado` (
    `id` VARCHAR(191) NOT NULL,
    `para` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `template` VARCHAR(191) NULL,
    `corpo` TEXT NOT NULL,
    `status` ENUM('ENVIADO', 'FALHOU') NOT NULL DEFAULT 'ENVIADO',
    `userId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `leadId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmailEnviado_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `EmailEnviado_clienteId_createdAt_idx`(`clienteId`, `createdAt`),
    INDEX `EmailEnviado_leadId_createdAt_idx`(`leadId`, `createdAt`),
    INDEX `EmailEnviado_para_idx`(`para`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
