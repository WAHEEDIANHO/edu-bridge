import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPaymentService } from './abstract/service/i-payment.service';
import {  InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import Paystack from '@paystack/paystack-sdk';

interface BankResponse {
  name: string;
  code: string;
  available_for_direct_debit: boolean;
}

export interface InitializeTransactionResponse {
  status: boolean,
  message: string,
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  }
}

@Injectable()
export class PaymentService implements IPaymentService {
  private paystack: any;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Payment) repo: Repository<Payment>,
    @InjectRepository(PaymentMethod) private readonly pmRepo: Repository<PaymentMethod>,
  ) {
    this.paystack = new Paystack(
      configService.get<string>('PAYSTACK_TEST_SECRET_KEY') || '',
    );
  }
  async upsertPaymentMethod(userId: string, card: {
    authorization_code: string;
    reusable: boolean;
    brand?: string;
    last4?: string;
    exp_month?: string | number;
    exp_year?: string | number;
    is_default?: boolean;
  }): Promise<PaymentMethod> {
    let pm = this.pmRepo.create({
      authorizationCode: card.authorization_code,
      reusable: !!card.reusable,
      isDefault: !!card.is_default,
    }) as PaymentMethod;
    (pm as any).user = { id: userId } as any;
    pm.cardBrand = card.brand;
    pm.last4 = card.last4;
    pm.expMonth = card.exp_month ? String(card.exp_month).padStart(2, '0') : undefined;
    pm.expYear = card.exp_year ? String(card.exp_year) : undefined;
    return await this.pmRepo.save(pm);
  }

  async getDefaultPaymentMethod(userId: string): Promise<PaymentMethod | null> {
    return await this.pmRepo.findOne({ where: { user: { id: userId }, isDefault: true } as any });
  }

  async verifyAccount(accountNumber: string, bankCode: string): Promise<any> {
    let res = await this.paystack.verification.resolveAccountNumber({
      account_number: accountNumber,
      bank_code: bankCode,
    });
    return res;
  }
  async getBanks(): Promise<any> {
    const banks = await this.paystack.verification.fetchBanks({
      country: 'nigeria',
    });
    return banks.data.map((bank: any) => {
      const b: BankResponse = {
        name: bank.name,
        code: bank.code,
        available_for_direct_debit: bank.available_for_direct_debit,
      };
      return b;
    });
  }

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    path: string,
    metadata: string,
  ): Promise<InitializeTransactionResponse> {
    // initiate transaction
    const trans = (await this.paystack.transaction.initialize({
      email,
      amount: amount * 100, // amount in kobo
      callback_url:
        this.configService.get<string>('PAYMENT_CALLBACK_URL') + path ||
        'http://localhost:3000/payment/callback',
      reference: reference,
      metadata: metadata,
    })) as any;

    return trans;
    // save access code and reference to db
    // return authorization url to client
  }
  async chargeAuthorization(params: {
    email: string;
    authorization_code: string;
    amount: number; // in base currency (NGN)
    reference: string;
    metadata?: any;
  }): Promise<any> {
    const payload = {
      email: params.email,
      authorization_code: params.authorization_code,
      amount: params.amount * 100,
      reference: params.reference,
      metadata: params.metadata,
    } as any;
    const res = await this.paystack.transaction.charge(payload);
    return res;
  }
  verifyTransaction(reference: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  createTransferRecipient(
    name: string,
    accountNumber: string,
    bankCode: string,
  ): Promise<any> {
    throw new Error('Method not implemented.');
  }
  initiateTransfer(amount: number, recipientCode: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  
}
