-- AlterTable
ALTER TABLE `Documento` ADD COLUMN `assinadoEm` DATETIME(3) NULL,
    ADD COLUMN `assinaturaSolicitadaEm` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Assinatura` (
    `id` VARCHAR(191) NOT NULL,
    `documentoId` VARCHAR(191) NOT NULL,
    `papel` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `token` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDENTE',
    `metodo` VARCHAR(191) NULL,
    `imagem` TEXT NULL,
    `nomeDigitado` VARCHAR(191) NULL,
    `hashDocumento` VARCHAR(191) NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `assinadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Assinatura_token_key`(`token`),
    INDEX `Assinatura_documentoId_idx`(`documentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Assinatura` ADD CONSTRAINT `Assinatura_documentoId_fkey` FOREIGN KEY (`documentoId`) REFERENCES `Documento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
