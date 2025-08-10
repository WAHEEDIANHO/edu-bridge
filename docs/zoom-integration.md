# Zoom SDK Integration

This document describes the integration of the Zoom SDK into the EduBridge application, which enables video conferencing between mentors and mentees.

## Overview

The Zoom SDK integration allows users to:
- Create Zoom meetings when a booking is confirmed
- Join Zoom meetings directly from the application
- Experience different interfaces based on their role (mentor or mentee)

## Architecture

The integration consists of several components:

1. **Conference Service**: Handles the creation of Zoom meetings and generation of signatures for the Zoom SDK
2. **Session Controller**: Provides endpoints for accessing session details and joining Zoom meetings
3. **Frontend Interface**: Embeds the Zoom Web SDK to provide a seamless video conferencing experience

## Configuration

### Environment Variables

The following environment variables need to be set in the `.env` file:

```
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_HOST_EMAIL=your_zoom_host_email
```

These credentials are obtained from the Zoom Developer Portal by creating a Server-to-Server OAuth app.

## API Endpoints

### Conference Endpoints

- `POST /api/conference/create`: Creates a new Zoom meeting
- `GET /api/conference/signature`: Generates a signature for the Zoom SDK

### Session Endpoints

- `GET /api/session/:id/zoom`: Retrieves Zoom meeting details for a specific session
- `GET /api/session/:id/join`: Redirects to the Zoom meeting interface for a specific session

## User Flow

1. A mentor confirms a booking, which triggers the creation of a Zoom meeting
2. The Zoom meeting details (join URL and start URL) are stored in the session record
3. Users can access their sessions and join Zoom meetings through the application
4. When joining a meeting, users are redirected to the Zoom meeting interface
5. The interface fetches the session details and initializes the Zoom SDK
6. Mentors join as hosts, while mentees join as participants

## Frontend Implementation

The Zoom meeting interface is implemented in `public/zoom-meeting.html`. This file:

1. Loads the Zoom Web SDK and its dependencies
2. Fetches session details from the backend
3. Initializes the Zoom SDK with the appropriate parameters
4. Provides a user-friendly interface with loading and error states

## Security Considerations

1. Authentication is required to access Zoom meeting details
2. Role-based access control ensures users can only access their own sessions
3. Zoom meeting signatures are generated on the server side to prevent tampering
4. The Zoom client secret is never exposed to the frontend

## Troubleshooting

Common issues and their solutions:

1. **Meeting creation fails**: Check the Zoom API credentials in the environment variables
2. **Unable to join meeting**: Ensure the user is authenticated and has permission to access the session
3. **Zoom interface doesn't load**: Check the browser console for errors and ensure the Zoom SDK is loaded correctly

## Future Improvements

1. Add support for recording meetings
2. Implement meeting scheduling and reminders
3. Add support for breakout rooms and other advanced Zoom features
4. Improve the user interface for a more seamless experience