import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, HttpStatus, UseGuards, Req, Redirect } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ApiBearerAuth, ApiExcludeController, ApiExcludeEndpoint, ApiOperation, ApiParam } from '@nestjs/swagger';
import { SessionQueryDto } from './dto/session-query-dto';
import { Response, Request } from 'express';
import { AuthGuard } from '../auth/guard/auth.guard';
import { User, UserRole } from '../user/entities/user.entity';
import { WalletService } from '../transaction/wallet/wallet.service';
import { TransactionService } from '../transaction/transaction.service';
import { WalletTransaction } from '../transaction/entities/transaction.entity';
import { Wallet } from '../transaction/wallet/entities/wallet.entity';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailServiceService } from '../email-service/email-service.service';


// @ApiExcludeController()
@Controller('session')
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly mailerService: EmailServiceService,
    // private readonly walletService: WalletService,
    // private readonly transactionService: TransactionService,
    @InjectQueue('payment') private paymentProcessorQueue: Queue
  ) {}


  @Get()
  async findAll(@Query() query: SessionQueryDto, @Res() res: Response): Promise<Response>
  {
    const session = await this.sessionService.findAll(query);



    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Sessions retrieved successfully', session));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<Response> {
    const { sub, role } = req.user as any;
    const session = await this.sessionService.findById(id, ['mentee', 'mentor']);
    
    if (!session) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'Session not found', null));
    }
    
    // Check if user is authorized to access this session
    const isMentor = session.mentor && session.mentor.id === sub;
    const isMentee = session.mentee && session.mentee.id === sub;
    
    if (!isMentor && !isMentee && role !== UserRole.ADMIN) {
      return res.status(HttpStatus.FORBIDDEN).json(res.formatResponse(HttpStatus.FORBIDDEN, 'You are not authorized to access this session', null));
    }
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Session retrieved successfully', session));
  }

  @ApiExcludeEndpoint()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id/zoom')
  async getZoomMeeting(@Param('id') id: string, @Req() req: Request, @Res() res: Response): Promise<Response> {
    const { sub, role } = req.user as any;
    const session = await this.sessionService.findById(id, ['mentee', 'mentor']);
    
    if (!session) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'Session not found', null));
    }
    
    // Check if user is authorized to access this session
    const isMentor = session.mentor && session.mentor.id === sub;
    const isMentee = session.mentee && session.mentee.id === sub;
    
    if (!isMentor && !isMentee && role !== UserRole.ADMIN) {
      return res.status(HttpStatus.FORBIDDEN).json(res.formatResponse(HttpStatus.FORBIDDEN, 'You are not authorized to access this session', null));
    }
    
    // Return appropriate Zoom link based on user role
    const zoomData = {
      meetingUrl: isMentor ? session.zoom_start_link : session.zoom_join_link,
      isMentor: isMentor,
      sessionDate: session.session_date,
      startTime: session.startTime,
      endTime: session.endTime,
      topic: `Session with ${isMentor ? session.mentee_name : session.mentor_name}`
    };
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Zoom meeting details retrieved successfully', zoomData));
  }


  @ApiExcludeEndpoint()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id/join')
  @ApiOperation({ summary: 'Join a Zoom meeting for a session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @Redirect()
  async joinZoomMeeting(@Param('id') id: string, @Req() req: Request): Promise<{ url: string }> {
    const { sub, role } = req.user as any;
    const session = await this.sessionService.findById(id, ['mentee', 'mentor']);
    
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Check if user is authorized to access this session
    const isMentor = session.mentor && session.mentor.id === sub;
    const isMentee = session.mentee && session.mentee.id === sub;
    
    if (!isMentor && !isMentee && role !== UserRole.ADMIN) {
      throw new Error('You are not authorized to access this session');
    }
    
    // Redirect to the Zoom meeting page with the session ID
    return { url: `/static/zoom-meeting.html?id=${id}` };
  }


  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @Res() res: Response): Promise<Response> {
    const session = await this.sessionService.findById(id, ['booking', 'mentor', 'mentee', 'mentee.user', 'mentor.user']);
    if(!session) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'Session not found', null));

    // Store previous completion status to check if it's changing
    const wasCompletedBefore = session.completed;
    session.completed = updateSessionDto.completed || session.completed;
    
    // If session is being marked as completed, process payment to mentor
  //

    console.log(session.mentee)
    // && !wasCompletedBefore
    if (session.completed && !wasCompletedBefore) {
      // try {
      //   // Find the booking payment transaction
      //   const bookingTransactions = await this.transactionService.findAll({
      //     type: 'BOOKING_PAYMENT',
      //     transRef: `BOOKING-${session.booking.id}`
      //   } as PaginationQueryDto<WalletTransaction>);
      //
      //   if (bookingTransactions && bookingTransactions.data && bookingTransactions.data.length > 0) {
      //     const bookingTransaction = bookingTransactions.data[0];
      //
      //     // Extract payment details from transaction metadata
      //     if (bookingTransaction.metadata) {
      //       const metadata = JSON.parse(bookingTransaction.metadata);
      //
      //       if (metadata.pendingCredit && metadata.mentorWalletAccountNo && metadata.amount) {
      //         // Use a database transaction to ensure atomicity
      //         const queryRunner = this.walletService.getDataSource().createQueryRunner();
      //         await queryRunner.connect();
      //         await queryRunner.startTransaction();
      //
      //         try {
      //           // Credit mentor's wallet
      //           const creditTransaction = new WalletTransaction();
      //           creditTransaction.customerAccountNo = metadata.mentorWalletAccountNo;
      //           creditTransaction.crAmount = metadata.amount;
      //           creditTransaction.drAmount = 0;
      //           creditTransaction.type = 'SESSION_PAYMENT';
      //           creditTransaction.narration = `Payment for completed session #${session.id}`;
      //           creditTransaction.status = 'completed';
      //           creditTransaction.transRef = `SESSION-${session.id}`;
      //           creditTransaction.transNo = `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;
      //
      //           // Save transaction within the transaction context
      //           await queryRunner.manager.save(creditTransaction);
      //
      //           // Update wallet balance within the transaction context
      //           const wallet = await queryRunner.manager.findOne(Wallet, {
      //             where: { accountNo: metadata.mentorWalletAccountNo }
      //           });
      //
      //           if (!wallet) {
      //             throw new Error(`Wallet with account number ${metadata.mentorWalletAccountNo} not found`);
      //           }
      //
      //           // Calculate current balance
      //           const transactions = await queryRunner.manager.find(WalletTransaction, {
      //             where: { customerAccountNo: metadata.mentorWalletAccountNo }
      //           });
      //
      //           const currentBalance = transactions.reduce((sum, tx) => {
      //             const drAmount = tx.drAmount || 0;
      //             const crAmount = tx.crAmount || 0;
      //             return sum - Number(drAmount) + Number(crAmount);
      //           }, 0);
      //
      //           // Update wallet balance
      //           wallet.balance = currentBalance + metadata.amount;
      //           await queryRunner.manager.save(wallet);
      //
      //           // Update the original transaction metadata to mark credit as processed
      //           bookingTransaction.metadata = JSON.stringify({
      //             ...metadata,
      //             pendingCredit: false,
      //             creditedAt: new Date().toISOString(),
      //             sessionId: session.id
      //           });
      //
      //           await queryRunner.manager.save(bookingTransaction);
      //
      //           // Commit the transaction
      //           await queryRunner.commitTransaction();
      //         } catch (error) {
      //           // Rollback the transaction in case of error
      //           await queryRunner.rollbackTransaction();
      //           throw error;
      //         } finally {
      //           // Release the query runner
      //           await queryRunner.release();
      //         }
      //       }
      //     }
      //   }
      // } catch (error) {
      //   console.error('Error processing mentor payment:', error);
      //   // We don't want to fail the session completion if payment processing fails
      //   // But we should log the error for investigation
      // }

      // send a notification mail to student involve in the session
      await this.mailerService.sendSessionCompleteNotification(
        {
          name: this.getFullName(session.mentee.user),
          mentorId: session.mentor.id,
          tutorName: this.getFullName(session.mentor.user),
          email: session.mentee.user.email,
        }
      )


      console.log('Session completed put payment process to queue');
      await this.paymentProcessorQueue.add('process-tutor-payment', {
        session
      }, { delay: 60 * 60 * 1000 }) //1hr

      console.log('Session completed put payment process to queue successfully');
    }
    
    await this.sessionService.update(session);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Session updated', session));
  }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.sessionService.remove(+id);
  // }


  private getFullName(user: User): string {
    if(!user) return "";

    return `${user.firstName} ${user.lastName}`;
  }
}
