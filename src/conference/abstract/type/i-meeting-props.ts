export interface IMeetingProps {
  topic: string;
  type: number; // 1 for instant meeting, 2 for scheduled meeting
  start_time?: string; // ISO 8601 format
  duration?: number; // in minutes
  timezone?: string;
  password?: string;
  agenda?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    approval_type?: number; // 0 for auto, 1 for manual
    waiting_room?: boolean;
    audio?: string; // 'both', 'telephony', 'voip'
    alternative_hosts?: string; // comma-separated emails
  };
}