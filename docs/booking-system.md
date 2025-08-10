# Booking System Documentation

## Overview

The EduBridge booking system allows mentees to book sessions with mentors based on the mentors' availability. The system has been enhanced to support multiple bookings per mentor while ensuring there are no scheduling conflicts.

## Key Components

### Availability Slots

Mentors define their availability by creating slots with:
- Day of the week (e.g., Monday, Tuesday)
- Start time
- End time

Each mentor can have one slot per day of the week.

### Bookings

Mentees create bookings with:
- Preferred date
- Preferred time
- Duration
- Subject
- Notes

## Validation Rules

The booking system enforces the following validation rules:

1. **Day Validation**: The mentee's preferred date must fall on a day of the week for which the mentor has created an availability slot.

2. **Time Range Validation**: The mentee's preferred time and duration must fall within the mentor's availability time range for that day.

3. **Overlap Prevention**: Bookings cannot overlap with existing confirmed bookings for the same mentor on the same date.

## Implementation Details

### Conflict Checking

The system checks for conflicts by:

1. Validating that the preferred date falls on the day of week specified in the slot:
   ```typescript
   const preferredDate = new Date(prefer_date);
   const dayOfWeek = this.getDayOfWeek(preferredDate);
   
   if (dayOfWeek !== existingSlot.day) {
     throw new Error(`Selected date must be on ${existingSlot.day}, but it's on ${dayOfWeek}`);
   }
   ```

2. Validating that the preferred time and duration fall within the slot's time range:
   ```typescript
   const slotStartTime = this.parseTime(existingSlot.startTime);
   const slotEndTime = this.parseTime(existingSlot.endTime);
   const preferredStartTime = this.parseTime(prefer_time);
   const preferredEndTime = this.calculateEndTime(preferredStartTime, duration);

   if (preferredStartTime < slotStartTime || preferredEndTime > slotEndTime) {
     throw new Error(`Selected time and duration must be within the slot's time range (${existingSlot.startTime} - ${existingSlot.endTime})`);
   }
   ```

3. Checking for overlapping bookings with the same mentor on the same date and time:
   ```typescript
   const overlappingBookings = await this.bookingRepository.find({
     where: {
       mentor: { id: mentor?.id ?? mentor },
       prefer_date: prefer_date,
       status: "confirmed"
     },
     relations: ['mentor'],
   });

   for (const booking of overlappingBookings) {
     const bookingStartTime = this.parseTime(booking.prefer_time);
     const bookingEndTime = this.calculateEndTime(bookingStartTime, booking.duration);

     // Check if the new booking overlaps with an existing booking
     if (
       (preferredStartTime >= bookingStartTime && preferredStartTime < bookingEndTime) ||
       (preferredEndTime > bookingStartTime && preferredEndTime <= bookingEndTime) ||
       (preferredStartTime <= bookingStartTime && preferredEndTime >= bookingEndTime)
     ) {
       throw new Error(`Time slot already booked from ${booking.prefer_time} to ${this.formatTime(bookingEndTime)}`);
     }
   }
   ```

### Helper Functions

The implementation includes several helper functions:

1. `getDayOfWeek(date)`: Gets the day of week from a date
2. `parseTime(timeString)`: Parses time string (HH:MM:SS) to minutes since midnight
3. `calculateEndTime(startTimeMinutes, durationHours)`: Calculates end time based on start time and duration
4. `formatTime(timeMinutes)`: Formats minutes since midnight to time string (HH:MM)

## Testing

A test script (`test/booking-test.js`) is provided to verify the functionality of the booking system. The script includes tests for:

1. Creating a booking on a valid day and time
2. Attempting to create a booking on an invalid day
3. Attempting to create a booking outside the time range
4. Creating a second booking that doesn't overlap with the first
5. Attempting to create a booking that overlaps with an existing booking

To run the tests:

1. Ensure the application is running
2. Update the test script with valid IDs and token
3. Run the script with Node.js:
   ```
   node test/booking-test.js
   ```

## Example Usage

### Creating an Availability Slot (Mentor)

```typescript
// Create an availability slot for Monday from 10:00 to 16:00
const slot = new AvailabilitySlot();
slot.mentor = mentorId;
slot.day = 'Monday';
slot.startTime = '10:00:00';
slot.endTime = '16:00:00';
await availabilitySlotService.create(slot);
```

### Creating a Booking (Mentee)

```typescript
// Create a booking for Monday, August 12, 2025 from 10:00 to 12:00
const booking = new Booking();
booking.mentee = menteeId;
booking.mentor = mentorId;
booking.slot = slotId;
booking.subject = subjectId;
booking.prefer_date = '2025-08-12'; // Monday
booking.prefer_time = '10:00:00';
booking.duration = 2; // 2 hours
booking.note = 'I need help with JavaScript';
await bookingService.create(booking);
```

## Conclusion

The enhanced booking system allows for efficient scheduling of mentoring sessions by:
- Allowing mentors to define their availability by day and time range
- Allowing mentees to book specific dates and times within the mentor's availability
- Supporting multiple bookings per mentor as long as they don't overlap
- Preventing scheduling conflicts through comprehensive validation