'use client'

import { verifyVisitorCode } from '../../security/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export function SecurityForm({ slug }: { slug: string }) {
    const [result, setResult] = useState<{ success?: boolean; error?: string; visitorName?: string; message?: string } | null>(null)
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
                                <div>
                                    <h3 className="font-semibold">
                                        {result.success ? 'Access Granted' : 'Access Denied'}
                                    </h3>
                                    <p className="text-sm mt-1">
                                        {result.message || result.error}
                                    </p>
                                    {result.visitorName && (
                                        <p className="text-lg font-bold mt-2">
                                            Visitor: {result.visitorName}
                                        </p>
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
