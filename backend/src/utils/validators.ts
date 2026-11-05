import { z } from 'zod';

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
  role: z.enum(['USER', 'OWNER']).optional(),
  name: z.string().optional(),
});

export const createPropertySchema = z.object({
  propertyType: z.enum(['HOUSE', 'SHOP']),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  rent: z.number().positive(),
  deposit: z.number().min(0),
  locality: z.string().min(1),
  address: z.string().optional().default(''),
  propertySize: z.number().positive(),
  bedrooms: z.number().int().min(0).optional().nullable(),
  rooms: z.number().int().min(0).optional().nullable(),
  furnishing: z.enum(['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']).optional(),
  amenities: z.array(z.string()).optional(),
  availability: z.string().datetime(),
  contactPhone: z.boolean().optional(),
  contactWhatsapp: z.boolean().optional(),
  contactEnquiry: z.boolean().optional(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const updatePropertySchema = createPropertySchema.partial();

export const createPaymentOrderSchema = z.object({
  propertyId: z.string().min(1),
  planId: z.string().min(1),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().optional(),
});

export const createEnquirySchema = z.object({
  propertyId: z.string().min(1),
  message: z.string().min(10).max(500),
  phone: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  profileImage: z.string().url().optional().nullable(),
  bio: z.string().max(300).optional().nullable(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  nameTamil: z.string().optional().nullable(),
  badge: z.string().optional().nullable(),
  price: z.number().min(0),
  strikePrice: z.string().optional().nullable(),
  durationDays: z.number().int().positive(),
  description: z.string().optional().default(''),
  features: z.array(z.string()).optional(),
  ctaLabel: z.string().optional().nullable(),
  ctaLink: z.string().optional().nullable(),
  isPremium: z.boolean().optional(),
  isOffer: z.boolean().optional(),
  enabledCount: z.number().int().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const rejectPropertySchema = z.object({
  reason: z.string().min(5).max(500),
});
