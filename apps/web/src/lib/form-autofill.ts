import type { FormEvent } from "react";
import type { FieldValues, Path, UseFormSetValue } from "react-hook-form";

/**
 * Reconcilia o que está NA TELA com o que o react-hook-form tem guardado.
 *
 * O autofill do Chrome escreve o valor direto no DOM **sem disparar o evento de input** que o
 * react-hook-form escuta. Resultado: o campo aparece preenchido para a pessoa, mas o formulário
 * envia o que o React lembrava — vazio (→ "E-mail inválido") ou o valor de uma tentativa
 * anterior (→ "E-mail ou senha incorretos" com o e-mail errado). Foi o que impediu o dono de
 * entrar, com os campos visivelmente corretos na tela.
 *
 * Chamar no `onSubmit`, ANTES do `handleSubmit`, para os campos que o navegador autopreenche
 * (e-mail, senha). Lê os inputs pelo `name` dentro do próprio formulário.
 */
export function sincronizarAutofill<T extends FieldValues>(
  evento: FormEvent<HTMLFormElement>,
  setValue: UseFormSetValue<T>,
  campos: Path<T>[],
): void {
  const elementos = evento.currentTarget.elements;
  for (const campo of campos) {
    const input = elementos.namedItem(campo as string);
    if (input instanceof HTMLInputElement) {
      // `shouldValidate` fica de fora: quem valida é o resolver no handleSubmit logo em seguida.
      setValue(campo, input.value as never, { shouldDirty: true });
    }
  }
}
