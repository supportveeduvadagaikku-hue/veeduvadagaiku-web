import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, ApiError } from '../utils/response';
import axios from 'axios';
import { sendPropertyRegistrationWhatsApp } from '../services/whatsapp.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCashfreeHeaders() {
  return {
    'x-client-id': process.env.CASHFREE_APP_ID || '',
    'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
    'x-api-version': '2023-08-01',
    'Content-Type': 'application/json',
  };
}

function getCashfreeBaseUrl() {
  return process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

function isCashfreeConfigured(): boolean {
  const appId = process.env.CASHFREE_APP_ID || '';
  const secret = process.env.CASHFREE_SECRET_KEY || '';
  return Boolean(appId && secret && !appId.startsWith('your_') && !secret.startsWith('your_'));
}

// ─── Free Order Handler ────────────────────────────────────────────────────────

/**
 * Handle free order creation — bypasses payment gateway entirely.
 * Sets property to PENDING_APPROVAL for admin review.
 */
async function handleFreeOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { propertyId, planId, currency = 'INR' } = req.body;
    let property: any = null;
    let owner: any = null;

    if (propertyId) {
      if (req.user) {
        owner = await prisma.owner.findUnique({ where: { userId: req.user.id } });
        if (owner) {
          property = await prisma.property.findFirst({ where: { id: propertyId, ownerId: owner.id } });
        }
      }
      if (!property) {
        property = await prisma.property.findUnique({ where: { id: propertyId } });
      }

      if (property) {
        await prisma.property.update({
          where: { id: property.id },
          data: { status: 'PENDING_APPROVAL', rejectionReason: null },
        });

        if (req.user && owner) {
          const freeOrderId = `free_listing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await prisma.payment.create({
            data: {
              userId: req.user.id,
              ownerId: owner.id,
              propertyId: property.id,
              planId: planId || 'plan_free',
              amount: 0,
              currency: currency || 'INR',
              cfOrderId: freeOrderId,
              transactionId: `free_${Date.now()}`,
              paymentMethod: 'FREE_LISTING',
              paymentStatus: 'SUCCESS',
            },
          }).catch(() => {});
        }
      }
    }

    const freeOrderId = `free_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return res.status(200).json({
      success: true,
      isFree: true,
      status: 'PAID',
      order_id: freeOrderId,
      id: freeOrderId,
      cf_order_id: freeOrderId,
      amount: 0,
      currency: currency || 'INR',
      message: 'Property listing submitted for admin review successfully (100% Free Listing).',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle verification for free listings — always succeeds.
 */
async function handleFreeVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const { propertyId, order_id, orderId } = req.body;
    if (propertyId) {
      await prisma.property.update({
        where: { id: propertyId },
        data: { status: 'PENDING_APPROVAL' },
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      status: 'PAID',
      message: 'Property listing confirmed for admin review (100% Free).',
      order_id: order_id || orderId || 'free_order',
    });
  } catch (error) {
    next(error);
  }
}

// ─── Cashfree Real Payment ─────────────────────────────────────────────────────

/**
 * Create a Cashfree payment order for a paid listing plan.
 * If plan amount is 0 or Cashfree is not configured, falls back to free handler.
 */
export async function createCashfreeOrder(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { propertyId, planId, currency = 'INR' } = req.body;

    // Resolve plan amount from DB
    let planAmount = 0;
    let planName = 'Listing Plan';
    if (planId) {
      const plan = await prisma.listingPlan.findUnique({ where: { id: planId } });
      if (plan) {
        planAmount = plan.price;
        planName = plan.name;
      }
    }

    // If free plan or Cashfree not configured → bypass
    if (planAmount === 0 || !isCashfreeConfigured()) {
      return handleFreeOrder(req, res, next);
    }

    // Auth required for paid plans
    if (!req.user) {
      throw new ApiError(401, 'Authentication required for paid plans');
    }

    let owner = await prisma.owner.findUnique({ where: { userId: req.user.id } });
    if (!owner) {
      owner = await prisma.owner.create({ data: { userId: req.user.id } });
    }

    // Unique order ID (alphanumeric + underscore/hyphen, max 45 chars)
    const cfOrderId = `vv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Customer info strictly validated for Cashfree PG
    const customerId = (req.user.id || `cust_${Date.now()}`).toString().replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const rawName = (req.user as any).name || (req.user as any).displayName || req.user.email?.split('@')[0] || 'Customer';
    const customerName = rawName.replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 50) || 'Customer';
    const customerEmail = req.user.email && req.user.email.includes('@') ? req.user.email : 'customer@veeduvadagaikkuchennai.com';
    let customerPhone = ((req.user as any).mobile || (req.user as any).phone || '').toString().replace(/\D/g, '');
    if (customerPhone.length > 10) customerPhone = customerPhone.slice(-10);
    if (customerPhone.length < 10) customerPhone = '9999999999';

    // ─── return_url: ALWAYS use the hardcoded production frontend URL ──────────
    // NEVER read FRONTEND_URL from environment — it may be set to localhost.
    // Cashfree PG strictly requires HTTPS and rejects any localhost/http URL.
    const CASHFREE_RETURN_URL =
      `https://www.veeduvadagaikkuchennai.com/payment-result` +
      `?order_id={order_id}&propertyId=${propertyId || ''}`;

    // notify_url: only send if BACKEND_URL is a real HTTPS production URL
    const orderMeta: any = {
      return_url: CASHFREE_RETURN_URL,
    };
    const rawBackendUrl = (process.env.BACKEND_URL || '').trim();
    if (rawBackendUrl.startsWith('https://') && !rawBackendUrl.includes('localhost')) {
      orderMeta.notify_url = `${rawBackendUrl}/api/payments/webhook`;
    }

    const safeNote = `${planName.replace(/[^a-zA-Z0-9 ]/g, '')} - Listing on Veedu Vadagaiku`.substring(0, 50);

    // ── Pre-request log (no secrets) — confirms exact URL sent to Cashfree ──
    console.log('[Cashfree] Creating order:', {
      order_id: cfOrderId,
      amount: planAmount,
      return_url: CASHFREE_RETURN_URL,
      notify_url: orderMeta.notify_url || '(not set)',
    });

    // Call Cashfree Orders REST API
    const cashfreePayload = {
      order_id: cfOrderId,
      order_amount: planAmount,
      order_currency: currency,
      order_note: safeNote,
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: orderMeta,
    };

    const cfRes = await axios.post(
      `${getCashfreeBaseUrl()}/orders`,
      cashfreePayload,
      { headers: getCashfreeHeaders() }
    );

    const cfData = cfRes.data;

    // Record pending payment in DB
    await prisma.payment.create({
      data: {
        userId: req.user.id,
        ownerId: owner.id,
        propertyId: propertyId || '',
        planId: planId || 'unknown',
        amount: planAmount,
        currency,
        cfOrderId: cfData.order_id || cfOrderId,
        transactionId: cfData.cf_order_id?.toString() || '',
        paymentMethod: 'CASHFREE',
        paymentStatus: 'PENDING',
      },
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      isFree: false,
      order_id: cfData.order_id,
      cf_order_id: cfData.cf_order_id,
      payment_session_id: cfData.payment_session_id,
      amount: planAmount,
      currency,
      environment: process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production',
      message: 'Cashfree order created successfully',
    });
  } catch (error: any) {
    console.error('[Cashfree] Order creation error:', error?.response?.data || error.message);
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(502, error?.response?.data?.message || 'Payment gateway error. Please try again.'));
  }
}

/**
 * Verify Cashfree payment after checkout — checks order status with Cashfree API.
 */
export async function verifyCashfreePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { order_id, orderId, propertyId } = req.body;
    const resolvedOrderId = order_id || orderId;

    if (!resolvedOrderId) throw new ApiError(400, 'order_id is required for verification');

    // Free order bypass
    if (resolvedOrderId.startsWith('free_')) {
      if (propertyId) {
        await prisma.property.update({
          where: { id: propertyId },
          data: { status: 'PENDING_APPROVAL' },
        }).catch(() => {});
      }
      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'Free listing confirmed.',
        order_id: resolvedOrderId,
      });
    }

    // Cashfree not configured
    if (!isCashfreeConfigured()) {
      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'Payment verified.',
        order_id: resolvedOrderId,
      });
    }

    // Query Cashfree for order status
    const cfRes = await axios.get(
      `${getCashfreeBaseUrl()}/orders/${resolvedOrderId}`,
      { headers: getCashfreeHeaders() }
    );

    const cfOrder = cfRes.data;
    const orderStatus = cfOrder.order_status; // PAID, ACTIVE, EXPIRED, etc.

    if (orderStatus === 'PAID') {
      const newlyPaid = await prisma.payment.updateMany({
        where: { cfOrderId: resolvedOrderId, paymentStatus: 'PENDING' },
        data: {
          paymentStatus: 'SUCCESS',
          transactionId: cfOrder.cf_order_id?.toString() || resolvedOrderId,
        },
      }).catch(() => {});

      const paymentRecord = await prisma.payment.findFirst({
        where: { cfOrderId: resolvedOrderId },
        include: { user: { select: { name: true, mobile: true } }, property: { select: { title: true } } },
      }).catch(() => null);
      const targetPropertyId = propertyId || paymentRecord?.propertyId;

      if (targetPropertyId) {
        await prisma.property.update({
          where: { id: targetPropertyId },
          data: { status: 'PENDING_APPROVAL', rejectionReason: null },
        }).catch(() => {});
      }

      if (newlyPaid && newlyPaid.count > 0 && paymentRecord) {
        void sendPropertyRegistrationWhatsApp({
          phone: paymentRecord.user.mobile,
          ownerName: paymentRecord.user.name,
          propertyTitle: paymentRecord.property.title,
        });
      }

      return res.status(200).json({
        success: true,
        status: 'PAID',
        message: 'Payment verified! Property submitted for admin review.',
        order_id: resolvedOrderId,
      });
    } else {
      await prisma.payment.updateMany({
        where: { cfOrderId: resolvedOrderId },
        data: { paymentStatus: 'FAILED' },
      }).catch(() => {});

      return res.status(200).json({
        success: false,
        status: orderStatus,
        message: `Payment not completed. Status: ${orderStatus}`,
        order_id: resolvedOrderId,
      });
    }
  } catch (error: any) {
    console.error('[Cashfree] Verify error:', error?.response?.data || error.message);
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(502, 'Failed to verify payment status. Please contact support.'));
  }
}

