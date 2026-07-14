-- Kanban de projeto: fluxo em etapas mais claro.
-- INBOX foi unificado em A_FAZER (dados já migrados) e AGUARDANDO_OPERADORA
-- virou AGUARDANDO_TERCEIROS (sem dados a migrar).
ALTER TABLE `Card` MODIFY `status` ENUM('A_FAZER', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'AGUARDANDO_TERCEIROS', 'CONCLUIDO') NOT NULL DEFAULT 'A_FAZER';
