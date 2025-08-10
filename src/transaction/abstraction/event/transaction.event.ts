export class TransactionEvent {
  constructor(
    public readonly transaction: any,
    public readonly operation: 'CREATE' | 'UPDATE' | 'DELETE',
    public readonly walletAccountNo: string
  ) {}
} 