import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, paginatedResponse, ApiError } from '../utils/response';
import { parsePaginationParams } from '../utils/helpers';
import axios from 'axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WANTED_PRICE = 99; // ₹99 per requirement listing (residential)
const WANTED_PRICE_COMMERCIAL = 555; // ₹555 for commercial listings
const ALLOWED_PRICES = [99, 555];
const WANTED_VALIDITY_DAYS = 30;

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

function maskContactInfo(space: any) {
  if (!space.showContact) {
    return {
      ...space,
      contactPhone: space.contactPhone ? '**********' : null,
      contactEmail: space.contactEmail ? '****@****.***' : null,
      contactWhatsapp: space.contactWhatsapp ? '**********' : null,
    };
  }
  return space;
}

// ─── Public: List Published Wanted Spaces ─────────────────────────────────────

export async function listWantedSpaces(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);
    const { category, city, locality, minBudget, maxBudget, requirementType, minArea, maxArea, search } = req.query;

    const where: any = {
      status: { in: ['PUBLISHED', 'PENDING_APPROVAL'] },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (category) where.category = category;
    if (city) where.preferredCity = { contains: city as string, mode: 'insensitive' };
    if (locality) where.preferredLocality = { contains: locality as string, mode: 'insensitive' };
    if (requirementType) where.requirementType = requirementType;
    if (minArea) where.maxArea = { gte: Number(minArea) };
    if (maxArea) where.minArea = { lte: Number(maxArea) };
    if (maxBudget) where.maxRentBudget = { lte: Number(maxBudget) };
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search as string, mode: 'insensitive' } },
        { preferredCity: { contains: search as string, mode: 'insensitive' } },
        { preferredLocality: { contains: search as string, mode: 'insensitive' } },
        { additionalNotes: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [spaces, total] = await Promise.all([
      prisma.wantedSpace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          subcategory: true,
          preferredCity: true,
          preferredLocality: true,
          minArea: true,
          maxArea: true,
          maxRentBudget: true,
          maxLeaseBudget: true,
          requirementType: true,
          occupantsCount: true,
          amenities: true,
          furnishingPreference: true,
          expectedMoveIn: true,
          additionalNotes: true,
          contactName: true,
          contactMethod: true,
          contactPhone: true,
          contactEmail: true,
          contactWhatsapp: true,
          showContact: true,
          categoryExtras: true,
          status: true,
          viewCount: true,
          publishedAt: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      prisma.wantedSpace.count({ where }),
    ]);

    const masked = spaces.map(maskContactInfo);
    res.json(paginatedResponse(masked, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// ─── Public: Get Single Wanted Space ──────────────────────────────────────────

export async function getWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const space = await prisma.wantedSpace.findUnique({ where: { id } });
    if (!space || !['PUBLISHED', 'PENDING_APPROVAL'].includes(space.status)) {
      throw new ApiError(404, 'Requirement not found');
    }

    // Increment view count
    await prisma.wantedSpace.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    res.json(successResponse(maskContactInfo(space)));
  } catch (error) {
    next(error);
  }
}

// ─── User: Create Draft ────────────────────────────────────────────────────────

export async function createWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');

    const {
      title, category, subcategory, preferredCity, preferredLocality,
      minArea, maxArea, maxRentBudget, maxLeaseBudget, requirementType,
      occupantsCount, amenities, furnishingPreference, expectedMoveIn,
      additionalNotes, contactName, contactMethod, contactPhone, contactEmail,
      contactWhatsapp, showContact, categoryExtras, paymentAmount: reqPaymentAmount,
    } = req.body;

    if (!title) throw new ApiError(400, 'Title is required');
    if (!category) throw new ApiError(400, 'Category is required');
    if (!preferredCity) throw new ApiError(400, 'Preferred city is required');
    if (!contactName) throw new ApiError(400, 'Contact name is required');

    // Validate and determine payment amount (₹99 residential, ₹555 commercial)
    const resolvedAmount = ALLOWED_PRICES.includes(Number(reqPaymentAmount))
      ? Number(reqPaymentAmount)
      : WANTED_PRICE;

    const space = await prisma.wantedSpace.create({
      data: {
        userId: req.user.id,
        title,
        category,
        subcategory: subcategory || null,
        preferredCity,
        preferredLocality: preferredLocality || null,
        minArea: minArea ? Number(minArea) : null,
        maxArea: maxArea ? Number(maxArea) : null,
        maxRentBudget: maxRentBudget ? Number(maxRentBudget) : null,
        maxLeaseBudget: maxLeaseBudget ? Number(maxLeaseBudget) : null,
        requirementType: requirementType || 'RENT',
        occupantsCount: occupantsCount ? Number(occupantsCount) : null,
        amenities: Array.isArray(amenities) ? amenities : [],
        furnishingPreference: furnishingPreference || 'ANY',
        expectedMoveIn: expectedMoveIn ? new Date(expectedMoveIn) : null,
        additionalNotes: additionalNotes || null,
        contactName,
        contactMethod: contactMethod || 'phone',
        contactPhone: contactPhone || null,
        contactEmail: contactEmail || null,
        contactWhatsapp: contactWhatsapp || null,
        showContact: Boolean(showContact),
        categoryExtras: categoryExtras ? JSON.stringify(categoryExtras) : null,
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        paymentAmount: resolvedAmount,
        validityDays: WANTED_VALIDITY_DAYS,
      },
    });

    res.status(201).json(successResponse(space, 'Requirement saved.'));
  } catch (error) {
    next(error);
  }
}

