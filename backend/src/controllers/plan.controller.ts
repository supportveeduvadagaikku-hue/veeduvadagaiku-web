import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, ApiError } from '../utils/response';
import { createPlanSchema } from '../utils/validators';

import { getNavaratriOffer, isOfferActive } from '../config/offerConfig';

export async function syncPromotionalPlan() {
  try {
    const offer = getNavaratriOffer();
    const active = isOfferActive(offer);

    const existingPrimary = await prisma.listingPlan.findUnique({ where: { id: offer.planId } });
    if (!existingPrimary) {
      await prisma.listingPlan.create({
        data: {
          id: offer.planId,
          name: offer.planName,
          nameTamil: 'தீபாவளி இலவச சலுகை',
          badge: 'DEEPAVALI OFFER',
          price: offer.price,
          strikePrice: '₹99-₹2,500',
          durationDays: offer.durationDays,
          description: offer.description,
          features: offer.features,
          ctaLabel: offer.ctaText,
          ctaLink: offer.ctaLink,
          isOffer: true,
          isPremium: false,
          enabledCount: 5,
          isActive: active,
          sortOrder: 0,
        },
      });
    }

    const existingLegacy = await prisma.listingPlan.findUnique({ where: { id: 'plan_navaratri_free' } });
    if (!existingLegacy) {
      await prisma.listingPlan.create({
        data: {
          id: 'plan_navaratri_free',
          name: offer.planName,
          nameTamil: 'தீபாவளி இலவச சலுகை',
          badge: 'DEEPAVALI OFFER',
          price: offer.price,
          strikePrice: '₹99-₹2,500',
          durationDays: offer.durationDays,
          description: offer.description,
          features: offer.features,
          ctaLabel: offer.ctaText,
          ctaLink: offer.ctaLink,
          isOffer: true,
          isPremium: false,
          enabledCount: 5,
          isActive: active,
          sortOrder: 0,
        },
      });
    }
  } catch (err) {
    console.warn('[syncPromotionalPlan] Failed to sync promo plan:', err);
  }
}

export async function listPlans(req: Request, res: Response, next: NextFunction) {
  try {
    await syncPromotionalPlan();
    // Return plans excluding the redundant legacy alias if present
    const plans = await prisma.listingPlan.findMany({
      where: { isActive: true, NOT: { id: 'plan_navaratri_free' } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(successResponse(plans));
  } catch (error) {
    next(error);
  }
}

export async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.params.id === 'plan_navaratri_free' || req.params.id === 'plan_deepavali_free') {
      const offer = getNavaratriOffer();
      if (!isOfferActive(offer)) {
        throw new ApiError(404, 'Deepavali Free Offer Plan has expired');
      }
    }
    const plan = await prisma.listingPlan.findUnique({ where: { id: req.params.id } });
    if (!plan) throw new ApiError(404, 'Plan not found');
    res.json(successResponse(plan));
  } catch (error) {
    next(error);
  }
}

// Admin-only
export async function createPlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPlanSchema.parse(req.body);
    const plan = await prisma.listingPlan.create({ data });
    res.status(201).json(successResponse(plan, 'Plan created'));
  } catch (error) {
    next(error);
  }
}

export async function updatePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createPlanSchema.partial().parse(req.body);
    const plan = await prisma.listingPlan.update({ where: { id: req.params.id }, data });
    res.json(successResponse(plan, 'Plan updated'));
  } catch (error) {
    next(error);
  }
}

export async function deletePlan(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.listingPlan.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json(successResponse(null, 'Plan deactivated'));
  } catch (error) {
    next(error);
  }
}
