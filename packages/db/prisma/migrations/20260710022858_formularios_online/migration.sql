-- AlterTable
ALTER TABLE `ServicoRequisito` ADD COLUMN `formularioId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Formulario` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormularioCampo` (
    `id` VARCHAR(191) NOT NULL,
    `formularioId` VARCHAR(191) NOT NULL,
    `rotulo` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'TEXTO_CURTO',
    `obrigatorio` BOOLEAN NOT NULL DEFAULT false,
    `opcoes` TEXT NULL,
    `ajuda` VARCHAR(191) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,

    INDEX `FormularioCampo_formularioId_idx`(`formularioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FormularioResposta` (
    `id` VARCHAR(191) NOT NULL,
    `formularioId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `requisitoId` VARCHAR(191) NULL,
    `servicoId` VARCHAR(191) NULL,
    `respostas` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'RASCUNHO',
    `enviadoEm` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FormularioResposta_clienteId_idx`(`clienteId`),
    INDEX `FormularioResposta_formularioId_idx`(`formularioId`),
    INDEX `FormularioResposta_requisitoId_idx`(`requisitoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServicoRequisito` ADD CONSTRAINT `ServicoRequisito_formularioId_fkey` FOREIGN KEY (`formularioId`) REFERENCES `Formulario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormularioCampo` ADD CONSTRAINT `FormularioCampo_formularioId_fkey` FOREIGN KEY (`formularioId`) REFERENCES `Formulario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormularioResposta` ADD CONSTRAINT `FormularioResposta_formularioId_fkey` FOREIGN KEY (`formularioId`) REFERENCES `Formulario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormularioResposta` ADD CONSTRAINT `FormularioResposta_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FormularioResposta` ADD CONSTRAINT `FormularioResposta_requisitoId_fkey` FOREIGN KEY (`requisitoId`) REFERENCES `ServicoRequisito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
