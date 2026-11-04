import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, paginatedResponse, ApiError } from '../utils/response';
import { rejectPropertySchema } from '../utils/validators';
import { parsePaginationParams } from '../utils/helpers';
import { resolvePlanValidityDays, calculateExpiryDate } from '../services/validity.service';
import { notifyPropertyApproved, notifyPropertyRejected } from '../services/ownerNotification.service';

export async function getDashboardStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers, totalOwners, propertyStats, totalPayments, totalRevenue,
      recentProperties, recentPayments, recentUsers, pendingApprovals,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'OWNER' } }),
      prisma.property.groupBy({ by: ['status'], _count: true }),
      prisma.payment.count({ where: { paymentStatus: 'SUCCESS' } }),
      prisma.payment.aggregate({ where: { paymentStatus: 'SUCCESS' }, _sum: { amount: true } }),
      prisma.property.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { displayOrder: 'asc' } }, owner: { include: { user: { select: { name: true } } } } },
      }),
      prisma.payment.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        include: { plan: { select: { name: true } }, property: { select: { title: true } }, user: { select: { name: true } } },
      }),
      prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, mobile: true, role: true, createdAt: true } }),
      prisma.property.count({ where: { status: 'PENDING_APPROVAL' } }),
    ]);

    const propByStatus: Record<string, number> = {};
    propertyStats.forEach((s) => { propByStatus[s.status] = s._count; });

    res.json(successResponse({
      users: { total: totalUsers + totalOwners, owners: totalOwners, tenants: totalUsers },
      properties: { total: Object.values(propByStatus).reduce((a, b) => a + b, 0), ...propByStatus, pendingApprovals },
      payments: { total: totalPayments, revenue: totalRevenue._sum.amount || 0 },
      recentProperties, recentPayments, recentUsers,
    }));
  } catch (error) {
    next(error);
  }
}

export async function adminListUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, role, status } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { mobile: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, mobile: true, role: true, status: true, createdAt: true,
          _count: { select: { enquiries: true, favourites: true } } },
      }),
      prisma.user.count({ where }),
    ]);
    res.json(paginatedResponse(users, total, page, limit));
  } catch (error) {
    next(error);
  }
}

export async function adminUpdateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) throw new ApiError(400, 'Invalid status');

    await prisma.user.update({ where: { id }, data: { status } });
    res.json(successResponse(null, `User ${status.toLowerCase()}`));
  } catch (error) {
    next(error);
  }
}

export async function adminListOwners(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { mobile: { contains: search as string } },
        ],
      };
    }

    const [owners, total] = await Promise.all([
      prisma.owner.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, mobile: true, status: true, createdAt: true } },
          _count: { select: { properties: true, payments: true } },
        },
      }),
      prisma.owner.count({ where }),
    ]);
    res.json(paginatedResponse(owners, total, page, limit));
  } catch (error) {
    next(error);
  }
}

export async function adminGetOwner(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const owner = await prisma.owner.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        properties: {
          include: {
            images: {
              orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
              take: 1,
            },
          },
        },
        payments: { include: { plan: true, property: { select: { title: true } } } },
      },
    });
    if (!owner) throw new ApiError(404, 'Owner not found');
    res.json(successResponse(owner));
  } catch (error) {
    next(error);
  }
}

export async function adminListProperties(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status, propertyType } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (propertyType) where.propertyType = propertyType;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { locality: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { displayOrder: 'asc' } },
          owner: { include: { user: { select: { name: true, mobile: true } } } },
          plan: { select: { name: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);
    res.json(paginatedResponse(properties, total, page, limit));
  } catch (error) {
    next(error);
  }
}

export async function adminGetProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        owner: { include: { user: { select: { name: true, email: true, mobile: true } } } },
        payments: { include: { plan: true } },
      },
    });
    if (!property) throw new ApiError(404, 'Property not found');
    res.json(successResponse(property));
  } catch (error) {
    next(error);
  }
}

export async function adminApproveProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const property = await prisma.property.findUnique({
      where: { id: req.params.id },
      include: { plan: true },
    });
    if (!property) throw new ApiError(404, 'Property not found');
    if (property.status !== 'PENDING_APPROVAL') {
      throw new ApiError(400, 'Only properties pending approval can be approved');
    }

    const durationDays = resolvePlanValidityDays(property.plan, property.propertyType);
    const now = new Date();
    const expiresAt = calculateExpiryDate(now, durationDays);

    await prisma.property.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: now,
        validityDays: durationDays,
        expiresAt,
        rejectionReason: null,
      },
    });

    // Notify owner via Web Push / In-App notification
    void notifyPropertyApproved({
      id: property.id,
      ownerId: property.ownerId,
      title: property.title,
    }).catch((err) => console.warn('[Notifications] Could not send approval notification:', err));

    res.json(successResponse(null, 'Property approved and published'));
  } catch (error) {
    next(error);
  }
}

export async function adminRejectProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { reason } = rejectPropertySchema.parse(req.body);
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    if (!property) throw new ApiError(404, 'Property not found');

    await prisma.property.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', rejectionReason: reason },
    });

    // Notify owner
    void notifyPropertyRejected(
      { id: property.id, ownerId: property.ownerId, title: property.title },
      reason
    ).catch((err) => console.warn('[Notifications] Could not send rejection notification:', err));

    res.json(successResponse(null, 'Property rejected'));
  } catch (error) {
    next(error);
  }
}

export async function adminUpdatePropertyStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['PUBLISHED', 'EXPIRED', 'REMOVED'];
    if (!validStatuses.includes(status)) throw new ApiError(400, 'Invalid status for this action');

    await prisma.property.update({ where: { id }, data: { status } });
    res.json(successResponse(null, `Property marked as ${status.toLowerCase()}`));
  } catch (error) {
    next(error);
  }
}

export async function adminListPayments(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { search, status } = req.query;
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const where: Record<string, unknown> = {};
    if (status) where.paymentStatus = status;
    if (search) {
      where.OR = [
        { cfOrderId: { contains: search as string } },
        { razorpayOrderId: { contains: search as string } },
        { razorpayPaymentId: { contains: search as string } },
        { transactionId: { contains: search as string } },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          property: { select: { id: true, title: true } },
          plan: { select: { name: true } },
          owner: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    res.json(paginatedResponse(payments, total, page, limit));
  } catch (error) {
    next(error);
  }
}

export async function adminListEnquiries(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);
    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true } },
          user: { select: { name: true, mobile: true } },
          owner: { include: { user: { select: { name: true } } } },
        },
      }),
      prisma.enquiry.count(),
    ]);
    res.json(paginatedResponse(enquiries, total, page, limit));
  } catch (error) {
    next(error);
  }
}

// Admin-managed plans
export async function adminListPlans(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const plans = await prisma.listingPlan.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(successResponse(plans));
  } catch (error) {
    next(error);
  }
}
