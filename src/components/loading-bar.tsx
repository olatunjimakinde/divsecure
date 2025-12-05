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
    }, [pathname, searchParams])

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const anchor = target.closest('a')

            if (anchor) {
                const href = anchor.getAttribute('href')
                const targetAttr = anchor.getAttribute('target')

                // Ignore external links, new tabs, or anchor links on the same page
                if (
                    href &&
                    href.startsWith('/') &&
                    targetAttr !== '_blank' &&
                    !href.startsWith('#') &&
                    href !== pathname
                ) {
                    NProgress.start()
                }
            }
        }

        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [pathname])

    return null
}
