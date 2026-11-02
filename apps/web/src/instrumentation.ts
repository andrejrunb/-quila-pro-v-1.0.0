import { getAuthSecret } from './lib/session';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    getAuthSecret();
  }
}
