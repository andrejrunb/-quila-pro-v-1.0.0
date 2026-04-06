import { z } from 'zod';

export const cameraSchema = z.object({
  id: z.string().min(1, "O ID da câmera é obrigatório"),
  rtspUrl: z.string().min(1, "A URL de stream RTSP é necessária"),
  name: z.string().min(2, "Nome da câmera muito curto"),
  location: z.string().optional(),
  fps: z.number().int().positive().optional(),
  status: z.enum(['online', 'offline', 'error', 'pending']).optional(),
  resolution: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  type: z.string().optional(),
  lastSeen: z.string().optional(),
  lastError: z.string().optional(),
  enabled: z.number().optional()
});

export const studentImportSchema = z.array(z.object({
  id: z.string().optional(),
  name: z.string().min(3),
  classId: z.string().optional(),
  photoPath: z.string().optional()
}));

export const authLoginSchema = z.object({
  username: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(4),
  role: z.string().optional()
});
