/** Return whole calendar days from today until the target date. */
export function getDaysRemaining(targetDate: string): number {
  const [year, month, day] = targetDate.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid target date: ${targetDate}`);
  }

  const today = new Date();
  const todayStart = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const targetStart = Date.UTC(year, month - 1, day);

  return Math.ceil((targetStart - todayStart) / 86_400_000);
}

/** True only when the reading's end date has passed and it is still incomplete. */
export function isReadingOverdue(endDate: string, isComplete: boolean): boolean {
  return !isComplete && getDaysRemaining(endDate) < 0;
}
