import { Response, NextFunction, Request } from 'express';
import { createHash } from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import { successResponse, paginatedResponse, ApiError } from '../utils/response';
import { createPropertySchema, updatePropertySchema } from '../utils/validators';
import { parsePaginationParams, CHENNAI_LOCALITIES } from '../utils/helpers';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { renewPropertyListing } from '../services/validity.service';
import { notifyPropertyView } from '../services/ownerNotification.service';

// ─── Public Endpoints ───────────────────────────────────────────────

export async function listProperties(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      propertyType, locality, minRent, maxRent,
      bedrooms, furnishing, minSize, maxSize,
      sortBy = 'newest', availability, category, commercialType,
      hostelGender, hostelSharing, hostelTotalMembers, hallCapacity, hallDining, hallAc, floor, carParking,
    } = req.query;

    const { page, limit, skip } = parsePaginationParams(req.query as Record<string, unknown>);

    const now = new Date();
    const where: Record<string, unknown> = {
      status: 'PUBLISHED',
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      ],
    };
    if (propertyType) where.propertyType = propertyType;
    if (category) {
      const cat = String(category).toUpperCase();
      if (cat === 'APARTMENT') {
        where.propertyType = 'HOUSE';
        where.OR = [
          { title: { contains: 'apartment', mode: 'insensitive' } },
          { title: { contains: 'flat', mode: 'insensitive' } },
          { description: { contains: 'apartment', mode: 'insensitive' } },
          { description: { contains: 'flat', mode: 'insensitive' } },
          { description: { contains: '[category:apartment]', mode: 'insensitive' } },
          { description: { contains: 'பிளாட்', mode: 'insensitive' } },
          { description: { contains: 'அபார்ட்மெண்ட்', mode: 'insensitive' } },
        ];
      } else if (cat === 'HOUSE' || cat === 'INDIVIDUAL_HOUSE') {
        where.propertyType = 'HOUSE';
        where.NOT = [
          { description: { contains: '[category:apartment]', mode: 'insensitive' } },
          { description: { contains: '[category:hostel]', mode: 'insensitive' } },
        ];
      } else if (cat === 'VILLA') {
        where.propertyType = 'HOUSE';
        where.OR = [
          { title: { contains: 'villa', mode: 'insensitive' } },
          { description: { contains: 'villa', mode: 'insensitive' } },
          { description: { contains: 'வில்லா', mode: 'insensitive' } },
        ];
      } else if (cat === 'BUILDER_FLOOR') {
        where.propertyType = 'HOUSE';
        where.OR = [
          { title: { contains: 'builder', mode: 'insensitive' } },
          { title: { contains: 'floor', mode: 'insensitive' } },
          { description: { contains: 'builder', mode: 'insensitive' } },
          { description: { contains: 'floor', mode: 'insensitive' } },
        ];
      } else if (cat === 'SHOP') {
        where.propertyType = 'SHOP';
      } else if (cat === 'COMMERCIAL_BUILDING') {
        where.propertyType = 'SHOP';
        where.OR = [
          { title: { contains: 'building', mode: 'insensitive' } },
          { title: { contains: 'complex', mode: 'insensitive' } },
          { description: { contains: 'commercial building', mode: 'insensitive' } },
          { description: { contains: 'industrial building', mode: 'insensitive' } },
          { description: { contains: 'office building', mode: 'insensitive' } },
          { description: { contains: '[category:commercial_building]', mode: 'insensitive' } },
        ];
      } else if (cat === 'HOSTEL') {
        where.OR = [
          { title: { contains: 'hostel', mode: 'insensitive' } },
          { title: { contains: 'pg', mode: 'insensitive' } },
          { title: { contains: 'mansion', mode: 'insensitive' } },
          { description: { contains: 'hostel', mode: 'insensitive' } },
          { description: { contains: 'mansion', mode: 'insensitive' } },
          { description: { contains: '[category:hostel]', mode: 'insensitive' } },
        ];
      } else if (cat === 'MARRIAGE_HALL') {
        where.OR = [
          { title: { contains: 'marriage', mode: 'insensitive' } },
          { title: { contains: 'mandapam', mode: 'insensitive' } },
          { title: { contains: 'hall', mode: 'insensitive' } },
          { description: { contains: 'marriage hall', mode: 'insensitive' } },
          { description: { contains: 'mandapam', mode: 'insensitive' } },
          { description: { contains: '[category:marriage_hall]', mode: 'insensitive' } },
        ];
      }
    }
    if (commercialType) {
      where.propertyType = 'SHOP';
      const cTypes = String(commercialType).split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      const orConditions: Array<Record<string, unknown>> = [];

      cTypes.forEach((t) => {
        if (t.includes('office')) {
          orConditions.push(
            { title: { contains: 'office', mode: 'insensitive' } },
            { description: { contains: 'office', mode: 'insensitive' } },
            { description: { contains: '[commercial:office]', mode: 'insensitive' } }
          );
        } else if (t.includes('co-working') || t.includes('coworking')) {
          orConditions.push(
            { title: { contains: 'coworking', mode: 'insensitive' } },
            { title: { contains: 'co-working', mode: 'insensitive' } },
            { description: { contains: 'coworking', mode: 'insensitive' } }
          );
        } else if (t.includes('showroom')) {
          orConditions.push(
            { title: { contains: 'showroom', mode: 'insensitive' } },
            { description: { contains: 'showroom', mode: 'insensitive' } }
          );
        } else if (t.includes('godown') || t.includes('warehouse')) {
          orConditions.push(
            { title: { contains: 'godown', mode: 'insensitive' } },
            { title: { contains: 'warehouse', mode: 'insensitive' } },
            { description: { contains: 'godown', mode: 'insensitive' } },
            { description: { contains: 'warehouse', mode: 'insensitive' } }
          );
        } else if (t.includes('industrial')) {
          orConditions.push(
            { title: { contains: 'industrial', mode: 'insensitive' } },
            { description: { contains: 'industrial', mode: 'insensitive' } },
            { description: { contains: 'shed', mode: 'insensitive' } }
          );
        } else if (t.includes('shop')) {
          orConditions.push(
            { title: { contains: 'shop', mode: 'insensitive' } },
            { description: { contains: 'shop', mode: 'insensitive' } },
            { description: { contains: 'retail', mode: 'insensitive' } }
          );
        } else {
          orConditions.push(
            { title: { contains: t, mode: 'insensitive' } },
            { description: { contains: t, mode: 'insensitive' } }
          );
        }
      });

      if (orConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: orConditions },
        ];
      }
    }
    if (locality) {
      const locStr = String(locality).trim();
      // Extract clean area name (before any dash/hyphen) and any 6-digit pincode
      const cleanArea = locStr.replace(/\s*[-–—]\s*\d{6}.*$/, '').trim();
      const pincodeMatch = locStr.match(/\b\d{6}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : null;

      const locConditions: Array<Record<string, unknown>> = [
        { locality: { contains: locStr, mode: 'insensitive' } },
        { locality: { contains: cleanArea, mode: 'insensitive' } },
        { address: { contains: cleanArea, mode: 'insensitive' } },
      ];
      if (pincode) {
        locConditions.push(
          { locality: { contains: pincode, mode: 'insensitive' } },
          { address: { contains: pincode, mode: 'insensitive' } }
        );
      }

      where.AND = [
        ...(where.AND as Array<Record<string, unknown>> || []),
        { OR: locConditions },
      ];
    }
    if (minRent || maxRent) {
      where.rent = {};
      const maxStr = String(maxRent || '');
      if (maxStr.includes('+')) {
        const minVal = parseFloat(maxStr.replace('+', '')) || 50000;
        (where.rent as Record<string, unknown>).gte = minVal;
      } else {
        if (minRent) (where.rent as Record<string, unknown>).gte = parseFloat(minRent as string);
        if (maxRent) (where.rent as Record<string, unknown>).lte = parseFloat(maxRent as string);
      }
    }
    if (hostelGender) {
      const g = String(hostelGender).toUpperCase();
      const gConditions: Array<Record<string, unknown>> = [];
      if (g === 'MALE') {
        gConditions.push(
          { title: { contains: "men's", mode: 'insensitive' } },
          { title: { contains: 'mens', mode: 'insensitive' } },
          { title: { contains: 'gents', mode: 'insensitive' } },
          { title: { contains: 'boys', mode: 'insensitive' } },
          { description: { contains: "men's", mode: 'insensitive' } },
          { description: { contains: 'gents', mode: 'insensitive' } },
          { description: { contains: '[hostel:male]', mode: 'insensitive' } }
        );
      } else if (g === 'FEMALE') {
        gConditions.push(
          { title: { contains: "women's", mode: 'insensitive' } },
          { title: { contains: 'womens', mode: 'insensitive' } },
          { title: { contains: 'ladies', mode: 'insensitive' } },
          { title: { contains: 'girls', mode: 'insensitive' } },
          { description: { contains: "women's", mode: 'insensitive' } },
          { description: { contains: 'ladies', mode: 'insensitive' } },
          { description: { contains: '[hostel:female]', mode: 'insensitive' } }
        );
      } else if (g === 'COLIVING') {
        gConditions.push(
          { title: { contains: 'coliving', mode: 'insensitive' } },
          { title: { contains: 'co-living', mode: 'insensitive' } },
          { description: { contains: 'coliving', mode: 'insensitive' } },
          { description: { contains: '[hostel:coliving]', mode: 'insensitive' } }
        );
      }
      if (gConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: gConditions },
        ];
      }
    }
    if (hostelSharing) {
      const s = String(hostelSharing).trim();
      const sConditions: Array<Record<string, unknown>> = [];
      if (s === '1') {
        sConditions.push(
          { title: { contains: 'single', mode: 'insensitive' } },
          { description: { contains: 'single room', mode: 'insensitive' } },
          { description: { contains: '1 sharing', mode: 'insensitive' } },
          { bedrooms: 1 }
        );
      } else if (s === '2') {
        sConditions.push(
          { title: { contains: '2 sharing', mode: 'insensitive' } },
          { description: { contains: '2 sharing', mode: 'insensitive' } },
          { description: { contains: 'twin', mode: 'insensitive' } },
          { description: { contains: 'double', mode: 'insensitive' } },
          { bedrooms: 2 }
        );
      } else if (s === '3') {
        sConditions.push(
          { title: { contains: '3 sharing', mode: 'insensitive' } },
          { description: { contains: '3 sharing', mode: 'insensitive' } },
          { description: { contains: 'triple', mode: 'insensitive' } },
          { bedrooms: 3 }
        );
      } else if (s === '4+' || s === '4') {
        sConditions.push(
          { title: { contains: '4 sharing', mode: 'insensitive' } },
          { description: { contains: '4 sharing', mode: 'insensitive' } },
          { description: { contains: 'dormitory', mode: 'insensitive' } },
          { description: { contains: 'dorm', mode: 'insensitive' } },
          { bedrooms: { gte: 4 } }
        );
      }
      if (sConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: sConditions },
        ];
      }
    }
    if (hostelTotalMembers) {
      const tm = String(hostelTotalMembers).trim();
      const tmConditions: Array<Record<string, unknown>> = [];
      if (tm === '1-10') {
        tmConditions.push(
          { description: { contains: '10 member', mode: 'insensitive' } },
          { description: { contains: 'small pg', mode: 'insensitive' } },
          { description: { contains: '[capacity:1-10]', mode: 'insensitive' } }
        );
      } else if (tm === '11-25') {
        tmConditions.push(
          { description: { contains: '20 member', mode: 'insensitive' } },
          { description: { contains: '25 member', mode: 'insensitive' } },
          { description: { contains: '[capacity:11-25]', mode: 'insensitive' } }
        );
      } else if (tm === '26-50') {
        tmConditions.push(
          { description: { contains: '30 member', mode: 'insensitive' } },
          { description: { contains: '50 member', mode: 'insensitive' } },
          { description: { contains: '[capacity:26-50]', mode: 'insensitive' } }
        );
      } else if (tm === '50+') {
        tmConditions.push(
          { description: { contains: '50+', mode: 'insensitive' } },
          { description: { contains: '100 member', mode: 'insensitive' } },
          { description: { contains: 'mansion', mode: 'insensitive' } },
          { description: { contains: '[capacity:50+]', mode: 'insensitive' } }
        );
      }
      if (tmConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: tmConditions },
        ];
      }
    }
    if (hallCapacity) {
      const cap = String(hallCapacity).toUpperCase();
      const capConditions: Array<Record<string, unknown>> = [];
      if (cap === 'UP_TO_250') {
        capConditions.push(
          { title: { contains: 'mini hall', mode: 'insensitive' } },
          { title: { contains: 'party hall', mode: 'insensitive' } },
          { description: { contains: '[capacity:up_to_250]', mode: 'insensitive' } },
          { description: { contains: 'mini hall', mode: 'insensitive' } },
          { description: { contains: '250', mode: 'insensitive' } }
        );
      } else if (cap === '250_TO_500') {
        capConditions.push(
          { description: { contains: '[capacity:250_to_500]', mode: 'insensitive' } },
          { description: { contains: '500', mode: 'insensitive' } }
        );
      } else if (cap === '500_TO_1000') {
        capConditions.push(
          { description: { contains: '[capacity:500_to_1000]', mode: 'insensitive' } },
          { description: { contains: '1000', mode: 'insensitive' } }
        );
      } else if (cap === '1000_PLUS') {
        capConditions.push(
          { description: { contains: '[capacity:1000_plus]', mode: 'insensitive' } },
          { description: { contains: 'convention', mode: 'insensitive' } },
          { description: { contains: 'mega', mode: 'insensitive' } }
        );
      }
      if (capConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: capConditions },
        ];
      }
    }
    if (hallDining) {
      const dining = String(hallDining).toUpperCase();
      const diningConditions: Array<Record<string, unknown>> = [];
      if (dining === 'UP_TO_150') {
        diningConditions.push(
          { description: { contains: '[dining:up_to_150]', mode: 'insensitive' } },
          { description: { contains: '150', mode: 'insensitive' } },
          { description: { contains: 'mini dining', mode: 'insensitive' } },
          { title: { contains: 'mini dining', mode: 'insensitive' } }
        );
      } else if (dining === '150_TO_350') {
        diningConditions.push(
          { description: { contains: '[dining:150_to_350]', mode: 'insensitive' } },
          { description: { contains: '350', mode: 'insensitive' } },
          { description: { contains: '300', mode: 'insensitive' } },
          { description: { contains: '250', mode: 'insensitive' } }
        );
      } else if (dining === '350_TO_600') {
        diningConditions.push(
          { description: { contains: '[dining:350_to_600]', mode: 'insensitive' } },
          { description: { contains: '500', mode: 'insensitive' } },
          { description: { contains: '600', mode: 'insensitive' } },
          { description: { contains: '400', mode: 'insensitive' } }
        );
      } else if (dining === '600_PLUS') {
        diningConditions.push(
          { description: { contains: '[dining:600_plus]', mode: 'insensitive' } },
          { description: { contains: 'grand dining', mode: 'insensitive' } },
          { description: { contains: 'mega dining', mode: 'insensitive' } },
          { description: { contains: '700', mode: 'insensitive' } },
          { description: { contains: '800', mode: 'insensitive' } },
          { description: { contains: '1000', mode: 'insensitive' } }
        );
      }
      if (diningConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: diningConditions },
        ];
      }
    }
    if (hallAc) {
      const ac = String(hallAc).toUpperCase();
      const acConditions: Array<Record<string, unknown>> = [];
      if (ac === 'AC') {
        acConditions.push(
          { title: { contains: 'centralized ac', mode: 'insensitive' } },
          { description: { contains: 'centralized ac', mode: 'insensitive' } },
          { description: { contains: 'central ac', mode: 'insensitive' } },
          { description: { contains: 'air conditioned', mode: 'insensitive' } },
          { description: { contains: 'air-conditioned', mode: 'insensitive' } },
          { description: { contains: 'ac hall', mode: 'insensitive' } },
          { description: { contains: '[amenity:ac]', mode: 'insensitive' } },
          { amenities: { has: 'Air Conditioning' } }
        );
      } else if (ac === 'NON_AC') {
        acConditions.push(
          { title: { contains: 'non-ac', mode: 'insensitive' } },
          { description: { contains: 'non-ac', mode: 'insensitive' } },
          { description: { contains: 'non ac', mode: 'insensitive' } },
          { description: { contains: 'natural ventilation', mode: 'insensitive' } }
        );
      }
      if (acConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: acConditions },
        ];
      }
    }
    if (bedrooms) {
      const bStr = String(bedrooms);
      if (bStr.includes(',')) {
        const bList = bStr.split(',').map((b) => parseInt(b.trim())).filter((b) => !isNaN(b));
        where.bedrooms = { in: bList };
      } else if (bStr.endsWith('+')) {
        const num = parseInt(bStr);
        where.bedrooms = { gte: num };
      } else {
        const num = parseInt(bStr);
        if (!isNaN(num)) where.bedrooms = num;
      }
    }
    if (floor && floor !== 'all') {
      const f = String(floor).toLowerCase().trim();
      const floorConditions: Array<Record<string, unknown>> = [];
      if (f === 'ground' || f === '0') {
        floorConditions.push(
          { title: { contains: 'ground', mode: 'insensitive' } },
          { description: { contains: 'ground', mode: 'insensitive' } },
          { description: { contains: 'gf', mode: 'insensitive' } }
        );
      } else if (f === '1-3') {
        floorConditions.push(
          { title: { contains: '1st', mode: 'insensitive' } },
          { title: { contains: '2nd', mode: 'insensitive' } },
          { title: { contains: '3rd', mode: 'insensitive' } },
          { description: { contains: '1st', mode: 'insensitive' } },
          { description: { contains: '2nd', mode: 'insensitive' } },
          { description: { contains: '3rd', mode: 'insensitive' } },
          { description: { contains: 'first floor', mode: 'insensitive' } },
          { description: { contains: 'second floor', mode: 'insensitive' } },
          { description: { contains: 'third floor', mode: 'insensitive' } }
        );
      } else if (f === '4+' || f === '4') {
        floorConditions.push(
          { title: { contains: '4th', mode: 'insensitive' } },
          { title: { contains: '5th', mode: 'insensitive' } },
          { description: { contains: '4th', mode: 'insensitive' } },
          { description: { contains: '5th', mode: 'insensitive' } },
          { description: { contains: 'fourth floor', mode: 'insensitive' } }
        );
      }
      if (floorConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: floorConditions },
        ];
      }
    }
    if (carParking && carParking !== 'all') {
      const p = String(carParking).toLowerCase().trim();
      const parkingConditions: Array<Record<string, unknown>> = [];
      if (p === 'covered') {
        parkingConditions.push(
          { amenities: { hasSome: ['🛡️ Covered Parking', 'Covered Parking'] } },
          { description: { contains: 'covered parking', mode: 'insensitive' } }
        );
      } else {
        parkingConditions.push(
          { amenities: { hasSome: ['🚗 Car Parking (Four Wheeler)', 'Car Parking', '🛡️ Covered Parking', 'Covered Parking'] } },
          { description: { contains: 'car parking', mode: 'insensitive' } },
          { description: { contains: 'parking', mode: 'insensitive' } }
        );
      }
      if (parkingConditions.length > 0) {
        where.AND = [
          ...(where.AND as Array<Record<string, unknown>> || []),
          { OR: parkingConditions },
        ];
      }
    }
    if (furnishing) where.furnishing = furnishing;
    if (minSize || maxSize) {
      where.propertySize = {};
      if (minSize) (where.propertySize as Record<string, unknown>).gte = parseFloat(minSize as string);
      if (maxSize) (where.propertySize as Record<string, unknown>).lte = parseFloat(maxSize as string);
    }
    if (availability === 'available') where.availability = { lte: new Date() };

    const orderBy: Record<string, string> =
      sortBy === 'rent_asc' ? { rent: 'asc' }
      : sortBy === 'rent_desc' ? { rent: 'desc' }
      : { createdAt: 'desc' };

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: {
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
            take: 1,
          },
          _count: { select: { enquiries: true } },
        },
      }),
      prisma.property.count({ where }),
    ]);

    res.json(paginatedResponse(properties, total, page, limit));
  } catch (error) {
    next(error);
  }
}

