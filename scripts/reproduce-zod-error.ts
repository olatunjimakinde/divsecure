
import { z } from 'zod';

const signupSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
    phone: z.string().min(10, { message: "Phone number must be at least 10 digits" }),
    role: z.enum(['resident', 'manager', 'household']),
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
    path: ["communityId"],
});

async function test() {
    console.log("--- Test 1: Null values passed directly (Simulating NO fix) ---");
    const rawDataNull = {
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        role: "manager",
        communityId: null,
        unitNumber: null,
        communityName: null,
        communityAddress: null,
    };

    const resultNull = signupSchema.safeParse(rawDataNull);
    if (!resultNull.success) {
        console.log("Error with NULL:", resultNull.error.issues[0].message);
        console.log("Full Error:", JSON.stringify(resultNull.error.issues, null, 2));
    } else {
        console.log("Success with NULL");
    }

    console.log("\n--- Test 2: Undefined values (Simulating WITH fix) ---");
    const rawDataUndefined = {
        email: "test@example.com",
        password: "password123",
        phone: "1234567890",
        role: "manager",
        communityId: undefined,
        unitNumber: undefined,
        communityName: undefined,
        communityAddress: undefined,
    };

    const resultUndefined = signupSchema.safeParse(rawDataUndefined);
    if (!resultUndefined.success) {
        console.log("Error with UNDEFINED:", resultUndefined.error.issues[0].message);
    } else {
        console.log("Success with UNDEFINED");
    }
}

test();
