// components/cases/CaseThread.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CaseAttachments } from './CaseAttachments'
import { supabase } from '@/lib/supabase-client'
import { Attachment } from '@/types/cases'
import { editComment } from '@/app/actions/cases/edit-comment'
import { deleteComment } from '@/app/actions/cases/delete-comment'

/* ================= TYPES ================= */

type Comment = {
	id: string
	authorId: string
	authorName: string
	authorImage: string | null
	body: string
	createdAt: Date
	editedAt?: Date | null
	replyToCommentId: string | null
	clientNonce?: string
	__optimistic?: boolean
}

type CommentNode = Comment & { replies: CommentNode[] }

type MentionUser = {
	id: string
	label: string
	value: string
	image: string | null
}

type CurrentUser = {
	id: string
	role: string
	name: string
	email: string
	username: string | null
	image: string | null
}

type Props = {
	caseId: string
	title: string
	status: string
	typeName: string
	submitterName: string
	description: string
	comments: Comment[]
	currentUser: CurrentUser
	canSolve: boolean
	isInvestigating: boolean
	onSolve: () => Promise<void>
	onReopen: () => Promise<void>
	onClaim: () => Promise<void>
	onUnclaim: () => Promise<void>
	onComment: (
		body: string,
		replyTo?: string,
		clientNonce?: string
	) => Promise<void>
	attachments: Attachment[]
}

/* ================= COMPONENT ================= */

