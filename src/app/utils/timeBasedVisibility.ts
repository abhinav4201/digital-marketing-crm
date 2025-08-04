// A helper function to check for prime numbers
const isPrime = (num: number): boolean => {
  if (num <= 1) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
};

export const shouldShowDynamicCTA = (): boolean => {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay(); // Sunday = 0, Saturday = 6

  // Get the day of the year (1-366)
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Use the day of the year to pick a pattern for today
  const patternIndex = dayOfYear % 5;

  switch (patternIndex) {
    // Pattern 1: Even/Odd Day (Alternate Days)
    case 0:
      return dayOfMonth % 2 === 0;

    // Pattern 2: Weekend Special
    case 1:
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

    // Pattern 3: First Week of the Month
    case 2:
      return dayOfMonth <= 7;

    // Pattern 4: Prime Number Day
    case 3:
      return isPrime(dayOfMonth);

    // Pattern 5: Every Third Day
    case 4:
      return dayOfMonth % 3 === 0;

    default:
      return false;
  }
};
