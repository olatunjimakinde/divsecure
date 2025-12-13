
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email(),
    communityId: z.string().optional(),
});

async function test() {
    console.log("--- Testing FormData behavior ---");

    // Mock FormData since we are in node (using a simple object to simulate behavior if FormData is not available, 
    // but in Next.js runtime it is standard FormData. We will try to use the global FormData if available or mock it close enough)

    class MockFormData {
        private data: Map<string, string>;
        constructor() {
            this.data = new Map();
        }
        append(key: string, value: string) {
            this.data.set(key, value);
        }
        get(key: string) {
            return this.data.has(key) ? this.data.get(key) : null;
        }
    }

    const formData = new MockFormData();
    formData.append('email', 'test@example.com');
    // communityId is missing, so get() returns null

    const rawData = {
        email: formData.get('email') as string || undefined,
        communityId: formData.get('communityId') || undefined,
    };

    console.log("Raw Data:", JSON.stringify(rawData, null, 2));
    console.log("communityId value:", rawData.communityId);
    console.log("Type of communityId:", typeof rawData.communityId);

    const result = signupSchema.safeParse(rawData);
    if (result.success) {
        console.log("Validation SUCCESS");
    } else {
        console.log("Validation FAILED");
        console.log(JSON.stringify(result.error.issues, null, 2));
    }
}

test();
