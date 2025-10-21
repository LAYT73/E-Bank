import { ValidationError } from '@/shared/errors';

/**  '2025-07-11T08:44:19.109Z' => "08:44" */
export function formatISOToTime(isoString: string): string {
  if (!isoString) {
    throw new ValidationError('Input string is empty');
  }

  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new ValidationError('Invalid date string');
  }

  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}