// ─── User: Update Draft ────────────────────────────────────────────────────────

export async function updateWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = req.params;

    const space = await prisma.wantedSpace.findFirst({ where: { id, userId: req.user.id } });
    if (!space) throw new ApiError(404, 'Requirement not found');
    if (!['DRAFT', 'REJECTED'].includes(space.status)) {
      throw new ApiError(400, 'Cannot edit a published or fulfilled requirement');
    }

    const {
      title, category, subcategory, preferredCity, preferredLocality,
      minArea, maxArea, maxRentBudget, maxLeaseBudget, requirementType,
      occupantsCount, amenities, furnishingPreference, expectedMoveIn,
      additionalNotes, contactName, contactMethod, contactPhone, contactEmail,
      contactWhatsapp, showContact, categoryExtras,
    } = req.body;

    const updated = await prisma.wantedSpace.update({
      where: { id },
      data: {
        title: title || space.title,
        category: category || space.category,
        subcategory: subcategory !== undefined ? subcategory : space.subcategory,
        preferredCity: preferredCity || space.preferredCity,
        preferredLocality: preferredLocality !== undefined ? preferredLocality : space.preferredLocality,
        minArea: minArea !== undefined ? (minArea ? Number(minArea) : null) : space.minArea,
        maxArea: maxArea !== undefined ? (maxArea ? Number(maxArea) : null) : space.maxArea,
        maxRentBudget: maxRentBudget !== undefined ? (maxRentBudget ? Number(maxRentBudget) : null) : space.maxRentBudget,
        maxLeaseBudget: maxLeaseBudget !== undefined ? (maxLeaseBudget ? Number(maxLeaseBudget) : null) : space.maxLeaseBudget,
        requirementType: requirementType || space.requirementType,
        occupantsCount: occupantsCount !== undefined ? (occupantsCount ? Number(occupantsCount) : null) : space.occupantsCount,
        amenities: amenities !== undefined ? (Array.isArray(amenities) ? amenities : space.amenities) : space.amenities,
        furnishingPreference: furnishingPreference || space.furnishingPreference,
        expectedMoveIn: expectedMoveIn !== undefined ? (expectedMoveIn ? new Date(expectedMoveIn) : null) : space.expectedMoveIn,
        additionalNotes: additionalNotes !== undefined ? additionalNotes : space.additionalNotes,
        contactName: contactName || space.contactName,
        contactMethod: contactMethod || space.contactMethod,
        contactPhone: contactPhone !== undefined ? contactPhone : space.contactPhone,
        contactEmail: contactEmail !== undefined ? contactEmail : space.contactEmail,
        contactWhatsapp: contactWhatsapp !== undefined ? contactWhatsapp : space.contactWhatsapp,
        showContact: showContact !== undefined ? Boolean(showContact) : space.showContact,
        categoryExtras: categoryExtras !== undefined ? (categoryExtras ? JSON.stringify(categoryExtras) : null) : space.categoryExtras,
      },
    });

    res.json(successResponse(updated, 'Requirement updated'));
  } catch (error) {
    next(error);
  }
}

