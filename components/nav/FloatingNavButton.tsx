// components/nav/FloatingNavButton.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'floating-nav-pos'

type Pos = { x: number; y: number }

function computeInitialPos(): Pos {
	// SSR fallback
	if (typeof window === 'undefined') {
		return { x: 16, y: 120 }
	}

	// Try storage first
	try {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved) return JSON.parse(saved)
	} catch {
		// ignore
	}

	// Default bottom-right
	const size = 56
	const margin = 16
	const safeBottom = 24

	return {
		x: window.innerWidth - size - margin,
		y: window.innerHeight - size - margin - safeBottom,
	}
}

export function FloatingNavButton() {
	const { toggleSidebar } = useSidebar()
	const ref = useRef<HTMLButtonElement>(null)

	// ✅ Lazy initialization — NO EFFECT SETTERS
	const [pos, setPos] = useState<Pos>(() => computeInitialPos())
	const [dragging, setDragging] = useState(false)

	// ✅ Effect only synchronizes OUTWARD
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
	}, [pos])

	function onPointerDown(e: React.PointerEvent) {
		ref.current?.setPointerCapture(e.pointerId)
		setDragging(true)
	}

	function onPointerMove(e: React.PointerEvent) {
		if (!dragging) return
		setPos((p) => ({
			x: Math.max(8, p.x + e.movementX),
			y: Math.max(8, p.y + e.movementY),
		}))
	}

	function onPointerUp() {
		setDragging(false)
		snapToEdge()
	}

	function snapToEdge() {
		const size = 56
		const margin = 16
		const safeBottom = 24

		const w = window.innerWidth
		const h = window.innerHeight

		setPos((p) => ({
			x: p.x < w / 2 ? margin : w - size - margin,
			y: Math.min(Math.max(80, p.y), h - size - margin - safeBottom),
		}))
	}

	return (
		<button
			ref={ref}
			onClick={() => !dragging && toggleSidebar()}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			className={cn(
				'fixed z-50 md:hidden',
				'flex h-14 w-14 items-center justify-center',
				'rounded-full bg-primary text-primary-foreground shadow-lg',
				'active:scale-95 touch-none'
			)}
			style={{ left: pos.x, top: pos.y }}
		>
			<Menu className="h-6 w-6" />
		</button>
	)
}
