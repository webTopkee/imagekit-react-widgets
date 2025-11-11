// Minimal classnames merge without Tailwind-specific rules
export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(' ')
}
