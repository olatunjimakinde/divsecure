import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleGuardStatus, deleteGuard } from './actions'

// Mock Supabase
const mockUser = { id: '123e4567-e89b-12d3-a456-426614174000' }
const mockMember = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    user_id: '123e4567-e89b-12d3-a456-426614174000', // Self
    community_id: '123e4567-e89b-12d3-a456-426614174002',
    role: 'head_of_security'
}

// Loose mock types to avoid TS fighting
const mockSupabase = {
    auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
    },
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn()
                })),
                single: vi.fn()
            })),
            single: vi.fn()
        })),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null })
    }))
}

const mockAdminClient = {
    from: vi.fn(() => ({
        select: vi.fn(() => ({
            eq: vi.fn(() => ({
                single: vi.fn()
            })),
            single: vi.fn()
        })),
        update: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockResolvedValue({ error: null })
    })),
    auth: {
        admin: {
            deleteUser: vi.fn().mockResolvedValue({ error: null })
        }
    }
}

vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => mockSupabase),
    createAdminClient: vi.fn(() => mockAdminClient)
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

describe('Security Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('toggleGuardStatus', () => {
        it('should prevent self-suspension', async () => {
            // Setup: Member lookup returns SELF
            mockAdminClient.from.mockImplementation(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: mockMember })
                    }))
                }))
            }))

            const formData = new FormData()
            formData.append('memberId', mockMember.id)
            formData.append('communitySlug', 'test-slug')
            formData.append('currentStatus', 'approved')

            const result = await toggleGuardStatus(null, formData)

            expect(result.success).toBe(false)
            expect(result.error).toContain('You cannot suspend yourself')
        })
    })

    describe('deleteGuard', () => {
        it('should prevent self-deletion', async () => {
            // Setup: Member lookup returns SELF
            mockAdminClient.from.mockImplementation(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: mockMember })
                    }))
                })),
                delete: vi.fn().mockResolvedValue({ error: null })
            }))

            const formData = new FormData()
            formData.append('memberId', mockMember.id)
            formData.append('communitySlug', 'test-slug')

            const result = await deleteGuard(null, formData)

            expect(result.success).toBe(false)
            expect(result.error).toContain('You cannot delete yourself')
        })
    })
})
