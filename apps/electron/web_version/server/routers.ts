import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { integrationsRouter } from "./integrations/routes";
import { templatesRouter } from "./integrations/templates-routes";
import { contactRouter } from "./integrations/contact-routes";
import { periodsRouter } from "./routers/periods";
import { schedulesRouter } from "./routers/schedules";
import { eventsRouter } from "./routers/events";
import { trackingRouter } from "./routers/tracking";
import { analysisRouter } from "./routers/analysis";
import { alertsRouter } from "./routers/alerts";
import { dataRetentionRouter } from "./routers/dataRetention";
import { notificationsRouter } from "./routers/notifications";
import { portfolioRouter } from "./routers/portfolio";
import { pythonIntegrationRouter } from "./routers/python_integration";
import { lgpdRightsRouter } from "./routers/lgpd_rights";
import { photoUploadRouter } from "./routers/photo_upload";
import { parentPortalRouter } from "./routers/parent-portal";
import { quotesRouter } from "./routers/quotes";
import { checkoutRouter } from "./routers/checkout";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  integrations: integrationsRouter,
  templates: templatesRouter,
  contact: contactRouter,
  periods: periodsRouter,
  schedules: schedulesRouter,
  events: eventsRouter,
  tracking: trackingRouter,
  analysis: analysisRouter,
  alerts: alertsRouter,
  dataRetention: dataRetentionRouter,
  notifications: notificationsRouter,
  portfolio: portfolioRouter,
  pythonIntegration: pythonIntegrationRouter,
  lgpdRights: lgpdRightsRouter,
  photoUpload: photoUploadRouter,
  parentPortal: parentPortalRouter,
  quotes: quotesRouter,
  checkout: checkoutRouter,
});

export type AppRouter = typeof appRouter;
