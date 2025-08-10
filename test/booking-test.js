/**
 * Test script for booking functionality
 * 
 * This script tests the updated booking functionality to ensure:
 * 1. Multiple mentees can book the same mentor on different times
 * 2. Bookings are only allowed on days set by the mentor
 * 3. No conflicts between mentees booking the same mentor
 */

const axios = require('axios');
const baseUrl = 'http://localhost:5000/api';
const token = 'YOUR_AUTH_TOKEN'; // Replace with a valid token

// Test data
const mentorId = 'MENTOR_ID'; // Replace with a valid mentor ID
const menteeId1 = 'MENTEE_ID_1'; // Replace with a valid mentee ID
const menteeId2 = 'MENTEE_ID_2'; // Replace with a valid mentee ID
const slotId = 'SLOT_ID'; // Replace with a valid slot ID
const subjectId = 'SUBJECT_ID'; // Replace with a valid subject ID

// Helper function to create a booking
async function createBooking(menteeId, mentorId, slotId, date, time, duration) {
  try {
    const response = await axios.post(`${baseUrl}/booking`, {
      mentee: menteeId,
      mentor: mentorId,
      slot: slotId,
      subject: subjectId,
      prefer_date: date,
      prefer_time: time,
      duration: duration,
      note: 'Test booking'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Booking created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating booking:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test 1: Create a booking on a valid day and time
async function test1() {
  console.log('\n--- Test 1: Create a booking on a valid day and time ---');
  // Assuming the mentor has a slot on Monday from 10:00 to 16:00
  // August 12, 2025 is a Monday
  const result = await createBooking(
    menteeId1,
    mentorId,
    slotId,
    '2025-08-12', // Monday
    '10:00:00',
    2 // 2 hours
  );
  
  return result !== null;
}

// Test 2: Try to create a booking on an invalid day
async function test2() {
  console.log('\n--- Test 2: Try to create a booking on an invalid day ---');
  // Assuming the mentor has a slot on Monday from 10:00 to 16:00
  // August 13, 2025 is a Tuesday
  const result = await createBooking(
    menteeId1,
    mentorId,
    slotId,
    '2025-08-13', // Tuesday
    '10:00:00',
    2 // 2 hours
  );
  
  // This should fail, so we expect result to be null
  return result === null;
}

// Test 3: Try to create a booking outside the time range
async function test3() {
  console.log('\n--- Test 3: Try to create a booking outside the time range ---');
  // Assuming the mentor has a slot on Monday from 10:00 to 16:00
  const result = await createBooking(
    menteeId1,
    mentorId,
    slotId,
    '2025-08-12', // Monday
    '17:00:00', // Outside the time range
    2 // 2 hours
  );
  
  // This should fail, so we expect result to be null
  return result === null;
}

// Test 4: Create a second booking that doesn't overlap with the first
async function test4() {
  console.log('\n--- Test 4: Create a second booking that doesn\'t overlap with the first ---');
  // First booking is on Monday from 10:00 to 12:00
  // Create a second booking on the same day from 13:00 to 15:00
  const result = await createBooking(
    menteeId2,
    mentorId,
    slotId,
    '2025-08-12', // Monday
    '13:00:00',
    2 // 2 hours
  );
  
  return result !== null;
}

// Test 5: Try to create a booking that overlaps with an existing booking
async function test5() {
  console.log('\n--- Test 5: Try to create a booking that overlaps with an existing booking ---');
  // First booking is on Monday from 10:00 to 12:00
  // Try to create a booking from 11:00 to 13:00
  const result = await createBooking(
    menteeId2,
    mentorId,
    slotId,
    '2025-08-12', // Monday
    '11:00:00',
    2 // 2 hours
  );
  
  // This should fail, so we expect result to be null
  return result === null;
}

// Run all tests
async function runTests() {
  const results = {
    test1: await test1(),
    test2: await test2(),
    test3: await test3(),
    test4: await test4(),
    test5: await test5()
  };
  
  console.log('\n--- Test Results ---');
  console.log('Test 1 (Valid booking): ' + (results.test1 ? 'PASS' : 'FAIL'));
  console.log('Test 2 (Invalid day): ' + (results.test2 ? 'PASS' : 'FAIL'));
  console.log('Test 3 (Outside time range): ' + (results.test3 ? 'PASS' : 'FAIL'));
  console.log('Test 4 (Non-overlapping booking): ' + (results.test4 ? 'PASS' : 'FAIL'));
  console.log('Test 5 (Overlapping booking): ' + (results.test5 ? 'PASS' : 'FAIL'));
  
  const allPassed = Object.values(results).every(result => result);
  console.log('\nOverall: ' + (allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});