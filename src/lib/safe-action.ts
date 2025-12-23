import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export type ActionState<T> = {
    success?: boolean
    data?: T
    error?: string
    [key: string]: any
}

type SafeActionParams<TInput, TOutput> = {
    schema: z.Schema<TInput>
    action: (data: TInput, user?: any) => Promise<TOutput>
    requireAuth?: boolean
}

/**
 * A wrapper for Server Actions to standardize validation, auth, and error handling.
 */
export function safeAction<TInput, TOutput>({
    schema,
    action,
    requireAuth = true
}: SafeActionParams<TInput, TOutput>) {
    return async (prevState: any, formData: FormData): Promise<ActionState<TOutput>> => {
        try {
            // 1. Auth Check
            let user = null
            if (requireAuth) {
                const supabase = await createClient()
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

                if (authError || !authUser) {
                    return { error: 'Unauthorized', success: false }
                }
                user = authUser
            }

            // 2. Input Validation
            const formDataObj = Object.fromEntries(formData.entries())
            const data = Object.fromEntries(
                Object.entries(formDataObj).map(([key, value]) => {
                    if (value === '' || value === null) {
                        return [key, undefined]
                    }
                    return [key, value]
                })
            )
            const validationResult = schema.safeParse(data)

            if (!validationResult.success) {
                console.error('Validation Error:', validationResult.error)
                const errorMessage = validationResult.error.issues
                    ? validationResult.error.issues.map((i: any) => i.message).join(', ')
                    : validationResult.error.message;

                return {
                    error: 'Invalid input data: ' + errorMessage,
                    success: false
                }
            }

            // 3. Execution
            const result = await action(validationResult.data, user)

            return {
                success: true,
                data: result
            }

        } catch (error: any) {
            console.error('Server Action Error:', error)
            return {
                success: false,
                error: error.message || 'An unexpected error occurred'
            }
        }
    }
}