// ─── User: Initiate Payment ────────────────────────────────────────────────────

export async function initiateWantedSpacePayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = req.params;

    const space = await prisma.wantedSpace.findFirst({ where: { id, userId: req.user.id } });
    if (!space) throw new ApiError(404, 'Requirement not found');
    if (!['DRAFT', 'PAYMENT_PENDING', 'REJECTED', 'EXPIRED'].includes(space.status)) {
      throw new ApiError(400, 'Payment not applicable for this requirement');
    }

    // Mark as payment pending
    await prisma.wantedSpace.update({ where: { id }, data: { status: 'PAYMENT_PENDING' } });

    const isTestPaymentBypassEnabled = process.env.WANTED_SPACE_PAYMENT_BYPASS === 'true';

    // Publish immediately when payment is bypassed or the gateway is not configured.
    if (isTestPaymentBypassEnabled || !isCashfreeConfigured()) {
      const publishedAt = new Date();
      const expiresAt = new Date(publishedAt.getTime() + WANTED_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
      await prisma.wantedSpace.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          paymentStatus: isTestPaymentBypassEnabled ? 'PENDING' : 'SUCCESS',
          cfOrderId: isTestPaymentBypassEnabled
            ? null
            : `free_ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          transactionId: isTestPaymentBypassEnabled ? null : `free_ws_${Date.now()}`,
          publishedAt,
          expiresAt,
          rejectionReason: null,
        },
      });
      return res.json({
        success: true,
        isFree: true,
        status: 'PUBLISHED',
        message: 'Requirement published and visible in Wanted Specify.',
      });
    }

    const cfOrderId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const customerId = req.user.id.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const customerName = (req.user.name || 'Customer').replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 50) || 'Customer';
    const customerEmail = req.user.email && req.user.email.includes('@') ? req.user.email : 'customer@veeduvadagaikkuchennai.com';
    let customerPhone = (req.user.mobile || '').replace(/\D/g, '');
    if (customerPhone.length > 10) customerPhone = customerPhone.slice(-10);
    if (customerPhone.length < 10) customerPhone = '9999999999';

    const RETURN_URL =
      `https://www.veeduvadagaikkuchennai.com/wanted-spaces/payment-result` +
      `?order_id={order_id}&wantedSpaceId=${id}`;

    const orderMeta: any = { return_url: RETURN_URL };
    const rawBackendUrl = (process.env.BACKEND_URL || '').trim();
    if (rawBackendUrl.startsWith('https://') && !rawBackendUrl.includes('localhost')) {
      orderMeta.notify_url = `${rawBackendUrl}/api/wanted-spaces/webhook`;
    }

    const cfRes = await axios.post(
      `${getCashfreeBaseUrl()}/orders`,
      {
        order_id: cfOrderId,
        order_amount: space.paymentAmount || WANTED_PRICE,
        order_currency: 'INR',
        order_note: 'Wanted Space Requirement - Veedu Vadagaiku',
        customer_details: {
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: orderMeta,
      },
      { headers: getCashfreeHeaders() }
    );

    const cfData = cfRes.data;
    await prisma.wantedSpace.update({
      where: { id },
      data: { cfOrderId: cfData.order_id || cfOrderId },
    });

    return res.json({
      success: true,
      isFree: false,
      order_id: cfData.order_id,
      cf_order_id: cfData.cf_order_id,
      payment_session_id: cfData.payment_session_id,
      amount: space.paymentAmount || WANTED_PRICE,
      currency: 'INR',
      environment: process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production',
      message: 'Payment order created',
    });
  } catch (error: any) {
    // Reset to DRAFT on payment initiation failure
    const { id } = req.params;
    await prisma.wantedSpace.update({ where: { id }, data: { status: 'DRAFT' } }).catch(() => {});
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(502, error?.response?.data?.message || 'Payment gateway error.'));
  }
}

