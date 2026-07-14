import { forwardRef, type InputHTMLAttributes } from "react";
import { Input } from "./input";
import { formatBRL, parseBRL } from "../../lib/masks";

type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onChange: (valor: number | undefined) => void;
};

/**
 * Input de moeda brasileira: o usuário digita números e vê "R$ 1.234,56" enquanto
 * digita (os dígitos preenchem da direita para a esquerda). Devolve um `number`.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, placeholder = "R$ 0,00", ...props },
  ref,
) {
  return (
    <Input
      ref={ref}
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatBRL(value)}
      onChange={(e) => onChange(parseBRL(e.target.value))}
      {...props}
    />
  );
});
