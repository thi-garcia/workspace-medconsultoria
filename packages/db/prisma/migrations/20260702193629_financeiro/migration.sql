-- CreateTable
CREATE TABLE `Categoria` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `tipo` ENUM('RECEITA', 'DESPESA') NOT NULL,
    `cor` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Categoria_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conta` (
    `id` VARCHAR(191) NOT NULL,
    `tipo` ENUM('PAGAR', 'RECEBER') NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `vencimento` DATETIME(3) NOT NULL,
    `pago` BOOLEAN NOT NULL DEFAULT false,
    `pagoEm` DATETIME(3) NULL,
    `categoriaId` VARCHAR(191) NULL,
    `clienteId` VARCHAR(191) NULL,
    `recorrencia` ENUM('NENHUMA', 'DIARIA', 'SEMANAL', 'MENSAL') NOT NULL DEFAULT 'NENHUMA',
    `observacoes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Conta_tipo_pago_idx`(`tipo`, `pago`),
    INDEX `Conta_vencimento_idx`(`vencimento`),
    INDEX `Conta_clienteId_idx`(`clienteId`),
    INDEX `Conta_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Conta` ADD CONSTRAINT `Conta_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conta` ADD CONSTRAINT `Conta_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
