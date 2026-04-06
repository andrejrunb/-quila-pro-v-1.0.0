import "dotenv/config";

/**
 * Global Configuration for Áquila Pro Web Server
 */
export const config = {
  // Admin Contact
  adminEmail: process.env.ADMIN_EMAIL || "andrejrunb@yahoo.com.br",
  adminName: process.env.ADMIN_NAME || "Andrej",
  
  // Notification Settings
  notificationEmail: process.env.NOTIFICATION_EMAIL || "alertas@aquilapro.manus.space",
  
  // Payment Gateway Settings
  payments: {
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    
    paypalEnabled: !!process.env.PAYPAL_CLIENT_ID,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    
    mercadopagoEnabled: !!process.env.MP_ACCESS_TOKEN,
    mercadopagoAccessToken: process.env.MP_ACCESS_TOKEN,
    
    pixEnabled: true, // Always available via QR Code simulation if keys missing
  },
  
  // Security
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
  
  // Environment
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000"),
};
