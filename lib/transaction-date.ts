export type TransactionDateParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

export function parseTransactionDate(value: string): TransactionDateParts {
  return {
    year: Number(value.slice(0, 4)),
    month: Number(value.slice(5, 7)),
    day: Number(value.slice(8, 10)),
  };
}
