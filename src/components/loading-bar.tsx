'use client'

import { useEffect } from 'react'
import NProgress from 'nprogress'
import { usePathname, useSearchParams } from 'next/navigation'
import 'nprogress/nprogress.css'

export function LoadingBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        NProgress.configure({ showSpinner: false })
    }, [])

    useEffect(() => {
        NProgress.done()
        return () => {
            NProgress.start()
        }
    }, [pathname, searchParams])

    return null
}
