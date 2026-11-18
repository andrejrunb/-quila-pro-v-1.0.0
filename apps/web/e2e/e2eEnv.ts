import path from 'path';

export const E2E_PORT = 3109;
export const E2E_BASE_URL = `http://127.0.0.1:${E2E_PORT}`;
export const E2E_DB_PATH = path.resolve(__dirname, '..', '.next', 'e2e-aquila.db');

export const E2E_CREDENTIALS = {
  teacher: {
    username: 'prof.ricardo',
    password: 'E2E-Teacher-Strong-2026!',
  },
  parent: {
    username: 'pais.patricia',
    password: 'E2E-Parent-Strong-2026!',
  },
  student: {
    username: 'aluno.lucas',
    password: 'E2E-Student-Strong-2026!',
  },
  coordinator: {
    username: 'coord.juliana',
    password: 'E2E-Coord-Strong-2026!',
  },
  admin: {
    username: 'admin.ricardo',
    password: 'E2E-Admin-Strong-2026-Secret!',
  },
} as const;
