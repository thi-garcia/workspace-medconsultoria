-- CreateTable
CREATE TABLE `ClienteServico` (
    `id` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `servicoId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'ATIVO',
    `origem` VARCHAR(191) NOT NULL DEFAULT 'MANUAL',
    `valor` DOUBLE NULL,
    `observacao` TEXT NULL,
    `contratadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `canceladoEm` DATETIME(3) NULL,
    `canceladoPorTipo` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ClienteServico_clienteId_idx`(`clienteId`),
    INDEX `ClienteServico_servicoId_idx`(`servicoId`),
    UNIQUE INDEX `ClienteServico_clienteId_servicoId_key`(`clienteId`, `servicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServicoRequisito` (
    `id` VARCHAR(191) NOT NULL,
    `servicoId` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `tipo` VARCHAR(191) NOT NULL DEFAULT 'DOCUMENTO',
    `obrigatorio` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ServicoRequisito_servicoId_idx`(`servicoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Arquivo` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `mimetype` VARCHAR(191) NOT NULL,
    `tamanho` INTEGER NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `servicoId` VARCHAR(191) NULL,
    `requisitoId` VARCHAR(191) NULL,
    `enviadoPorTipo` VARCHAR(191) NOT NULL,
    `enviadoPorId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,

    INDEX `Arquivo_clienteId_idx`(`clienteId`),
    INDEX `Arquivo_servicoId_idx`(`servicoId`),
    INDEX `Arquivo_requisitoId_idx`(`requisitoId`),
    INDEX `Arquivo_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClienteServico` ADD CONSTRAINT `ClienteServico_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClienteServico` ADD CONSTRAINT `ClienteServico_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServicoRequisito` ADD CONSTRAINT `ServicoRequisito_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arquivo` ADD CONSTRAINT `Arquivo_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Cliente`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arquivo` ADD CONSTRAINT `Arquivo_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arquivo` ADD CONSTRAINT `Arquivo_requisitoId_fkey` FOREIGN KEY (`requisitoId`) REFERENCES `ServicoRequisito`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
