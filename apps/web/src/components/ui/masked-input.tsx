import * as React from "react";
import { Input } from "./input";

/**
 * Input com máscara de formatação. Aplica `format` a cada digitação (reescrevendo
 * o valor exibido) e repassa o evento ao onChange (compatível com react-hook-form,
 * que passa a ler o valor já formatado). Ex.: telefone, CPF/CNPJ, CEP.
 */
export const MaskedInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input> & { format: (v: string) => string }
>(({ format, onChange, ...props }, ref) => (
  <Input
    ref={ref}
    onChange={(e) => {
      e.target.value = format(e.target.value);
      onChange?.(e);
    }}
    {...props}
  />
));
MaskedInput.displayName = "MaskedInput";