// ─── Razorpay (kept as free bypass — Cashfree is primary) ────────────────────

export async function createRazorpayOrder(req: AuthRequest, res: Response, next: NextFunction) {
  return handleFreeOrder(req, res, next);
}

export async function verifyRazorpayPayment(req: Request, res: Response, next: NextFunction) {
  return handleFreeVerify(req, res, next);
}

export const createOrder = createRazorpayOrder;
export const verifyPayment = verifyRazorpayPayment;

// ─── Cashfree Webhook ─────────────────────────────────────────────────────────

/**
 * Cashfree webhook for async payment notifications.
 * Cashfree sends POST to /api/payments/webhook on payment events.
 */
export async function cashfreeWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    console.log('[Cashfree Webhook]', JSON.stringify(event, null, 2));

    const orderId = event?.data?.order?.order_id;
    const orderStatus = event?.data?.order?.order_status;
    const paymentStatus = event?.data?.payment?.payment_status;

    if (orderId && (orderStatus === 'PAID' || paymentStatus === 'SUCCESS')) {
      const newlyPaid = await prisma.payment.updateMany({
        where: { cfOrderId: orderId, paymentStatus: 'PENDING' },
        data: { paymentStatus: 'SUCCESS' },
      }).catch(() => {});

      const paymentRecord = await prisma.payment.findFirst({
        where: { cfOrderId: orderId },
        include: { user: { select: { name: true, mobile: true } }, property: { select: { title: true } } },
      }).catch(() => null);

      if (paymentRecord?.propertyId) {
        await prisma.property.update({
          where: { id: paymentRecord.propertyId },
          data: { status: 'PENDING_APPROVAL', rejectionReason: null },
        }).catch(() => {});
      }

      if (newlyPaid && newlyPaid.count > 0 && paymentRecord) {
        void sendPropertyRegistrationWhatsApp({
          phone: paymentRecord.user.mobile,
          ownerName: paymentRecord.user.name,
          propertyTitle: paymentRecord.property.title,
        });
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[Cashfree Webhook] Error:', err);
    return res.json({ received: true });
  }
}

// ─── Payment History ──────────────────────────────────────────────────────────

/**
 * Payment history for authenticated owner
 */
export async function getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const payments = await prisma.payment.findMany({
      where: { ownerId: owner.id },
      include: {
        property: { select: { id: true, title: true, locality: true } },
        plan: { select: { name: true, durationDays: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(payments));
  } catch (error) {
    next(error);
  }
}
