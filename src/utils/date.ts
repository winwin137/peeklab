import { Timestamp } from 'firebase/firestore';

export const convertFirebaseTime = (fbTimestamp: Timestamp | number | null | undefined): string => {
  if (!fbTimestamp || fbTimestamp === 0) return 'Not started';
  
  try {
    // If it's already a number (milliseconds), convert to Date
    const date = typeof fbTimestamp === 'number' 
      ? new Date(fbTimestamp)
      : fbTimestamp instanceof Timestamp 
        ? fbTimestamp.toDate()
        : new Date(fbTimestamp);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', fbTimestamp);
      return 'Not started';
    }
    
    // Format for Eastern Time with options
    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error converting timestamp:', error);
    return 'Not started';
  }
}; 