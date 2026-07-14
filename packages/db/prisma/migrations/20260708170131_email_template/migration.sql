-- CreateTable
CREATE TABLE `EmailTemplate` (
    `chave` VARCHAR(191) NOT NULL,
    `assunto` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `corpo` TEXT NOT NULL,
    `ctaTexto` VARCHAR(191) NULL,
    `nota` TEXT NULL,
    `atualizadoPor` VARCHAR(191) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`chave`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
