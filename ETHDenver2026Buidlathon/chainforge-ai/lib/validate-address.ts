const DELEGATE = /^0x[0-9a-fA-F]{40}$/;

export function isValidDelegateAddress(value: string): boolean {
  return DELEGATE.test(value?.trim() ?? "");
}

export function normalizeAddress(value: string): string {
  const v = value?.trim() ?? "";
  return v.startsWith("0x") ? v : `0x${v}`;
}