export async function getProperty(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = (req as AuthRequest).user;
    const now = new Date();

    const property = await prisma.property.findFirst({
      where: {
        id,
        OR: [
          {
            status: 'PUBLISHED',
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } },
            ],
          },
          ...(user ? [{ owner: { userId: user.id } }, ...(user.role === 'ADMIN' ? [{}] : [])] : []),
        ],
      },
      include: {
        images: { orderBy: { displayOrder: 'asc' } },
        plan: true,
        owner: {
          include: {
            user: { select: { id: true, name: true, mobile: true, email: true, profileImage: true } },
          },
        },
      },
    });
    if (!property) throw new ApiError(404, 'Property listing not found or has expired');

    // Increment view count
    await prisma.property.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    // Notify an owner once per visitor/property/day. Never notify owners about
    // their own views, and keep page loading independent of push delivery.
    if (property.status === 'PUBLISHED' && user?.id !== property.owner.userId && user?.role !== 'ADMIN') {
      const suppliedVisitorId = req.get('x-visit-id')?.slice(0, 128);
      const visitorIdentity = user?.id || suppliedVisitorId || `${req.ip}:${req.get('user-agent') || ''}`;
      const visitorKey = createHash('sha256')
        .update(`${process.env.JWT_SECRET || 'vv-property-views'}:${visitorIdentity}`)
        .digest('hex');
      const visitDate = new Date();
      visitDate.setUTCHours(0, 0, 0, 0);
      void notifyPropertyView(
        { id: property.id, ownerId: property.ownerId, title: property.title },
        visitorKey,
        visitDate
      ).catch((notificationError) => {
        console.warn('[Notifications] Could not record property view:', notificationError);
      });
    }

    res.json(successResponse(property));
  } catch (error) {
    next(error);
  }
}

