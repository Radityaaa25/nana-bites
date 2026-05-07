import fs from 'fs';
import path from 'path';

export function getDbPath(filename: string) {
  return path.join(process.cwd(), 'data', filename);
}

export function readDb<T>(filename: string): T[] {
  try {
    const filePath = getDbPath(filename);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
}

export function writeDb<T>(filename: string, data: T[]): void {
  try {
    const filePath = getDbPath(filename);
    // Ensure data directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${filename}:`, error);
  }
}
