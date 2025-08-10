# Wallet Integration for Booking and Session Payment

## Overview

This document describes the implementation of wallet validation and payment processing for the booking and session completion flow in the Edu-Bridge platform.

## Requirements

1. When a mentee tries to book a tutor, the system should validate that the mentee has sufficient funds in their wallet
2. The minimum amount in the mentee's wallet must be equal to or greater than the tutor's rate calculated with the duration set by the mentee for the booking
3. When a booking is confirmed by the mentor, the amount should be debited from the mentee's wallet
4. The amount should not be credited to the tutor's wallet until the session is completed
5. The system should track the payment and credit the tutor once the session is completed

## Implementation

### Booking Creation (Wallet Validation)

In the `BookingController.create` method:

1. When a mentee creates a booking, the system retrieves the mentor's rate per hour
2. The system calculates the total cost based on the mentor's rate and the booking duration
3. The system checks if the mentee has sufficient funds in their wallet
4. If the mentee doesn't have sufficient funds, the booking creation is rejected with an appropriate error message
5. If the mentee has sufficient funds, the booking is created with a 'pending' status

### Booking Confirmation (Debit Mentee's Wallet)

In the `BookingController.update` method:

1. When a mentor confirms a booking (changes status from 'pending' to 'confirmed'), the system calculates the total cost
2. The system debits the mentee's wallet for the total cost
3. The transaction is stored with metadata that includes:
   - The booking ID
   - The mentor's wallet account number
   - The amount
   - A flag indicating that the credit to the mentor is pending
4. A session is created for the booking

### Session Completion (Credit Tutor's Wallet)

In the `SessionController.update` method:

1. When a session is marked as completed, the system finds the booking payment transaction
2. The system extracts the mentor's wallet account number and amount from the transaction metadata
3. The system credits the mentor's wallet with the amount
4. The system updates the original transaction metadata to mark the credit as processed

## Testing

To verify that the implementation works correctly:

1. Create a mentee and mentor with wallets
2. Fund the mentee's wallet with a known amount
3. Create a booking with a duration that results in a cost less than the mentee's wallet balance
   - The booking should be created successfully
4. Create a booking with a duration that results in a cost greater than the mentee's wallet balance
   - The booking creation should be rejected with an "Insufficient funds" error
5. Confirm a booking
   - The mentee's wallet balance should decrease by the booking cost
   - The mentor's wallet balance should remain unchanged
6. Mark a session as completed
   - The mentor's wallet balance should increase by the booking cost

## Edge Cases Handled

1. Mentee without a wallet: The system checks if the mentee has a wallet and rejects the booking if not
2. Mentor without a wallet: The system checks if the mentor has a wallet and rejects the booking confirmation if not
3. Insufficient funds: The system checks if the mentee has sufficient funds and rejects the booking if not
4. Error during payment processing: The system logs errors during payment processing but doesn't fail the session completion