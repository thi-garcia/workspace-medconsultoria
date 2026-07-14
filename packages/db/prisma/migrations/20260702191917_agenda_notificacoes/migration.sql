-- CreateTable
CREATE TABLE `Evento` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` ENUM('COMPROMISSO', 'RETORNO', 'REUNIAO', 'LEMBRETE', 'PESSOAL') NOT NULL DEFAULT 'COMPROMISSO',
    `escopo` ENUM('PESSOAL', 'EMPRESA') NOT NULL DEFAULT 'EMPRESA',
    `inicio` DATETIME(3) NOT NULL,
    `fim` DATETIME(3) NULL,
    `diaInteiro` BOOLEAN NOT NULL DEFAULT false,
    `local` VARCHAR(191) NULL,
    `linkReuniao` VARCHAR(191) NULL,
    `recorrencia` ENUM('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL') NOT NULL DEFAULT 'NENHUMA',
    `recorrenciaAte` DATETIME(3) NULL,
    `donoId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NULL,
    `projetoId` VARCHAR(191) NULL,
    `lembreteEnviado` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Evento_donoId_idx`(`donoId`),
    INDEX `Evento_inicio_idx`(`inicio`),
    INDEX `Evento_clienteId_idx`(`clienteId`),
    INDEX `Evento_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacao` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `corpo` VARCHAR(191) NULL,
    `entidadeTipo` VARCHAR(191) NULL,
    `entidadeId` VARCHAR(191) NULL,
    `lida` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notificacao_userId_lida_idx`(`userId`, `lida`),
    INDEX `Notificacao_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_donoId_fkey` FOREIGN KEY (`donoId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Evento` ADD CONSTRAINT `Evento_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `Projeto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacao` ADD CONSTRAINT `Notificacao_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
