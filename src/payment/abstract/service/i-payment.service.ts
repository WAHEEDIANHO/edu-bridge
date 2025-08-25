export interface IPaymentService {
  verifyAccount(accountNumber: string, bankCode: string): Promise<any>;
  getBanks(): Promise<any>;
  initializeTransaction(email: string, amount: number): Promise<any>;
  verifyTransaction(reference: string): Promise<any>;
  createTransferRecipient(name: string, accountNumber: string, bankCode: string): Promise<any>
  initiateTransfer(amount: number, recipientCode: string): Promise<any>;
}