export function CaseThread({
	caseId,
	title,
	status,
	typeName,
	submitterName,
	description,
	comments: initialComments,
	currentUser,
	canSolve,
	isInvestigating,
	onSolve,
	onReopen,
	onClaim,
	onUnclaim,
	onComment,
	attachments,
}: Props) {
	const [comments, setComments] = useState<Comment[]>(initialComments)
	const [draft, setDraft] = useState('')
	const [replyTo, setReplyTo] = useState<Comment | null>(null)
	const [editing, setEditing] = useState<Comment | null>(null)
	const [editDraft, setEditDraft] = useState('')
	const bottomRef = useRef<HTMLDivElement | null>(null)
	const [inlineReplyTo, setInlineReplyTo] = useState<string | null>(null)
	const [inlineDraft, setInlineDraft] = useState('')
	const [caseStatus, setCaseStatus] = useState(status)
	const [investigating, setInvestigating] = useState(isInvestigating)

	const PID_REGEX = /##([a-z0-9-]{7,8})/gi

	function normalizePid(raw: string): string | null {
		const cleaned = raw.replace(/[^a-z0-9]/gi, '').toUpperCase()
		if (cleaned.length !== 7) return null

		return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
	}

	function getStatusMeta(status: string) {
		switch (status) {
			case 'investigating':
				return {
					label: 'Investigating',
					className:
						'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
				}
			// TODO update these colors
			case 'waiting':
				return {
					label: 'Waiting',
					className:
						'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
				}
			case 'solved':
				return {
					label: 'Solved',
					className:
						'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
				}
			case 'archived':
				return {
					label: 'Archived',
					className: 'bg-muted text-muted-foreground',
				}
			default:
				return {
					label: 'Open',
					className:
						'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
				}
		}
	}

	const statusMeta = getStatusMeta(caseStatus)

	/* ================= MENTIONS ================= */

	const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])

	useEffect(() => {
		fetch('/api/mentions')
			.then((r) => r.json())
			.then(setMentionUsers)
	}, [])

	const footerMentions = useMentions(mentionUsers)
	const inlineMentions = useMentions(mentionUsers)

	/* ================= TREE ================= */

	function buildTree(list: Comment[]): CommentNode[] {
		const map = new Map<string, CommentNode>()
		const roots: CommentNode[] = []

		for (const c of list) map.set(c.id, { ...c, replies: [] })

		for (const node of map.values()) {
			if (node.replyToCommentId) {
				const parent = map.get(node.replyToCommentId)
				parent?.replies.push(node)
			} else {
				roots.push(node)
			}
		}

		return roots
	}

	const commentTree = useMemo(() => buildTree(comments), [comments])

	/* ================= REALTIME ================= */

	useEffect(() => {
		const channel = supabase
			.channel(`case-comments:${caseId}`)
			.on('broadcast', { event: 'new-comment' }, ({ payload }) => {
				setComments((prev) => {
					if (prev.some((c) => c.id === payload.id)) return prev

					const optimisticIndex = prev.findIndex(
						(c) => c.__optimistic && c.clientNonce === payload.clientNonce
					)

					const nextComment: Comment = {
						id: payload.id,
						authorId: payload.author.id,
						authorName: payload.author.name,
						authorImage: payload.author.image,
						body: payload.body,
						createdAt: new Date(payload.createdAt),
						replyToCommentId: payload.replyToCommentId ?? null,
					}

					if (optimisticIndex !== -1) {
						const next = [...prev]
						next[optimisticIndex] = nextComment
						return next
					}

					return [...prev, nextComment]
				})
			})
			.on('broadcast', { event: 'edit-comment' }, ({ payload }) => {
				setComments((prev) =>
					prev.map((c) =>
						c.id === payload.id
							? {
									...c,
									body: payload.body,
									editedAt: new Date(payload.editedAt),
							  }
							: c
					)
				)
			})
			.on('broadcast', { event: 'delete-comment' }, ({ payload }) => {
				setComments((prev) => prev.filter((c) => c.id !== payload.id))
			})
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [caseId])

	/* ================= ACTIONS ================= */

	async function handleSubmit() {
		if (!draft.trim()) return

		const clientNonce = crypto.randomUUID()

		setComments((prev) => [
			...prev,
			{
				id: clientNonce,
				clientNonce,
				__optimistic: true,
				authorId: currentUser.id,
				authorName: currentUser.name,
				authorImage: currentUser.image,
				body: draft,
				createdAt: new Date(),
				replyToCommentId: replyTo?.id ?? null,
			},
		])

		const body = draft
		const replyId = replyTo?.id

		setDraft('')
		setReplyTo(null)

		await onComment(body, replyId, clientNonce)
	}

	function startEdit(c: Comment) {
		setEditing(c)
		setEditDraft(c.body)
	}

	async function submitEdit() {
		if (!editing || !editDraft.trim()) return
		await editComment(editing.id, editDraft)
		setEditing(null)
		setEditDraft('')
	}

	async function handleDelete(id: string) {
		await deleteComment(id)
	}

	async function handleMarkSolved() {
		setCaseStatus('solved') // optimistic
		try {
			await onSolve()
		} catch {
			setCaseStatus('open') // rollback if server fails
		}
	}

	async function handleReopen() {
		setCaseStatus('open') // optimistic
		try {
			await onReopen()
		} catch {
			setCaseStatus('solved')
		}
	}

	/* ================= RENDER ================= */
	// function renderBody(text: string) {
	// 	return text.split(/(@[\w.-]+)/g).map((part, i) =>
	// 		part.startsWith('@') ? (
	// 			<span
	// 				key={i}
	// 				className="text-green-600 dark:text-green-400 font-medium"
	// 			>
	// 				{part}
	// 			</span>
	// 		) : (
	// 			<span key={i}>{part}</span>
	// 		)
	// 	)
	// }

	function renderBody(text: string) {
		const parts = text.split(/(\[\[PID:[A-Z0-9-]+\]\]|@[\w.-]+)/g)

		return parts.map((part, i) => {
			// PID token
			if (part.startsWith('[[PID:')) {
				const pid = part.slice(6, -2)
				const url = `https://www.familysearch.org/en/tree/person/details/${pid}`

				return (
					<a
						key={i}
						href={url}
						target="_blank"
						rel="noopener noreferrer"
						className="text-(--blue-accent) dark:text-(--blue-accent-soft) underline font-medium"
					>
						{pid}
					</a>
				)
			}

			// Mention
			if (part.startsWith('@')) {
				return (
					<span
						key={i}
						className="text-(--green-logo) dark:text-(--green-logo-soft) font-medium"
					>
						{part}
					</span>
				)
			}

			return <span key={i}>{part}</span>
		})
	}

	function renderNode(node: CommentNode, depth = 0) {
		const isOwner = node.authorId === currentUser.id

		return (
			<div key={node.id} className="mt-2">
				<div
					id={`comment-${node.id}`}
					className="flex gap-3 rounded bg-card p-3"
					style={{ marginLeft: depth * 36 }}
				>
					<div className="h-8 w-8 rounded-full overflow-hidden bg-muted">
						{node.authorImage && (
							<Image
								src={node.authorImage}
								alt={node.authorName}
								width={32}
								height={32}
							/>
						)}
					</div>

					<div className="flex-1">
						<div className="text-sm font-semibold">{node.authorName}</div>

						{editing?.id === node.id ? (
							<>
								{/* <Textarea
									value={editDraft}
									onChange={(e) => setEditDraft(e.target.value)}
								/> */}
								<Textarea
									value={editDraft}
									onChange={(e) => {
										let value = e.target.value

										value = value.replace(PID_REGEX, (_, raw) => {
											const pid = normalizePid(raw)
											return pid ? `[[PID:${pid}]]` : _
										})

										setEditDraft(value)
									}}
								/>

								<div className="mt-1 flex gap-2 text-xs">
									<button className="text-primary" onClick={submitEdit}>
										Save
									</button>
									<button onClick={() => setEditing(null)}>Cancel</button>
								</div>
							</>
						) : (
							<div className="whitespace-pre-wrap text-sm">
								{renderBody(node.body)}
							</div>
						)}

						<div className="mt-1 flex gap-3 text-xs text-muted-foreground">
							<button
								onClick={() => {
									setInlineReplyTo(node.id)
									setInlineDraft('')
								}}
							>
								Reply
							</button>
							{isOwner && (
								<>
									<button onClick={() => startEdit(node)}>Edit</button>
									<button
										className="text-destructive"
										onClick={() => handleDelete(node.id)}
									>
										Delete
									</button>
								</>
							)}
						</div>
						{inlineReplyTo === node.id && (
							<div className="mt-2 rounded border bg-muted/40 p-2 space-y-2">
								<div className="text-xs text-muted-foreground">
									Replying to <strong>{node.authorName}</strong>
								</div>

								<div className="relative">
									{inlineMentions.results.length > 0 && (
										<div className="absolute bottom-full mb-1 z-50 w-full max-h-40 overflow-auto rounded border bg-popover shadow">
											{inlineMentions.results.map((u) => (
												<button
													key={u.id}
													onClick={() => {
														const res = inlineMentions.insert(inlineDraft, u)
														if (!res) return
														setInlineDraft(res.next)
														inlineMentions.reset()
													}}
													className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
												>
													<span className="text-green-600 font-medium">
														@{u.value}
													</span>
													<span className="text-muted-foreground">
														{u.label}
													</span>
												</button>
											))}
										</div>
									)}

									<Textarea
										rows={2}
										autoFocus
										value={inlineDraft}
										onChange={(e) => {
											let value = e.target.value

											value = value.replace(PID_REGEX, (_, raw) => {
												const pid = normalizePid(raw)
												return pid ? `[[PID:${pid}]]` : _
											})

											setInlineDraft(value)

											inlineMentions.onChange(
												value,
												e.target.selectionStart ?? value.length
											)
										}}
										placeholder="Write a reply…use @ to type a user's name, ## to type a PID that links to FamilySearch."
									/>
								</div>

								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setInlineReplyTo(null)
											setInlineDraft('')
										}}
									>
										Cancel
									</Button>

									<Button
										size="sm"
										onClick={async () => {
											if (!inlineDraft.trim()) return

											const clientNonce = crypto.randomUUID()

											// optimistic insert
											setComments((prev) => [
												...prev,
												{
													id: clientNonce,
													clientNonce,
													__optimistic: true,
													authorId: currentUser.id,
													authorName: currentUser.name,
													authorImage: currentUser.image,
													body: inlineDraft,
													createdAt: new Date(),
													replyToCommentId: node.id,
												},
											])

											await onComment(inlineDraft, node.id, clientNonce)

											setInlineReplyTo(null)
											setInlineDraft('')
										}}
									>
										Reply
									</Button>
								</div>
							</div>
						)}
					</div>
				</div>

				{node.replies.map((r) => renderNode(r, depth + 1))}
			</div>
		)
	}

	useEffect(() => {
		if (!window.location.hash.startsWith('#comment-')) return

		const commentId = window.location.hash.replace('#comment-', '')

		fetch('/api/mentions/mark-read', {
			method: 'POST',
			body: JSON.stringify({ commentId }),
		})
	}, [])

	useEffect(() => {
		const hash = window.location.hash
		if (!hash.startsWith('#comment-')) return

		const el = document.querySelector(hash)
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' })
			el.classList.add('ring-2', 'ring-primary')

			setTimeout(() => {
				el.classList.remove('ring-2', 'ring-primary')
			}, 2000)
		}
	}, [])

	return (
		<div className="flex h-full flex-col">
			<header className="border-b bg-background p-4 space-y-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					{/* LEFT: Status + type */}
					<div className="flex items-center gap-2">
						<Badge className={statusMeta.className}>{statusMeta.label}</Badge>

						<span className="text-xs text-muted-foreground">{typeName}</span>
					</div>

					{/* RIGHT: Actions */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Claim / Unclaim */}
						{caseStatus !== 'archived' &&
							caseStatus !== 'solved' &&
							(investigating ? (
								<Button
									size="sm"
									variant="outline"
									onClick={async () => {
										setInvestigating(false)

										// optimistic: revert to open only if this user was last investigator
										setCaseStatus('open')

										try {
											await onUnclaim()
										} catch {
											setInvestigating(true)
											setCaseStatus('investigating')
										}
									}}
								>
									Unclaim
								</Button>
							) : (
								<Button
									size="sm"
									variant="default"
									onClick={async () => {
										setCaseStatus('investigating')
										setInvestigating(true)

										try {
											await onClaim()
										} catch {
											setCaseStatus(status)
											setInvestigating(false)
										}
									}}
								>
									I&apos;ll investigate this
								</Button>
							))}

						{/* Solve / Reopen */}
						{canSolve &&
							caseStatus !== 'archived' &&
							(caseStatus === 'solved' ? (
								<Button size="sm" variant="outline" onClick={handleReopen}>
									Reopen
								</Button>
							) : (
								<Button size="sm" onClick={handleMarkSolved}>
									Mark Solved
								</Button>
							))}
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto p-4 space-y-4">
				<p>{description}</p>
				<CaseAttachments attachments={attachments} />
				{commentTree.map((c) => renderNode(c))}
				<div ref={bottomRef} />
			</main>

			<footer className="border-t p-3 space-y-2">
				{replyTo && (
					<div className="rounded border p-2 text-xs">
						Replying to <strong>{replyTo.authorName}</strong>
						<button
							className="ml-2 text-primary"
							onClick={() => setReplyTo(null)}
						>
							Cancel
						</button>
					</div>
				)}

				<div className="relative">
					{/* {mentionResults.length > 0 && (
						<div className="absolute bottom-full mb-2 z-50 w-full max-h-48 overflow-auto rounded border bg-popover shadow">
							{mentionResults.slice(0, 6).map((u) => (
								<button
									key={u.id}
									onClick={() => insertMention(u)}
									className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
								>
									{u.image && (
										<Image
											src={u.image}
											alt={u.label}
											width={20}
											height={20}
											className="rounded-full"
										/>
									)}
									<span className="text-green-600 dark:text-green-400 font-medium">
										@{u.value}
									</span>
									<span className="text-muted-foreground">{u.label}</span>
								</button>
							))}
						</div>
					)} */}
					{footerMentions.results.length > 0 && (
						<div className="absolute bottom-full mb-2 z-50 w-full max-h-48 overflow-auto rounded border bg-popover shadow">
							{footerMentions.results.map((u) => (
								<button
									key={u.id}
									onClick={() => {
										const res = footerMentions.insert(draft, u)
										if (!res) return
										setDraft(res.next)
										footerMentions.reset()
									}}
									className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
								>
									<span className="text-green-600 font-medium">@{u.value}</span>
									<span className="text-muted-foreground">{u.label}</span>
								</button>
							))}
						</div>
					)}

					<Textarea
						rows={3}
						value={draft}
						onChange={(e) => {
							let value = e.target.value

							value = value.replace(PID_REGEX, (_, raw) => {
								const pid = normalizePid(raw)
								return pid ? `[[PID:${pid}]]` : _
							})

							setDraft(value)

							footerMentions.onChange(
								value,
								e.target.selectionStart ?? value.length
							)
						}}
						placeholder="Write a comment…use @ to type a user's name, ## to type a PID that links to FamilySearch."
					/>
				</div>

				<div className="flex justify-end">
					<Button onClick={handleSubmit} disabled={!draft.trim()}>
						Post Comment
					</Button>
				</div>
			</footer>
		</div>
	)
}

function useMentions(users: MentionUser[]) {
	const [query, setQuery] = useState('')
	const [anchor, setAnchor] = useState<number | null>(null)

	function onChange(value: string, cursor: number) {
		const before = value.slice(0, cursor)
		const match = before.match(/@([\w.-]{1,20})$/)

		if (match) {
			setQuery(match[1].toLowerCase())
			setAnchor(cursor - match[1].length - 1)
		} else {
			setQuery('')
			setAnchor(null)
		}
	}

	function insert(
		value: string,
		user: MentionUser
	): { next: string; reset: true } | null {
		if (anchor == null) return null

		const before = value.slice(0, anchor)
		const after = value.slice(anchor + query.length + 1)

		return {
			next: `${before}@${user.value} ${after}`,
			reset: true,
		}
	}

	const results = query
		? users.filter((u) => u.label.toLowerCase().includes(query)).slice(0, 6)
		: []

	return {
		query,
		results,
		anchor,
		onChange,
		insert,
		reset: () => {
			setQuery('')
			setAnchor(null)
		},
	}
}
