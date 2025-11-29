'use client'

import { useState, useTransition, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { searchCommunity } from './search-actions'
import { Loader2, Search, User, Home, Shield } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchResult {
    residents: any[]
    households: any[]
    guards: any[]
}

export function GlobalSearch({ communityId, communitySlug }: { communityId: string, communitySlug: string }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult | null>(null)
    const [isPending, startTransition] = useTransition()
    const debouncedQuery = useDebounce(query, 300)

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults(null)
            return
        }

        startTransition(async () => {
            const data = await searchCommunity(debouncedQuery, communityId)
            if ('error' in data) {
                console.error(data.error)
            } else {
                setResults(data)
            }
        })
    }, [debouncedQuery, communityId])

    return (
        <div className="relative w-full max-w-md">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search residents, households, guards..."
                    className="pl-8"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                {isPending && (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {results && (
                <div className="absolute top-full z-50 mt-2 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-[300px] overflow-y-auto p-2">
                        {results.residents.length === 0 && results.households.length === 0 && results.guards.length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground text-center">No results found.</div>
                        )}

                        {results.residents.length > 0 && (
                            <div className="mb-2">
                                <h4 className="mb-1 px-2 text-xs font-semibold text-muted-foreground">Residents</h4>
                                {results.residents.map((resident) => (
                                    <div key={resident.id} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                                        <User className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">{resident.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {resident.households?.unit_number ? `Unit ${resident.households.unit_number}` : 'No Unit'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {results.households.length > 0 && (
                            <div className="mb-2">
                                <h4 className="mb-1 px-2 text-xs font-semibold text-muted-foreground">Households</h4>
                                {results.households.map((household) => (
                                    <Link
                                        key={household.id}
                                        href={`/communities/${communitySlug}/manager/households`}
                                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground block"
                                    >
                                        <Home className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">Unit {household.unit_number}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {results.guards.length > 0 && (
                            <div>
                                <h4 className="mb-1 px-2 text-xs font-semibold text-muted-foreground">Security</h4>
                                {results.guards.map((guard) => (
                                    <Link
                                        key={guard.id}
                                        href={`/communities/${communitySlug}/manager/security`}
                                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground block"
                                    >
                                        <Shield className="h-4 w-4" />
                                        <div>
                                            <div className="font-medium">{guard.profiles?.full_name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground capitalize">{guard.role.replace('_', ' ')}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
