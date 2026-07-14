-- CreateTable
CREATE TABLE `Servico` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Servico_ordem_idx`(`ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_LeadServicos` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_LeadServicos_AB_unique`(`A`, `B`),
    INDEX `_LeadServicos_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_LeadServicos` ADD CONSTRAINT `_LeadServicos_A_fkey` FOREIGN KEY (`A`) REFERENCES `Lead`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_LeadServicos` ADD CONSTRAINT `_LeadServicos_B_fkey` FOREIGN KEY (`B`) REFERENCES `Servico`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