// ─── User: Verify Payment ──────────────────────────────────────────────────────

export async function verifyWantedSpacePayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { order_id, wantedSpaceId } = req.body;
    if (!order_id) throw new ApiError(400, 'order_id is required');

    // Free bypass
    if (order_id.startsWith('free_')) {
      if (wantedSpaceId) {
        await prisma.wantedSpace.update({
          where: { id: wantedSpaceId },
          data: {
            status: 'PUBLISHED',
            paymentStatus: 'SUCCESS',
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + WANTED_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
            rejectionReason: null,
          },
        }).catch(() => {});
      }
      return res.json({ success: true, status: 'PAID', message: 'Requirement is published in Wanted Specify.' });
    }

    if (!isCashfreeConfigured()) {
      return res.json({ success: true, status: 'PAID', message: 'Payment verified.' });
    }

    const cfRes = await axios.get(
      `${getCashfreeBaseUrl()}/orders/${order_id}`,
      { headers: getCashfreeHeaders() }
    );

    const orderStatus = cfRes.data.order_status;
    if (orderStatus === 'PAID') {
      const space = await prisma.wantedSpace.findFirst({ where: { cfOrderId: order_id } });
      if (space) {
        await prisma.wantedSpace.update({
          where: { id: space.id },
          data: {
            status: 'PUBLISHED',
            paymentStatus: 'SUCCESS',
            transactionId: cfRes.data.cf_order_id?.toString() || order_id,
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + (space.validityDays || WANTED_VALIDITY_DAYS) * 24 * 60 * 60 * 1000),
            rejectionReason: null,
          },
        });
      } else if (wantedSpaceId) {
        await prisma.wantedSpace.update({
          where: { id: wantedSpaceId },
          data: {
            status: 'PUBLISHED',
            paymentStatus: 'SUCCESS',
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + WANTED_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
            rejectionReason: null,
          },
        }).catch(() => {});
      }
      return res.json({ success: true, status: 'PAID', message: 'Payment verified. Requirement is published in Wanted Specify.' });
    } else {
      const space = await prisma.wantedSpace.findFirst({ where: { cfOrderId: order_id } });
      if (space) {
        await prisma.wantedSpace.update({ where: { id: space.id }, data: { status: 'DRAFT', paymentStatus: 'FAILED' } });
      }
      return res.json({ success: false, status: orderStatus, message: `Payment not completed. Status: ${orderStatus}` });
    }
  } catch (error: any) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(502, 'Failed to verify payment.'));
  }
}

// ─── User: My Requirements ─────────────────────────────────────────────────────

