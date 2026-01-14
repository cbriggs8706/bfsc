'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
	createCourse,
	deleteCourse,
	updateCourse,
} from '@/app/actions/training'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from '@/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus, Trash2, Settings } from 'lucide-react'
import { AdminCourse } from '@/types/training'

type Props = {
	courses: Pick<AdminCourse, 'id' | 'title' | 'slug' | 'sortOrder'>[]
	locale: string
}

function slugify(v: string) {
	return v
		.trim()
		.toLowerCase()
		.replace(/['"]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '')
}

export function CoursesManager({ courses, locale }: Props) {
	const router = useRouter()

	const [q, setQ] = useState('')
	const [open, setOpen] = useState(false)
	const [title, setTitle] = useState('')
	const [slug, setSlug] = useState('')

	const filtered = useMemo(() => {
		const needle = q.trim().toLowerCase()
		if (!needle) return courses
		return courses.filter(
			(c) =>
				c.title.toLowerCase().includes(needle) ||
				c.slug.toLowerCase().includes(needle)
		)
	}, [courses, q])

	return (
		<div className="space-y-4">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">Training Courses</h1>
					<p className="text-sm text-muted-foreground">
						Select a course to edit its units, lessons, and content blocks.
					</p>
				</div>

				<div className="flex gap-2">
					<Input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search courses…"
						className="w-full sm:w-[280px]"
					/>

					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								New
							</Button>
						</DialogTrigger>

						<DialogContent>
							<DialogHeader>
								<DialogTitle>Create course</DialogTitle>
							</DialogHeader>

							<div className="space-y-3">
								<Input
									value={title}
									placeholder="Course title"
									onChange={(e) => {
										const t = e.target.value
										setTitle(t)
										if (!slug) setSlug(slugify(t))
									}}
								/>
								<Input
									value={slug}
									placeholder="memories-level-1"
									onChange={(e) => setSlug(e.target.value)}
								/>
							</div>

							<DialogFooter>
								<Button
									disabled={!title.trim() || !slug.trim()}
									onClick={async () => {
										await createCourse({
											title: title.trim(),
											slug: slug.trim(),
										})
										setTitle('')
										setSlug('')
										setOpen(false)
										router.refresh()
									}}
								>
									Create
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid gap-3">
				{filtered.map((course) => (
					<Card key={course.id} className="p-4">
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0">
								<div className="font-medium truncate">{course.title}</div>
								<div className="text-sm text-muted-foreground truncate">
									{course.slug}
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button asChild variant="secondary">
									<Link href={`/${locale}/admin/training/courses/${course.id}`}>
										<Settings className="h-4 w-4 mr-2" />
										Edit
									</Link>
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon">
											<MoreVertical className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={async () => {
												// keep power tools, but out of the way
												const next = prompt(
													'Sort order (number):',
													String(course.sortOrder ?? 0)
												)
												if (next === null) return
												await updateCourse(course.id, {
													sortOrder: Number(next),
												})
												router.refresh()
											}}
										>
											Set sort order…
										</DropdownMenuItem>

										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={async () => {
												if (
													!confirm('Delete this course and ALL its contents?')
												)
													return
												await deleteCourse(course.id)
												router.refresh()
											}}
										>
											<Trash2 className="h-4 w-4 mr-2" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</Card>
				))}

				{filtered.length === 0 && (
					<Card className="p-6 text-sm text-muted-foreground">
						No courses match “{q}”.
					</Card>
				)}
			</div>
		</div>
	)
}
