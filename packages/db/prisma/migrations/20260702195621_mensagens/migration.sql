-- CreateTable
CREATE TABLE `Conversa` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('INDIVIDUAL', 'GRUPO', 'PROJETO', 'CLIENTE') NOT NULL,
    `nome` VARCHAR(191) NULL,
    `projetoId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Conversa_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversaParticipante` (
    `id` VARCHAR(191) NOT NULL,
    `conversaId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `ultimaLeituraEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConversaParticipante_userId_idx`(`userId`),
    UNIQUE INDEX `ConversaParticipante_conversaId_userId_key`(`conversaId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mensagem` (
    `id` VARCHAR(191) NOT NULL,
    `conversaId` VARCHAR(191) NOT NULL,
    `autorId` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Mensagem_conversaId_createdAt_idx`(`conversaId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ConversaParticipante` ADD CONSTRAINT `ConversaParticipante_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `Conversa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversaParticipante` ADD CONSTRAINT `ConversaParticipante_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mensagem` ADD CONSTRAINT `Mensagem_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `Conversa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Mensagem` ADD CONSTRAINT `Mensagem_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