export async function getLocalities(req: Request, res: Response) {
  res.json(successResponse(CHENNAI_LOCALITIES));
}

// ─── Owner Endpoints ─────────────────────────────────────────────────

export async function createProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) {
      owner = await prisma.owner.create({
        data: {
          userId: req.user!.id,
          isVerified: req.user!.role === 'ADMIN',
        },
      });
      if (req.user!.role === 'USER') {
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { role: 'OWNER' },
        });
      }
    }

    const data = createPropertySchema.parse(req.body);
    const finalAddress = data.address?.trim() || `${data.locality}, Chennai`;
    const property = await prisma.property.create({
      data: {
        ...data,
        address: finalAddress,
        amenities: data.amenities || [],
        availability: new Date(data.availability),
        ownerId: owner.id,
        status: 'DRAFT',
      },
    });
    res.status(201).json(successResponse(property, 'Property created as draft'));
  } catch (error) {
    next(error);
  }
}

export async function updateProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({ where: { id, ownerId: owner.id } });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    // Can only edit DRAFT or REJECTED properties
    if (!['DRAFT', 'REJECTED', 'PENDING_APPROVAL'].includes(property.status)) {
      throw new ApiError(400, 'Only draft, rejected, or pending-review properties can be edited');
    }

    const data = updatePropertySchema.parse(req.body);
    const finalAddress =
      data.address !== undefined
        ? data.address.trim() || `${data.locality || property.locality}, Chennai`
        : undefined;

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...data,
        ...(finalAddress ? { address: finalAddress } : {}),
        availability: data.availability ? new Date(data.availability) : undefined,
        status: 'DRAFT',
      },
    });
    res.json(successResponse(updated, 'Property updated'));
  } catch (error) {
    next(error);
  }
}

