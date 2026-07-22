import { HandHeart, Briefcase, FileSignature, MessageSquare, ShieldCheck } from "lucide-react";
import { GuiaModal, type Passo } from "../../components/GuiaTour";

/**
 * Guia "?" do PORTAL DO CLIENTE. O Portal é uma página só, e antes não tinha guia nenhum —
 * justamente a tela de quem mais precisa de orientação (o cliente, que entra de vez em quando).
 * Reusa o visual do GuiaModal da equipe.
 */
const PASSOS_PORTAL: Passo[] = [
  {
    icon: HandHeart,
    logo: true,
    titulo: "Bem-vindo ao seu Portal",
    descricao:
      "Aqui você acompanha tudo do seu atendimento com a MedConsultoria — serviços, documentos, reuniões e suporte — num só lugar, com segurança.",
  },
  {
    icon: Briefcase,
    titulo: "Seus serviços",
    descricao:
      "Veja os serviços contratados e o que ainda falta você enviar. Precisa de algo novo? Escolha em “O que você precisa?” que a equipe prepara para você.",
  },
  {
    icon: FileSignature,
    titulo: "Documentos e assinatura",
    descricao:
      "Propostas e contratos aparecem aqui. Quando pedirem sua assinatura, é só clicar, revisar e assinar pela tela — com validade jurídica. Você também baixa os documentos quando quiser.",
  },
  {
    icon: MessageSquare,
    titulo: "Suporte",
    descricao:
      "Precisa falar com a equipe? Abra um chamado no suporte — você acompanha a resposta por aqui e recebe aviso quando responderem.",
  },
  {
    icon: ShieldCheck,
    titulo: "Seus dados, protegidos",
    descricao:
      "Você só vê o que é seu. Pode conferir e corrigir seus dados cadastrais no menu do seu nome, no topo — tudo conforme a LGPD.",
  },
];

export function GuiaPortal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <GuiaModal open={open} onClose={onClose} titulo="Portal do Cliente" passos={PASSOS_PORTAL} />;
}
