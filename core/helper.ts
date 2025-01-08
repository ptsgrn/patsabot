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