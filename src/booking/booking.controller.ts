import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Query, Inject,
  BadRequestException,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserRole } from '../user/entities/user.entity';
import { ApiBearerAuth, ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { Request, Response } from 'express';
import { Booking } from './entities/booking.entity';

import { BookingQueryDto } from './dto/BookingQueryDto';
import { PendingBookingQueryDto } from './dto/pending-booking-query.dto';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { MentorService } from '../mentor/mentor.service';
import { RoleGuard } from '../auth/guard/role.guard';
import { MenteeService } from '../mentee/mentee.service';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { ValidationPipe } from '../utils/validation.pipe';
import { EventBus } from '@nestjs/cqrs';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { BookingEvent } from './abstraction/event/booking.event';
import { Session } from '../session/entities/session.entity';
import { ConferenceService } from '../conference/conference.service';
import { SessionService } from '../session/session.service';
import { WalletService } from '../transaction/wallet/wallet.service';
import { PaymentDto } from '../transaction/wallet/dto/payment.dto';
import { WalletTransaction } from '../transaction/entities/transaction.entity';
import { TransactionService } from '../transaction/transaction.service';
import { Wallet } from '../transaction/wallet/entities/wallet.entity';



@Controller('bookings')
export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly mentorService: MentorService,
    private readonly menteeService: MenteeService,
    private readonly availabilitySlotService: AvailabilitySlotService,
    private readonly conferenceService: ConferenceService,
    private readonly sessionService: SessionService,
    private readonly walletService: WalletService,
    // private readonly transactionService: TransactionService,
    // Assuming this is the service that handles conference/zoom meetings
    // private readonly eventBus: EventBus
    ) {}


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(UserRole.Student)
  @Post()
  async create(@Req() req: Request, @Body(new ValidationPipe()) dto: CreateBookingDto, @Res() res:  Response): Promise<Response> {

    const { sub } = req.user as any;

    const student = await this.menteeService.findByUserId(sub);
    if (!student) {
      return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a student"));
    }

    // Get mentor details to check rate
    const mentor = await this.mentorService.findById(dto.mentorId as string);
    if (!mentor) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentor not found"));
    }

    // Calculate total cost based on mentor's rate and booking duration
    const ratePerHour = Number(mentor.ratePerHour);
    const durationInHours = Number(Number(dto.duration / 60).toFixed(2)); // Convert minutes to hours
    const totalCost = ratePerHour * durationInHours;

    // Check if mentee has sufficient funds in wallet
    const menteeWallet = await this.walletService.getWalletByUserId(student.user.id);
    if (!menteeWallet) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Mentee does not have a wallet"));
    }

    const walletBalance = await this.walletService.getWalletBalance(menteeWallet.accountNo);
    console.log("wallet balance is ", walletBalance);
    if (walletBalance < totalCost) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, `Insufficient funds. Required: ${totalCost}, Available: ${walletBalance}`));
    }

    const booking = new Booking();
    booking.mentee = student;
    booking.slot = dto.slotId as any //selectedSlot;
    booking.note = dto?.note || "";
    booking.duration = durationInHours; //dto.duration;
    booking.prefer_time = dto.preferTime;
    booking.prefer_date = dto.preferDate;
    booking.subject = dto.subject as any;
    booking.mentor = mentor;
    await this.service.create(booking);

    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "successful", { id: booking.id }))
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query() bookingQuery: BookingQueryDto, @Res() res: Response): Promise<Response> {
    const paginated = await this.service.findAll(bookingQuery, ['mentor', 'mentee', 'slot', 'subject']);

    const preArray: any = [];
    for(const booking of paginated.data) {
      const fullBookingDetails = await this.service.findById(booking.id, ['mentor.user', 'mentee.user', 'subject']);
      this.flattenObject(fullBookingDetails?.mentee);
      preArray.push(fullBookingDetails);
    }

    paginated.data = preArray;

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", paginated));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(...[UserRole.Teacher, UserRole.ADMIN])
  @Get('pending-request')
  async getPendingScheduling(@Req() req: Request ,@Query() query: PendingBookingQueryDto, @Res() res: Response): Promise<Response> {
    const { sub } = req.user as any;
    const mentor = await this.mentorService.findByUserId(sub);
    if (!mentor) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }
    const bookings = await this.service.findAll({...query, status: 'pending', mentor:  { id: mentor.id }  } as PaginationQueryDto<Booking>, ['mentor']);

    const fullBooking : Booking[] = [];
    for (const item of bookings.data) {
      const data = (await this.service.findById(item.id, ['mentee', 'mentor', 'slot', 'mentee.user']))!;

      fullBooking.push(data)
      // Optionally flatten or process as needed
    }
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", fullBooking));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentor = await this.service.findById(id, ['user']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", mentor));
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher)
  @Patch(':id')
  async update(@Param('id') id: string, @Body(new ValidationPipe()) dto: UpdateBookingDto, @Res() res: Response): Promise<Response> {
    const booking = await this.service.findById(id, ['mentee.user', 'mentor.user', 'subject']);
    if (!booking) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "no booking with the given Id"));
    
    // Store previous status to check if it's changing to confirmed
    const previousStatus = booking.status;
    booking.status = dto.status;

    if(dto.status === 'confirmed' && previousStatus !== 'confirmed') {
      // Calculate total cost based on mentor's rate and booking duration
      const ratePerHour = booking.mentor.ratePerHour;
      const durationInHours = booking.duration; // Convert minutes to hours
      const totalCost = ratePerHour * durationInHours;

      // Get mentee's wallet
      const menteeWallet = await this.walletService.getWalletByUserId(booking.mentee.user.id);
      if (!menteeWallet) {
        return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Mentee does not have a wallet"));
      }

      // Check if mentee has sufficient funds
      const walletBalance = await this.walletService.getWalletBalance(menteeWallet.accountNo);
      if (walletBalance < totalCost) {
        return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, `Insufficient funds. Required: ${totalCost}, Available: ${walletBalance}`));
      }

      // Get mentor's wallet
      const mentorWallet = await this.walletService.getWalletByUserId(booking.mentor.user.id);
      if (!mentorWallet) {
        return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Mentor does not have a wallet"));
      }

      // Debit mentee's wallet (but don't credit mentor's wallet yet)
      try {
        // Create payment data
        const paymentData = {
          fromAccountNo: menteeWallet.accountNo,
          amount: totalCost,
          bookingId: booking.id,
          mentorWalletAccountNo: mentorWallet.accountNo,
          mentorName: `${booking.mentor.user.firstName} ${booking.mentor.user.lastName}`
        };

        // Create a transaction record with metadata
        const transaction = new WalletTransaction();
        transaction.customerAccountNo = menteeWallet.accountNo;
        transaction.drAmount = totalCost;
        transaction.crAmount = 0;
        transaction.type = 'BOOKING_PAYMENT';
        transaction.narration = `Payment for booking #${booking.id} with ${paymentData.mentorName}`;
        transaction.status = 'completed';
        transaction.transRef = `BOOKING-${booking.id}`;
        transaction.transNo = `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;
        transaction.metadata = JSON.stringify({
          bookingId: booking.id,
          mentorWalletAccountNo: mentorWallet.accountNo,
          amount: totalCost,
          pendingCredit: true
        });

        // Use a database transaction to ensure atomicity
        const queryRunner = this.walletService.getDataSource().createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // Save transaction within the transaction context
          await queryRunner.manager.save(transaction);

          // Update wallet balance within the transaction context
          const wallet = await queryRunner.manager.findOne(Wallet, {
            where: { accountNo: menteeWallet.accountNo }
          });
          
          if (!wallet) {
            throw new Error(`Wallet with account number ${menteeWallet.accountNo} not found`);
          }
          
          // Calculate current balance
          const transactions = await queryRunner.manager.find(WalletTransaction, {
            where: { customerAccountNo: menteeWallet.accountNo }
          });
          
          const currentBalance = transactions.reduce((sum, tx) => {
            const drAmount = tx.drAmount || 0;
            const crAmount = tx.crAmount || 0;
            return sum - Number(drAmount) + Number(crAmount);
          }, 0);
          
          // Update wallet balance
          wallet.balance = currentBalance - totalCost;
          await queryRunner.manager.save(wallet);

          // Commit the transaction
          await queryRunner.commitTransaction();
        } catch (error) {
          // Rollback the transaction in case of error
          await queryRunner.rollbackTransaction();
          throw error;
        } finally {
          // Release the query runner
          await queryRunner.release();
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(res.formatResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Error processing payment"));
      }

      const [hours, minutes] = booking.prefer_time.split(':').map(Number);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      const endDate = new Date(startDate.getTime() + booking.duration * 60 * 60 * 1000);

      // Format result as HH:mm
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      const endTime = `${endHours}:${endMinutes}`;

      let zoomLink = await this.conferenceService.createMeeting("Edu-Bridge Virtual classroom");
      const session = new Session();
      session.notes = booking.note;
      session.zoom_start_link = zoomLink.start_url;
      session.zoom_join_link = zoomLink.join_url;
      session.session_date = booking.prefer_date;
      session.startTime = booking.prefer_time;
      session.endTime = endTime;
      session.booking = booking;
      session.mentee = booking.mentee;
      session.mentor = booking.mentor;
      session.mentee_name = this.mergeName(session.mentee.user.firstName, session.mentee.user.lastName);
      session.mentor_name = this.mergeName(session.mentor.user.firstName, session.mentor.user.lastName);
      session.session_subject = booking.subject.id;

      await this.sessionService.create(session);
    }
    await this.service.update(booking);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "OK", booking));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    await this.service.delete(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "successful"));
  }


  private flattenObject(obj, parent = '', res = {}) {
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const propName = key; //parent ? `${parent}_${key}` : key;

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        this.flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  }


  private mergeName(firstname: string, lastname: string) {
    return `${firstname} ${lastname}`;
  }

}