export async function deleteProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({
      where: { id, ownerId: owner.id },
      include: { images: true },
    });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    // Delete images from Cloudinary
    for (const img of property.images) {
      try { await cloudinary.uploader.destroy(img.publicId); } catch {}
    }

    await prisma.property.update({ where: { id }, data: { status: 'REMOVED' } });
    res.json(successResponse(null, 'Property removed'));
  } catch (error) {
    next(error);
  }
}

export async function getOwnerProperties(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const properties = await prisma.property.findMany({
      where: { ownerId: owner.id, status: { not: 'REMOVED' } },
      include: {
        images: {
          orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
          take: 1,
        },
        plan: true,
        _count: { select: { enquiries: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(successResponse(properties));
  } catch (error) {
    next(error);
  }
}

export async function renewProperty(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { planId } = req.body;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const updated = await renewPropertyListing({
      propertyId: id,
      ownerId: owner.id,
      userId: req.user!.id,
      planId,
    });

    res.json(successResponse(updated, 'Property listing renewed successfully'));
  } catch (error) {
    next(error);
  }
}

export async function uploadImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({ where: { id, ownerId: owner.id } });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    const files = (req.files as Express.Multer.File[]) || [];
    let base64Images: string[] = [];
    if (req.body?.images) {
      if (Array.isArray(req.body.images)) {
        base64Images = req.body.images.filter((img: any) => typeof img === 'string' && img.startsWith('data:image/'));
      } else if (typeof req.body.images === 'string' && req.body.images.startsWith('data:image/')) {
        base64Images = [req.body.images];
      }
    }

    const totalNew = files.length + base64Images.length;
    if (totalNew === 0) throw new ApiError(400, 'No images provided');

    // Check existing image count
    const existingCount = await prisma.propertyImage.count({ where: { propertyId: id } });
    if (existingCount + totalNew > 10) {
      throw new ApiError(400, `Cannot upload more than 10 images. Currently have ${existingCount}.`);
    }

    const uploadedImages = [];
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';

    // 1. Process multipart files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let imageUrl = '';
      let publicId = `img_${uuidv4()}`;

      if (isCloudinaryConfigured) {
        try {
          const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `VeeduVadagaikkuChennai/properties/${id}`,
                transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto:good' }],
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result as { secure_url: string; public_id: string });
              }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
          });
          imageUrl = result.secure_url;
          publicId = result.public_id;
        } catch (cloudErr) {
          console.warn('[Upload] Cloudinary upload failed, falling back to local storage:', cloudErr);
        }
      }

      // If Cloudinary wasn't configured or failed, save permanently as Base64 data URI
      // so images are persisted directly in PostgreSQL (Supabase) and NEVER lost on Railway container restarts!
      if (!imageUrl) {
        const mime = file.mimetype || 'image/jpeg';
        const base64Data = `data:${mime};base64,${file.buffer.toString('base64')}`;
        imageUrl = base64Data;
      }

      const isPrimary = existingCount === 0 && i === 0;
      const cleanImageUrl = imageUrl.trim();
      const img = await prisma.propertyImage.create({
        data: {
          propertyId: id,
          imageUrl: cleanImageUrl,
          publicId,
          isPrimary,
          displayOrder: existingCount + i,
        },
      });
      uploadedImages.push(img);
    }

    // 2. Process any direct base64 image strings
    for (let j = 0; j < base64Images.length; j++) {
      const b64 = base64Images[j];
      const isPrimary = existingCount === 0 && files.length === 0 && j === 0;
      const img = await prisma.propertyImage.create({
        data: {
          propertyId: id,
          imageUrl: b64.trim(),
          publicId: `img_${uuidv4()}`,
          isPrimary,
          displayOrder: existingCount + files.length + j,
        },
      });
      uploadedImages.push(img);
    }

    res.status(201).json(successResponse(uploadedImages, 'Images uploaded successfully'));
  } catch (error) {
    next(error);
  }
}

