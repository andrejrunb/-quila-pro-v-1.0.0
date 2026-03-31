import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { config } from "../_core/config";
import QRCode from "qrcode";
import Stripe from "stripe";
import * as paypal from "@paypal/checkout-server-sdk";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Initialize SDKs only if keys are present
const stripe = config.payments.stripeSecretKey ? new Stripe(config.payments.stripeSecretKey) : null;

let paypalClient: any = null;
if (config.payments.paypalClientId && config.payments.paypalClientSecret) {
  const environment = config.isProduction 
    ? new paypal.core.LiveEnvironment(config.payments.paypalClientId, config.payments.paypalClientSecret)
    : new paypal.core.SandboxEnvironment(config.payments.paypalClientId, config.payments.paypalClientSecret);
  paypalClient = new paypal.core.PayPalHttpClient(environment);
}

const mpClient = config.payments.mercadopagoAccessToken 
  ? new MercadoPagoConfig({ accessToken: config.payments.mercadopagoAccessToken }) 
  : null;

export const checkoutRouter = router({
  /**
   * Create a Pix Payment (QR Code)
   */
  createPix: publicProcedure
    .input(z.object({
      planId: z.string(),
      amount: z.number(),
      customerName: z.string(),
      customerEmail: z.string(),
      customerCpf: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Logic for MercadoPago Pix or Mock
      if (mpClient) {
        try {
          const payment = new Payment(mpClient);
          const response = await payment.create({
            body: {
              transaction_amount: input.amount,
              description: `Áquila Pro - Plano ${input.planId}`,
              payment_method_id: 'pix',
              payer: {
                email: input.customerEmail,
                first_name: input.customerName.split(' ')[0],
                last_name: input.customerName.split(' ').slice(1).join(' '),
                identification: {
                  type: 'CPF',
                  number: input.customerCpf.replace(/\D/g, ''),
                },
              },
            }
          });
          
          return {
            qrCode: response.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
            paymentId: response.id,
            status: response.status,
          };
        } catch (error) {
          console.error("MP Pix Error:", error);
          throw new Error("Failed to generate Pix QR Code via MercadoPago");
        }
      }

      // Mocked Pix for Demo
      const mockPixPayload = `00020126580014BR.GOV.BCB.PIX0136andrejrunb@yahoo.com.br5204000053039865405${input.amount.toFixed(2)}5802BR5913AQUILA PRO6008BRASILIA62070503***6304`;
      const qrCodeBase64 = await QRCode.toDataURL(mockPixPayload);
      
      return {
        qrCode: mockPixPayload,
        qrCodeBase64,
        paymentId: "mock_" + Math.random().toString(36).substr(2, 9),
        status: "pending",
        isMock: true,
      };
    }),

  /**
   * Create a Stripe Checkout Session (Credit Card)
   */
  createStripeSession: publicProcedure
    .input(z.object({
      planId: z.string(),
      priceId: z.string().optional(),
      amount: z.number(),
    }))
    .mutation(async ({ input }) => {
      if (!stripe) {
        throw new Error("Stripe is not configured on this server.");
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'brl',
              product_data: {
                name: `Áquila Pro - Plano ${input.planId}`,
                description: 'Assinatura Mensal de Segurança Inteligente',
              },
              unit_amount: Math.round(input.amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:3000'}/precos`,
      });

      return { sessionId: session.id, url: session.url };
    }),

  /**
   * Create a PayPal Order
   */
  createPayPalOrder: publicProcedure
    .input(z.object({
      amount: z.number(),
      planId: z.string(),
    }))
    .mutation(async ({ input }) => {
      if (!paypalClient) {
        throw new Error("PayPal is not configured on this server.");
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'BRL',
            value: input.amount.toFixed(2)
          },
          description: `Áquila Pro - Plano ${input.planId}`
        }]
      });

      try {
        const order = await paypalClient.execute(request);
        return { orderId: order.result.id };
      } catch (error) {
        console.error("PayPal Order Error:", error);
        throw new Error("Failed to create PayPal order");
      }
    }),
});
