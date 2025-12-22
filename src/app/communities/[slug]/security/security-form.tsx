'use client'

import { verifyVisitorCode } from '../../security/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export function SecurityForm({ slug }: { slug: string }) {
    const [result, setResult] = useState<{
        success?: boolean;
        error?: string;
        visitorName?: string;
        message?: string;
        visitorType?: string;
        vehiclePlate?: string | null;
    } | null>(null)
    const [code, setCode] = useState('')

    async function handleSubmit(formData: FormData) {
        setResult(null)
        const res = await verifyVisitorCode(formData)
        setResult(res)
        if (res?.success) {
            setCode('') // Clear input on success
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Verify Access Code</CardTitle>
                    <CardDescription>
                        Enter the 6-digit code provided by the visitor.
                    </CardDescription>
                </CardHeader>
                <form action={handleSubmit}>
                    <input type="hidden" name="communitySlug" value={slug} />
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="accessCode">Access Code</Label>
                            <Input
                                id="accessCode"
                                name="accessCode"
                                placeholder="123456"
                                className="text-center text-2xl tracking-widest font-mono"
                                maxLength={6}
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>

                        {result && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${result.success ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                                {result.success ? (
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                )}
                                <div className="space-y-1 w-full">
                                    <h3 className="font-semibold text-lg">
                                        {result.success ? 'Access Granted' : 'Access Denied'}
                                    </h3>

                                    <p className="text-base font-medium">
                                        {result.message || result.error}
                                    </p>

                                    {(result.visitorName || result.visitorType) && (
                                        <div className="mt-3 pt-3 border-t border-gray-200/50 space-y-2">
                                            {result.visitorName && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm opacity-70">Name:</span>
                                                    <span className="font-bold">{result.visitorName}</span>
                                                </div>
                                            )}
                                            {result.visitorType && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm opacity-70">Type:</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-semibold px-2 py-0.5 rounded text-sm ${result.visitorType === 'Visitor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                            {result.visitorType}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {result.vehiclePlate && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm opacity-70">Vehicle:</span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-gray-800">
                                                            {result.vehiclePlate}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" size="lg">Verify Code</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
