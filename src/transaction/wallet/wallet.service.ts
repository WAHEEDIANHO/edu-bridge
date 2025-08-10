import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from '../entities/transaction.entity';
import { TransactionService } from '../transaction.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { PaymentDto } from './dto/payment.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import * as crypto from 'crypto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly secretKey = process.env.WALLET_SECRET_KEY || 'edu-bridge-wallet-secret-key';

  constructor(
    @InjectRepository(Wallet) private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction) private readonly transactionRepository: Repository<WalletTransaction>,
    private readonly transactionService: TransactionService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generate a signature for a transaction
   * @param transaction The transaction to sign
   * @returns The signature
   */
  private generateTransactionSignature(transaction: Partial<WalletTransaction>): string {
    const dataToSign = `${transaction.customerAccountNo}|${transaction.type}|${transaction.drAmount || 0}|${transaction.crAmount || 0}|${transaction.transRef}|${transaction.transNo}`;
    return crypto.createHmac('sha256', this.secretKey).update(dataToSign).digest('hex');
  }

  /**
   * Verify a transaction signature
   * @param transaction The transaction to verify
   * @param signature The signature to verify
   * @returns True if the signature is valid, false otherwise
   */
  private verifyTransactionSignature(transaction: Partial<WalletTransaction>, signature: string): boolean {
    const expectedSignature = this.generateTransactionSignature(transaction);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Add signature to transaction metadata
   * @param transaction The transaction to sign
   */
  private signTransaction(transaction: WalletTransaction): void {
    const signature = this.generateTransactionSignature(transaction);
    const metadata = transaction.metadata ? JSON.parse(transaction.metadata) : {};
    metadata.signature = signature;
    metadata.signedAt = new Date().toISOString();
    transaction.metadata = JSON.stringify(metadata);
  }

  /**
   * Log an audit event
   * @param action The action performed
   * @param userId The ID of the user who performed the action
   * @param details Additional details about the action
   */
  private logAuditEvent(action: string, userId: string, details: any): void {
    this.logger.log({
      action,
      userId,
      details,
      timestamp: new Date().toISOString()
    });
  }

  async createWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if wallet already exists for this user
      const existingWallet = await queryRunner.manager.findOne(Wallet, {
        where: [
          { customerId: createWalletDto.customerId },
          { email: createWalletDto.email }
        ]
      });

      if (existingWallet) {
        throw new BadRequestException(`Wallet already exists for this user (Account: ${existingWallet.accountNo})`);
      }

      // Generate unique account number
      const accountNo = this.generateAccountNumber();
      
      // Create wallet
      const wallet = new Wallet();
      wallet.accountNo = accountNo;
      wallet.customerName = createWalletDto.customerName;
      wallet.balance = 0;
      wallet.status = 'active';
      wallet.customerId = createWalletDto.customerId;
      wallet.email = createWalletDto.email;

      // Save wallet within the transaction context
      const savedWallet = await queryRunner.manager.save(wallet);

      // Create initial transaction for audit trail
      const transaction = new WalletTransaction();
      transaction.customerAccountNo = accountNo;
      transaction.crAmount = 0;
      transaction.drAmount = 0;
      transaction.type = 'WALLET_CREATION';
      transaction.narration = `Wallet created for ${createWalletDto.customerName}`;
      transaction.status = 'completed';
      transaction.transRef = this.generateTransactionRef();
      transaction.transNo = this.generateTransactionNumber();
      transaction.transDate = new Date();
      transaction.wallet = savedWallet;

      // Save transaction within the transaction context
      await queryRunner.manager.save(transaction);

      // Commit the transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Wallet created successfully for ${createWalletDto.customerName} (${accountNo})`);
      return savedWallet;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Creating wallet failed: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while creating the wallet');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async getWallet(accountNo: string, includeTransactions: boolean = false): Promise<Wallet> {
    try {
      const queryOptions: any = {
        where: { accountNo }
      };

      if (includeTransactions) {
        queryOptions.relations = ['transactions'];
      }

      const wallet = await this.walletRepository.findOne(queryOptions);

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${accountNo} not found`);
      }

      return wallet;
    } catch (error) {
      this.logger.error(`Error getting wallet: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting the wallet');
    }
  }

  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const wallet = await this.walletRepository.findOne({
        where: { customerId: userId },
      });

      return wallet;
    } catch (error) {
      this.logger.error(`Error getting wallet by user ID: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting the wallet by user ID');
    }
  }

  async getWalletByUserEmail(email: string): Promise<Wallet | null> {
    try {
      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const wallet = await this.walletRepository.findOne({
        where: { email },
      });

      return wallet;
    } catch (error) {
      this.logger.error(`Error getting wallet by email: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting the wallet by email');
    }
  }

  async getWalletInfoForUser(userId: string): Promise<any> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const wallet = await this.getWalletByUserId(userId);
      if (!wallet) {
        return {
          hasWallet: false,
          message: 'User does not have a wallet'
        };
      }
      
      const balance = await this.getWalletBalance(wallet.accountNo);
      const { transactions, total } = await this.getTransactionHistory(wallet.accountNo, 5, 0);
      
      // Remove sensitive information
      const sanitizedWallet = {
        accountNo: wallet.accountNo,
        customerName: wallet.customerName,
        status: wallet.status,
        createdAt: wallet.createdAt
      };
      
      return {
        hasWallet: true,
        wallet: sanitizedWallet,
        balance,
        totalTransactions: total,
        recentTransactions: transactions.map(t => ({
          id: t.id,
          transNo: t.transNo,
          transDate: t.transDate,
          type: t.type,
          amount: t.isCredit() ? t.crAmount : t.drAmount,
          isCredit: t.isCredit(),
          narration: t.narration,
          status: t.status
        }))
      };
    } catch (error) {
      this.logger.error(`Error getting wallet info for user: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting wallet info for user');
    }
  }

  async fundWallet(fundWalletDto: FundWalletDto, userId?: string): Promise<WalletTransaction> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet within the transaction
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: fundWalletDto.accountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${fundWalletDto.accountNo} not found`);
      }

      // Check if wallet is active
      if (!wallet.isActive()) {
        throw new BadRequestException('Wallet is not active');
      }

      // Security check: If userId is provided, verify it matches the wallet owner
      // For funding, we might allow admins to fund any wallet, so this check is optional
      if (userId && wallet.customerId !== userId) {
        // Log the attempt but don't throw an error for funding
        this.logAuditEvent('ADMIN_FUNDING_ATTEMPT', userId, {
          accountNo: fundWalletDto.accountNo,
          amount: fundWalletDto.amount,
          paymentMethod: fundWalletDto.paymentMethod
        });
      }

      // Create credit transaction
      const transaction = new WalletTransaction();
      transaction.customerAccountNo = fundWalletDto.accountNo;
      transaction.crAmount = fundWalletDto.amount;
      transaction.drAmount = 0;
      transaction.type = 'DEPOSIT';
      transaction.narration = `Wallet funding - ${fundWalletDto.paymentMethod || 'Manual'}`;
      transaction.status = 'completed';
      transaction.transRef = fundWalletDto.reference || this.generateTransactionRef();
      transaction.transNo = this.generateTransactionNumber();
      transaction.transDate = new Date();
      transaction.wallet = wallet;

      // Add metadata
      const metadata: any = {
        fundingDetails: {
          amount: fundWalletDto.amount,
          paymentMethod: fundWalletDto.paymentMethod || 'Manual',
          reference: fundWalletDto.reference
        }
      };
      
      // If funded by admin or another user, record that
      if (userId && wallet.customerId !== userId) {
        metadata.fundingDetails.fundedBy = userId;
      }
      
      transaction.metadata = JSON.stringify(metadata);

      // Sign the transaction
      this.signTransaction(transaction);

      // Save transaction within the transaction context
      await queryRunner.manager.save(transaction);

      // Update wallet balance within the transaction context
      wallet.balance = wallet.balance + fundWalletDto.amount;
      await queryRunner.manager.save(wallet);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log the successful funding
      this.logAuditEvent('WALLET_FUNDED', userId || wallet.customerId, {
        transactionId: transaction.id,
        accountNo: fundWalletDto.accountNo,
        amount: fundWalletDto.amount,
        paymentMethod: fundWalletDto.paymentMethod,
        reference: fundWalletDto.reference
      });

      return transaction;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Funding wallet failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while funding the wallet');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async makePayment(paymentDto: PaymentDto, userId?: string): Promise<WalletTransaction> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallets within the transaction
      const fromWallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: paymentDto.fromAccountNo }
      });
      
      const toWallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: paymentDto.toAccountNo }
      });

      if (!fromWallet) {
        throw new NotFoundException(`Sender wallet with account number ${paymentDto.fromAccountNo} not found`);
      }

      if (!toWallet) {
        throw new NotFoundException(`Receiver wallet with account number ${paymentDto.toAccountNo} not found`);
      }

      // Check if sender wallet is active
      if (!fromWallet.isActive()) {
        throw new BadRequestException('Sender wallet is not active');
      }

      // Check if receiver wallet is active
      if (!toWallet.isActive()) {
        throw new BadRequestException('Receiver wallet is not active');
      }

      // Security check: If userId is provided, verify it matches the wallet owner
      if (userId && fromWallet.customerId !== userId) {
        this.logAuditEvent('UNAUTHORIZED_PAYMENT_ATTEMPT', userId || 'unknown', {
          fromAccountNo: paymentDto.fromAccountNo,
          toAccountNo: paymentDto.toAccountNo,
          amount: paymentDto.amount
        });
        throw new UnauthorizedException('You are not authorized to make payments from this wallet');
      }

      // Calculate current balance within the transaction
      const transactions = await queryRunner.manager.find(WalletTransaction, {
        where: { customerAccountNo: paymentDto.fromAccountNo }
      });

      const currentBalance = transactions.reduce((sum, transaction) => {
        const drAmount = transaction.drAmount || 0;
        const crAmount = transaction.crAmount || 0;
        return sum - Number(drAmount) + Number(crAmount);
      }, 0);

      // Check if sender has sufficient balance
      if (currentBalance < paymentDto.amount) {
        throw new BadRequestException(`Insufficient balance. Required: ${paymentDto.amount}, Available: ${currentBalance}`);
      }

      // Create debit transaction for sender
      const debitTransaction = new WalletTransaction();
      debitTransaction.customerAccountNo = paymentDto.fromAccountNo;
      debitTransaction.drAmount = paymentDto.amount;
      debitTransaction.crAmount = 0;
      debitTransaction.type = 'PAYMENT';
      debitTransaction.narration = `Payment to ${toWallet.customerName} - ${paymentDto.description || 'Session payment'}`;
      debitTransaction.status = 'completed';
      debitTransaction.transRef = this.generateTransactionRef();
      debitTransaction.transNo = this.generateTransactionNumber();
      debitTransaction.transDate = new Date();
      debitTransaction.wallet = fromWallet;

      // Add metadata with session ID if provided
      const debitMetadata: any = {
        paymentDetails: {
          toAccountNo: paymentDto.toAccountNo,
          toCustomerName: toWallet.customerName,
          description: paymentDto.description
        }
      };
      
      if (paymentDto.sessionId) {
        debitMetadata.sessionId = paymentDto.sessionId;
      }
      
      debitTransaction.metadata = JSON.stringify(debitMetadata);

      // Sign the debit transaction
      this.signTransaction(debitTransaction);

      // Create credit transaction for receiver
      const creditTransaction = new WalletTransaction();
      creditTransaction.customerAccountNo = paymentDto.toAccountNo;
      creditTransaction.crAmount = paymentDto.amount;
      creditTransaction.drAmount = 0;
      creditTransaction.type = 'RECEIVED';
      creditTransaction.narration = `Payment from ${fromWallet.customerName} - ${paymentDto.description || 'Session payment'}`;
      creditTransaction.status = 'completed';
      creditTransaction.transRef = debitTransaction.transRef; // Same reference for both transactions
      creditTransaction.transNo = this.generateTransactionNumber();
      creditTransaction.transDate = new Date();
      creditTransaction.wallet = toWallet;

      // Add metadata with session ID if provided
      const creditMetadata: any = {
        paymentDetails: {
          fromAccountNo: paymentDto.fromAccountNo,
          fromCustomerName: fromWallet.customerName,
          description: paymentDto.description
        }
      };
      
      if (paymentDto.sessionId) {
        creditMetadata.sessionId = paymentDto.sessionId;
      }
      
      creditTransaction.metadata = JSON.stringify(creditMetadata);

      // Sign the credit transaction
      this.signTransaction(creditTransaction);

      // Save transactions within the transaction
      await queryRunner.manager.save(debitTransaction);
      await queryRunner.manager.save(creditTransaction);

      // Update wallet balances within the transaction
      fromWallet.balance = currentBalance - paymentDto.amount;
      toWallet.balance = toWallet.balance + paymentDto.amount;

      await queryRunner.manager.save(fromWallet);
      await queryRunner.manager.save(toWallet);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log the successful payment
      this.logAuditEvent('PAYMENT_COMPLETED', userId || fromWallet.customerId, {
        transactionId: debitTransaction.id,
        fromAccountNo: paymentDto.fromAccountNo,
        toAccountNo: paymentDto.toAccountNo,
        amount: paymentDto.amount,
        description: paymentDto.description,
        sessionId: paymentDto.sessionId
      });

      return debitTransaction;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Payment failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while processing the payment');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async requestWithdrawal(withdrawRequestDto: WithdrawRequestDto, userId?: string): Promise<any> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet within the transaction
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: withdrawRequestDto.accountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${withdrawRequestDto.accountNo} not found`);
      }

      // Check if wallet is active
      if (!wallet.isActive()) {
        throw new BadRequestException('Wallet is not active');
      }

      // Security check: If userId is provided, verify it matches the wallet owner
      if (userId && wallet.customerId !== userId) {
        this.logAuditEvent('UNAUTHORIZED_WITHDRAWAL_ATTEMPT', userId, {
          accountNo: withdrawRequestDto.accountNo,
          amount: withdrawRequestDto.amount
        });
        throw new UnauthorizedException('You are not authorized to request withdrawals from this wallet');
      }

      // Calculate current balance within the transaction
      const transactions = await queryRunner.manager.find(WalletTransaction, {
        where: { customerAccountNo: withdrawRequestDto.accountNo }
      });

      const currentBalance = transactions.reduce((sum, transaction) => {
        const drAmount = transaction.drAmount || 0;
        const crAmount = transaction.crAmount || 0;
        return sum - Number(drAmount) + Number(crAmount);
      }, 0);

      // Check if wallet has sufficient balance
      if (currentBalance < withdrawRequestDto.amount) {
        throw new BadRequestException(`Insufficient balance for withdrawal. Required: ${withdrawRequestDto.amount}, Available: ${currentBalance}`);
      }

      // Create withdrawal request transaction (pending)
      const transaction = new WalletTransaction();
      transaction.customerAccountNo = withdrawRequestDto.accountNo;
      transaction.drAmount = withdrawRequestDto.amount;
      transaction.crAmount = 0;
      transaction.type = 'WITHDRAWAL_REQUEST';
      transaction.narration = `Withdrawal request - ${withdrawRequestDto.reason || 'Manual withdrawal'}`;
      transaction.status = 'pending';
      transaction.transRef = this.generateTransactionRef();
      transaction.transNo = this.generateTransactionNumber();
      transaction.transDate = new Date();
      transaction.wallet = wallet;

      // Store details in metadata
      const metadata: any = {
        withdrawalDetails: {
          amount: withdrawRequestDto.amount,
          reason: withdrawRequestDto.reason || 'Manual withdrawal',
          requestedAt: new Date().toISOString(),
          requestedBy: userId || wallet.customerId
        }
      };

      // Add bank details if provided
      if (withdrawRequestDto.bankDetails) {
        metadata.bankDetails = withdrawRequestDto.bankDetails;
      }

      transaction.metadata = JSON.stringify(metadata);

      // Sign the transaction
      this.signTransaction(transaction);

      // Save transaction within the transaction context
      await queryRunner.manager.save(transaction);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log the successful withdrawal request
      this.logAuditEvent('WITHDRAWAL_REQUESTED', userId || wallet.customerId, {
        transactionId: transaction.id,
        accountNo: withdrawRequestDto.accountNo,
        amount: withdrawRequestDto.amount,
        reason: withdrawRequestDto.reason
      });
      
      return {
        message: 'Withdrawal request submitted successfully',
        transactionId: transaction.id,
        status: 'pending',
        amount: withdrawRequestDto.amount,
        requestedAt: new Date().toISOString()
      };
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Withdrawal request failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while processing the withdrawal request');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async approveWithdrawal(transactionId: string, adminId: string): Promise<WalletTransaction> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify that adminId is provided
      if (!adminId) {
        throw new UnauthorizedException('Admin ID is required to approve withdrawals');
      }

      // Get transaction within the transaction context
      const transaction = await queryRunner.manager.findOne(WalletTransaction, {
        where: { id: transactionId },
        relations: ['wallet']
      });

      if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (transaction.status !== 'pending') {
        throw new BadRequestException('Withdrawal request already processed');
      }

      // Get wallet within the transaction context
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: transaction.customerAccountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${transaction.customerAccountNo} not found`);
      }

      // Check if wallet is active
      if (!wallet.isActive()) {
        throw new BadRequestException('Wallet is not active');
      }

      // Calculate current balance within the transaction
      const transactions = await queryRunner.manager.find(WalletTransaction, {
        where: { customerAccountNo: transaction.customerAccountNo }
      });

      const currentBalance = transactions.reduce((sum, tx) => {
        const drAmount = tx.drAmount || 0;
        const crAmount = tx.crAmount || 0;
        return sum - Number(drAmount) + Number(crAmount);
      }, 0);

      // Check if wallet has sufficient balance
      if (currentBalance < transaction.drAmount) {
        throw new BadRequestException(`Insufficient balance for withdrawal. Required: ${transaction.drAmount}, Available: ${currentBalance}`);
      }

      // Parse existing metadata
      let existingMetadata = {};
      if (transaction.metadata) {
        try {
          existingMetadata = JSON.parse(transaction.metadata);
        } catch (e) {
          this.logger.warn(`Could not parse metadata for transaction ${transactionId}`);
        }
      }

      // Update transaction status to approved
      transaction.status = 'approved';
      
      // Update metadata with approval details
      const updatedMetadata = {
        ...existingMetadata,
        approvalDetails: {
          approvedAt: new Date().toISOString(),
          approvedBy: adminId
        }
      };
      
      transaction.metadata = JSON.stringify(updatedMetadata);
      
      // Sign the updated transaction
      this.signTransaction(transaction);
      
      // Create a new withdrawal transaction to actually debit the wallet
      const withdrawalTransaction = new WalletTransaction();
      withdrawalTransaction.customerAccountNo = transaction.customerAccountNo;
      withdrawalTransaction.drAmount = transaction.drAmount;
      withdrawalTransaction.crAmount = 0;
      withdrawalTransaction.type = 'WITHDRAWAL';
      withdrawalTransaction.narration = `Withdrawal - Approved request #${transaction.id}`;
      withdrawalTransaction.status = 'completed';
      withdrawalTransaction.transRef = `WD-${transaction.transRef}`;
      withdrawalTransaction.transNo = this.generateTransactionNumber();
      withdrawalTransaction.transDate = new Date();
      withdrawalTransaction.wallet = wallet;
      
      // Add metadata to withdrawal transaction
      const withdrawalMetadata = {
        ...updatedMetadata,
        withdrawalDetails: {
          originalRequestId: transaction.id,
          amount: transaction.drAmount,
          processedAt: new Date().toISOString(),
          processedBy: adminId
        }
      };
      
      withdrawalTransaction.metadata = JSON.stringify(withdrawalMetadata);
      
      // Sign the withdrawal transaction
      this.signTransaction(withdrawalTransaction);

      // Save transactions within the transaction context
      await queryRunner.manager.save(transaction);
      await queryRunner.manager.save(withdrawalTransaction);

      // Update wallet balance within the transaction context
      wallet.balance = currentBalance - transaction.drAmount;
      await queryRunner.manager.save(wallet);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log the approval action
      this.logAuditEvent('WITHDRAWAL_APPROVED', adminId, {
        transactionId: transaction.id,
        withdrawalTransactionId: withdrawalTransaction.id,
        accountNo: transaction.customerAccountNo,
        amount: transaction.drAmount,
        customerId: wallet.customerId
      });

      return transaction;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Approving withdrawal failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while approving the withdrawal');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async rejectWithdrawal(transactionId: string, adminId: string, reason?: string): Promise<WalletTransaction> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify that adminId is provided
      if (!adminId) {
        throw new UnauthorizedException('Admin ID is required to reject withdrawals');
      }

      // Get transaction within the transaction context
      const transaction = await queryRunner.manager.findOne(WalletTransaction, {
        where: { id: transactionId },
        relations: ['wallet']
      });

      if (!transaction || transaction.type !== 'WITHDRAWAL_REQUEST') {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (transaction.status !== 'pending') {
        throw new BadRequestException('Withdrawal request already processed');
      }

      // Get wallet to include in audit log
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo: transaction.customerAccountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${transaction.customerAccountNo} not found`);
      }

      // Parse existing metadata
      let existingMetadata = {};
      if (transaction.metadata) {
        try {
          existingMetadata = JSON.parse(transaction.metadata);
        } catch (e) {
          this.logger.warn(`Could not parse metadata for transaction ${transactionId}`);
        }
      }

      // Update transaction status to rejected
      transaction.status = 'rejected';
      transaction.narration = `Withdrawal rejected - ${reason || 'Admin rejection'}`;
      
      // Update metadata with rejection details
      const updatedMetadata = {
        ...existingMetadata,
        rejectionDetails: {
          rejectedAt: new Date().toISOString(),
          rejectedBy: adminId,
          reason: reason || 'Admin rejection'
        }
      };
      
      transaction.metadata = JSON.stringify(updatedMetadata);
      
      // Sign the updated transaction
      this.signTransaction(transaction);
      
      // Save transaction within the transaction context
      await queryRunner.manager.save(transaction);

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Log the rejection action
      this.logAuditEvent('WITHDRAWAL_REJECTED', adminId, {
        transactionId: transaction.id,
        accountNo: transaction.customerAccountNo,
        amount: transaction.drAmount,
        customerId: wallet.customerId,
        reason: reason || 'Admin rejection'
      });

      return transaction;
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Rejecting withdrawal failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while rejecting the withdrawal');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async getWalletBalance(accountNo: string): Promise<number> {
    try {
      const wallet = await this.walletRepository.findOne({
        where: { accountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${accountNo} not found`);
      }

      // Get all transactions for this wallet
      const transactions = await this.transactionService.getTransactionHistory(accountNo);

      // Calculate balance
      const balance = transactions.reduce((sum, transaction) => {
        const drAmount = transaction.drAmount || 0;
        const crAmount = transaction.crAmount || 0;
        return sum - Number(drAmount) + Number(crAmount);
      }, 0);

      // Update wallet balance if it's different from the calculated balance
      if (wallet.balance !== balance) {
        await this.updateWalletBalance(accountNo, balance);
      }

      return balance;
    } catch (error) {
      this.logger.error(`Error getting wallet balance: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting the wallet balance');
    }
  }

  async getTransactionHistory(
    accountNo: string, 
    limit?: number, 
    offset?: number,
    filters?: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<{ transactions: any[], total: number }> {  //come back and fixed
    try {
      const wallet = await this.walletRepository.findOne({
        where: { accountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${accountNo} not found`);
      }

      // Build query conditions
      const queryConditions: any = { customerAccountNo: accountNo };
      
      if (filters) {
        if (filters.type) {
          queryConditions.type = filters.type;
        }
        
        if (filters.status) {
          queryConditions.status = filters.status;
        }
        
        // Date range filtering
        if (filters.startDate || filters.endDate) {
          queryConditions.transDate = {};
          
          if (filters.startDate) {
            queryConditions.transDate.gte = filters.startDate;
          }
          
          if (filters.endDate) {
            // Set end date to end of day
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            queryConditions.transDate.lte = endDate;
          }
        }
      }

      // Get transactions with filtering and pagination
      const [transactions, total] = await this.transactionRepository.findAndCount({
        where: queryConditions,
        order: { transDate: 'DESC' },
        skip: offset,
        take: limit
      });
      
      // Process transactions to add helper properties
      const processedTransactions = transactions.map(transaction => {
        // Add isCredit and isDebit properties
        const isCredit = transaction.crAmount > 0;
        const amount = isCredit ? transaction.crAmount : transaction.drAmount;
        
        return {
          ...transaction,
          isCredit,
          isDebit: !isCredit,
          amount
        };
      });
      
      return { transactions: processedTransactions, total };
    } catch (error) {
      this.logger.error(`Error getting transaction history: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while getting the transaction history');
    }
  }

  async getPendingWithdrawals(): Promise<WalletTransaction[]> {
    try {
      return await this.transactionService.getPendingWithdrawals();
    } catch (error) {
      this.logger.error(`Error getting pending withdrawals: ${error.message}`, error.stack);
      throw new InternalServerErrorException('An error occurred while getting pending withdrawals');
    }
  }

  async updateWalletBalance(accountNo: string, balance?: number): Promise<void> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get wallet within the transaction
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { accountNo }
      });

      if (!wallet) {
        throw new NotFoundException(`Wallet with account number ${accountNo} not found`);
      }

      // If balance is not provided, calculate it
      if (balance === undefined) {
        const transactions = await queryRunner.manager.find(WalletTransaction, {
          where: { customerAccountNo: accountNo }
        });

        balance = transactions.reduce((sum, transaction) => {
          const drAmount = transaction.drAmount || 0;
          const crAmount = transaction.crAmount || 0;
          return sum - Number(drAmount) + Number(crAmount);
        }, 0);
      }

      // Update wallet balance
      wallet.balance = balance;
      await queryRunner.manager.save(wallet);

      // Commit the transaction
      await queryRunner.commitTransaction();

      this.logger.log(`Wallet ${accountNo} balance updated to ${balance}`);
    } catch (error) {
      // Rollback the transaction in case of error
      await queryRunner.rollbackTransaction();
      this.logger.error(`Updating wallet balance failed: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('An error occurred while updating the wallet balance');
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `WAL${timestamp.slice(-6)}${random}`;
  }

  private generateTransactionRef(): string {
    return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private generateTransactionNumber(): string {
    return `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  getDataSource() {
    return this.dataSource;
  }
}