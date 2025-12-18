import { describe, it, expect, vi } from 'vitest'
import { safeAction } from '@/lib/safe-action'
import { z } from 'zod'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({
                data: { user: { id: 'test-user' } },
                error: null
            })
        }
    }))
}))

describe('safeAction', () => {
    it('should validate input correctly', async () => {
        const schema = z.object({
            name: z.string().min(3)
        })

        const action = safeAction({
            schema,
            action: async (data) => {
                return { message: `Hello ${data.name}` }
            }
        })

        const formData = new FormData()
        formData.append('name', 'Jo') // Too short

        const result = await action(null, formData)

        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid input data')
    })

    it('should execute successfully with valid input', async () => {
        const schema = z.object({
            name: z.string().min(3)
        })

        const action = safeAction({
            schema,
            action: async (data, user) => {
                expect(user.id).toBe('test-user')
                return { message: `Hello ${data.name}` }
            }
        })

        const formData = new FormData()
        formData.append('name', 'John')

        const result = await action(null, formData)

        expect(result.success).toBe(true)
        expect(result.data).toEqual({ message: 'Hello John' })
    })
})
