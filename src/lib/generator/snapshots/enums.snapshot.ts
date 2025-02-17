export enum CreatorExportType {
  TRANSACTION = "transaction",
  BALANCE = "balance",
}

export enum SectionType {
  SECTION,
  SUB_SECTION,
}

export function isCreatorExportType(
  value: unknown,
): value is CreatorExportType {
  return String(value) in CreatorExportType;
}

export function isSectionType(value: unknown): value is SectionType {
  return String(value) in SectionType;
}