export async function deleteImage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id, imageId } = req.params;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({ where: { id, ownerId: owner.id } });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    const image = await prisma.propertyImage.findFirst({ where: { id: imageId, propertyId: id } });
    if (!image) throw new ApiError(404, 'Image not found');

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(image.publicId);
    await prisma.propertyImage.delete({ where: { id: imageId } });

    // If deleted image was primary, set the first remaining as primary
    if (image.isPrimary) {
      const firstImage = await prisma.propertyImage.findFirst({
        where: { propertyId: id },
        orderBy: { displayOrder: 'asc' },
      });
      if (firstImage) {
        await prisma.propertyImage.update({ where: { id: firstImage.id }, data: { isPrimary: true } });
      }
    }

    res.json(successResponse(null, 'Image deleted'));
  } catch (error) {
    next(error);
  }
}

export async function reorderImages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { imageOrders } = req.body as { imageOrders: Array<{ id: string; displayOrder: number; isPrimary?: boolean }> };

    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({ where: { id, ownerId: owner.id } });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    await prisma.$transaction(
      imageOrders.map((img) =>
        prisma.propertyImage.update({
          where: { id: img.id },
          data: { displayOrder: img.displayOrder, isPrimary: img.isPrimary || false },
        })
      )
    );

    res.json(successResponse(null, 'Images reordered'));
  } catch (error) {
    next(error);
  }
}

// Submit a DRAFT or REJECTED property for admin review (free — no payment needed)
export async function submitForReview(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const owner = await prisma.owner.findUnique({ where: { userId: req.user!.id } });
    if (!owner) throw new ApiError(403, 'Owner profile not found');

    const property = await prisma.property.findFirst({ where: { id, ownerId: owner.id } });
    if (!property) throw new ApiError(404, 'Property not found or not authorized');

    if (property.status === 'PENDING_APPROVAL') {
      return res.json(successResponse(null, 'Property is already submitted for admin review.'));
    }

    if (!['DRAFT', 'REJECTED'].includes(property.status)) {
      throw new ApiError(400, `Property is already ${property.status.toLowerCase()}.`);
    }

    // Must have at least one image
    const imageCount = await prisma.propertyImage.count({ where: { propertyId: id } });
    if (imageCount === 0) {
      throw new ApiError(400, 'Please upload at least one photo before submitting for review.');
    }

    await prisma.property.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL', rejectionReason: null },
    });

    res.json(successResponse(null, 'Property submitted for admin review. It will be published once approved.'));
  } catch (error) {
    next(error);
  }
}

