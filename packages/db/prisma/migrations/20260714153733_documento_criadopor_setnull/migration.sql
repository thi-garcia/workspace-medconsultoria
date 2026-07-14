-- Documento.criadoPorId: obrigatório+Cascade → opcional+SetNull.
-- Excluir o usuário criador PRESERVA o documento (propostas/contratos não somem com o funcionário). Ver #1.
-- DropForeignKey
ALTER TABLE `Documento` DROP FOREIGN KEY `Documento_criadoPorId_fkey`;
-- DropIndex
DROP INDEX `Documento_criadoPorId_fkey` ON `Documento`;
-- AlterTable
ALTER TABLE `Documento` MODIFY `criadoPorId` VARCHAR(191) NULL;
-- AddForeignKey
ALTER TABLE `Documento` ADD CONSTRAINT `Documento_criadoPorId_fkey` FOREIGN KEY (`criadoPorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
