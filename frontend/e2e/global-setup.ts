import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global setup for E2E tests.
 * Runs the backend seed script to ensure test users exist in the DB
 * before any test tries to log in.
 */
async function globalSetup() {
  const backendDir = path.resolve(__dirname, '../../backend');

  console.log('\n🌱 Running database seed for E2E tests...');
  try {
    execSync('npx prisma db seed', {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (err) {
    console.error('❌ Failed to seed database before E2E tests:', err);
    throw err;
  }
}

export default globalSetup;
