/**
 * Date utility functions for handling market data timestamps
 */

/**
 * Convert a date to EST timezone with full date and time
 */
export const formatToEST = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });
};

/**
 * Convert a date to EST timezone with only time
 */
export const formatToESTTime = (date: Date | string | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });
};

/**
 * Check if the current time is within market hours (9:30 AM - 4:00 PM EST)
 */
export const isMarketHours = (date: Date | string | number = new Date()): boolean => {
  const d = date instanceof Date ? date : new Date(date);
  const estTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = estTime.getHours();
  const minutes = estTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;
  
  // Market hours: 9:30 AM - 4:00 PM EST
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;     // 4:00 PM
  
  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
};

/**
 * Check if the market is open (considers weekends and holidays)
 * Note: This is a basic implementation. For production, you should:
 * 1. Add a proper holiday calendar
 * 2. Consider pre/post market hours
 * 3. Handle special trading days
 */
export const isMarketOpen = (date: Date | string | number = new Date()): boolean => {
  const d = date instanceof Date ? date : new Date(date);
  const estTime = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  // Check if it's weekend
  const day = estTime.getDay();
  if (day === 0 || day === 6) return false; // Sunday = 0, Saturday = 6
  
  return isMarketHours(estTime);
}; 