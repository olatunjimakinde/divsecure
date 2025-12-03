import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(1, { message: "Password is required" }),
});

export const signupSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
    role: z.enum(['resident', 'manager', 'household']),
    // Optional fields depending on role, but we can validate them loosely here or refine based on role
    communityId: z.string().optional(),
    unitNumber: z.string().optional(),
    communityName: z.string().optional(),
    communityAddress: z.string().optional(),
}).refine((data) => {
    if (data.role === 'household') {
        return !!data.communityId && !!data.unitNumber;
    }
    return true;
}, {
    message: "Community and Unit Number are required for residents",
    path: ["communityId"], // Attach error to communityId
});

export const createCommunitySchema = z.object({
    name: z.string().min(3, { message: "Community name must be at least 3 characters" }),
    slug: z.string().min(3, { message: "Slug must be at least 3 characters" })
        .regex(/^[a-z0-9-]+$/, { message: "Slug can only contain lowercase letters, numbers, and hyphens" }),
    description: z.string().optional(),
    address: z.string().min(5, { message: "Address is required" }),
    payment_ref: z.string().optional(),
    plan_id: z.string().optional(),
});
