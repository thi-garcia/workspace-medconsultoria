-- CreateTable
CREATE TABLE `ModeloDocumento` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PROPOSTA', 'CONTRATO', 'BRIEFING', 'ESCOPO', 'ONBOARDING', 'CHECKLIST', 'ATA', 'RELATORIO') NOT NULL,
    `corpo` TEXT NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Documento` (
    `id` VARCHAR(191) NOT NULL,
    `modeloId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `projetoId` VARCHAR(191) NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `status` ENUM('RASCUNHO', 'EM_REVISAO', 'APROVADO', 'ENVIADO') NOT NULL DEFAULT 'RASCUNHO',
    `criadoPorId` VARCHAR(191) NOT NULL,
    `aprovadoPorId` VARCHAR(191) NULL,
    `enviadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Documento_status_idx`(`status`),
    INDEX `Documento_clienteId_idx`(`clienteId`),
    INDEX `Documento_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DocumentoVersao` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `autorId` VARCHAR(191) NULL,
    `origem` ENUM('MANUAL', 'IA') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DocumentoVersao_documentoId_idx`(`documentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_modeloId_fkey` FOREIGN KEY (`modeloId`) REFERENCES `ModeloDocumento`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `Projeto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_aprovadoPorId_fkey` FOREIGN KEY (`aprovadoPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoVersao` ADD CONSTRAINT `DocumentoVersao_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `Documento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DocumentoVersao` ADD CONSTRAINT `DocumentoVersao_autorId_fkey` FOREIGN KEY (`autorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
