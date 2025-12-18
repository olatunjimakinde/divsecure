import { z } from 'zod'

export const createGuardSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(1, 'Full name is required'),
    communityId: z.string().uuid('Invalid Community ID'),
    communitySlug: z.string().min(1),
    isHead: z.string().optional()
})

export type CreateGuardInput = z.infer<typeof createGuardSchema>

export const updateGuardSchema = z.object({
    memberId: z.string().uuid(),
    communitySlug: z.string().min(1),
    fullName: z.string().min(1),
    isHead: z.string().optional()
})

export const toggleGuardStatusSchema = z.object({
    memberId: z.string().uuid(),
    communitySlug: z.string().min(1),
    currentStatus: z.string()
})

export const deleteGuardSchema = z.object({
    memberId: z.string().uuid(),
    communitySlug: z.string().min(1)
})