export async function myWantedSpaces(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const [spaces, total] = await Promise.all([
      prisma.wantedSpace.findMany({
        where: { userId: req.user.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.wantedSpace.count({ where: { userId: req.user.id } }),
    ]);

    res.json(paginatedResponse(spaces, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// ─── User: Mark as Fulfilled ───────────────────────────────────────────────────

export async function markWantedSpaceFulfilled(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = req.params;

    const space = await prisma.wantedSpace.findFirst({ where: { id, userId: req.user.id } });
    if (!space) throw new ApiError(404, 'Requirement not found');

    await prisma.wantedSpace.update({ where: { id }, data: { status: 'FULFILLED' } });
    res.json(successResponse(null, 'Requirement marked as fulfilled'));
  } catch (error) {
    next(error);
  }
}

// ─── User: Delete Draft ────────────────────────────────────────────────────────

export async function deleteWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = req.params;

    const space = await prisma.wantedSpace.findFirst({ where: { id, userId: req.user.id } });
    if (!space) throw new ApiError(404, 'Requirement not found');
    if (space.status === 'PUBLISHED') {
      throw new ApiError(400, 'Cannot delete a published requirement. Mark it as fulfilled instead.');
    }

    await prisma.wantedSpace.delete({ where: { id } });
    res.json(successResponse(null, 'Requirement deleted'));
  } catch (error) {
    next(error);
  }
}

// ─── User: Renew Listing ───────────────────────────────────────────────────────

export async function renewWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, 'Authentication required');
    const { id } = req.params;

    const space = await prisma.wantedSpace.findFirst({ where: { id, userId: req.user.id } });
    if (!space) throw new ApiError(404, 'Requirement not found');
    if (!['PUBLISHED', 'EXPIRED'].includes(space.status)) {
      throw new ApiError(400, 'Only published or expired requirements can be renewed');
    }

    // Reset to DRAFT for payment
    await prisma.wantedSpace.update({
      where: { id },
      data: {
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        cfOrderId: null,
        transactionId: null,
        expiresAt: null,
        publishedAt: null,
      },
    });

    res.json(successResponse({ id }, 'Requirement reset for renewal. Please proceed to payment.'));
  } catch (error) {
    next(error);
  }
}

// ─── Admin: List All ───────────────────────────────────────────────────────────

export async function adminListWantedSpaces(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);
    const { status, category, search } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { preferredCity: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [spaces, total] = await Promise.all([
      prisma.wantedSpace.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, email: true, mobile: true } } },
      }),
      prisma.wantedSpace.count({ where }),
    ]);

    res.json(paginatedResponse(spaces, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// ─── Admin: Approve ────────────────────────────────────────────────────────────

export async function adminApproveWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const space = await prisma.wantedSpace.findUnique({ where: { id } });
    if (!space) throw new ApiError(404, 'Requirement not found');

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (space.validityDays || 30) * 24 * 60 * 60 * 1000);

    await prisma.wantedSpace.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
        expiresAt,
        rejectionReason: null,
      },
    });

    res.json(successResponse(null, 'Requirement approved and published'));
  } catch (error) {
    next(error);
  }
}

// ─── Admin: Reject ─────────────────────────────────────────────────────────────

export async function adminRejectWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) throw new ApiError(400, 'Rejection reason is required');

    const space = await prisma.wantedSpace.findUnique({ where: { id } });
    if (!space) throw new ApiError(404, 'Requirement not found');

    await prisma.wantedSpace.update({
      where: { id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    res.json(successResponse(null, 'Requirement rejected'));
  } catch (error) {
    next(error);
  }
}

// ─── Admin: Remove ─────────────────────────────────────────────────────────────

export async function adminRemoveWantedSpace(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await prisma.wantedSpace.update({
      where: { id },
      data: { status: 'REMOVED', rejectionReason: reason || 'Removed by admin' },
    });

    res.json(successResponse(null, 'Requirement removed'));
  } catch (error) {
    next(error);
  }
}

// ─── Cashfree Webhook ──────────────────────────────────────────────────────────

export async function wantedSpaceWebhook(req: AuthRequest, res: Response) {
  try {
    const event = req.body;
    const orderId = event?.data?.order?.order_id;
    const orderStatus = event?.data?.order?.order_status;
    const paymentStatus = event?.data?.payment?.payment_status;

    if (orderId && (orderStatus === 'PAID' || paymentStatus === 'SUCCESS')) {
      const space = await prisma.wantedSpace.findFirst({ where: { cfOrderId: orderId } }).catch(() => null);
      if (space) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + (space.validityDays || 30) * 24 * 60 * 60 * 1000);
        await prisma.wantedSpace.update({
          where: { id: space.id },
          data: {
            status: 'PUBLISHED',
            paymentStatus: 'SUCCESS',
            transactionId: event?.data?.payment?.cf_payment_id?.toString() || orderId,
            publishedAt: now,
            expiresAt,
            rejectionReason: null,
          },
        }).catch(() => {});
      }
    }

    return res.json({ received: true });
  } catch {
    return res.json({ received: true });
  }
}

