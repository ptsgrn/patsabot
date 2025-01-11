/**
 * Converts a human-readable file size string into bytes.
 *
 * @param size - The human-readable file size string (e.g., '5MB', '1.2GB').
 * @returns The size in bytes.
 * @throws Will throw an error if the input size format is invalid.
 *
 * @example
 * ```typescript
 * humanReadableToBytes('5MB'); // Returns 5242880
 * humanReadableToBytes('1.2GB'); // Returns 1288490188.8
 * ```
 */
export function humanReadableToBytes(size: string) {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
    TB: 1024 ** 4,
    PB: 1024 ** 5,
  };

  const regex = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB|PB)$/i;
  const match = size.match(regex);

  if (!match) {
    throw new Error("Invalid size format. Example of valid input: '5MB', '1.2GB'.");
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase() as keyof typeof units;

  return value * (units[unit] || 0);
}