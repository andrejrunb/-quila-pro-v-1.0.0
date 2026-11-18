import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@aquila/api';
import { createServerTrpcContext } from '@/lib/serverCaller';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createServerTrpcContext(req),
  });

export { handler as GET, handler as POST };
