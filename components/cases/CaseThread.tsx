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
	onSolve: () => void
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
	onSolve,
	onComment,
	attachments,
}: Props) {
	const [comments, setComments] = useState<Comment[]>(initialComments)
	const [draft, setDraft] = useState('')
	const [replyTo, setReplyTo] = useState<Comment | null>(null)
	const [editing, setEditing] = useState<Comment | null>(null)
	const [editDraft, setEditDraft] = useState('')
	const bottomRef = useRef<HTMLDivElement | null>(null)

	/* ================= MENTIONS ================= */

	const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([])
	const [mentionQuery, setMentionQuery] = useState('')
	const [mentionAnchor, setMentionAnchor] = useState<number | null>(null)

	useEffect(() => {
		fetch('/api/mentions')
			.then((r) => r.json())
			.then(setMentionUsers)
	}, [])

	function handleDraftChange(value: string) {
		setDraft(value)

		const cursor = value.length
		const before = value.slice(0, cursor)
		const match = before.match(/@([\w.-]{1,20})$/)

		if (match) {
			setMentionQuery(match[1].toLowerCase())
			setMentionAnchor(cursor - match[1].length - 1)
		} else {
			setMentionQuery('')
			setMentionAnchor(null)
		}
	}

	const mentionResults = useMemo(() => {
		if (!mentionQuery) return []
		return mentionUsers.filter((u) =>
			u.label.toLowerCase().includes(mentionQuery)
		)
	}, [mentionQuery, mentionUsers])

	function insertMention(user: MentionUser) {
		if (mentionAnchor == null) return

		const before = draft.slice(0, mentionAnchor)
		const after = draft.slice(mentionAnchor + mentionQuery.length + 1)

		setDraft(before + '@' + user.value + ' ' + after)
		setMentionQuery('')
		setMentionAnchor(null)
	}

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

	/* ================= RENDER ================= */
	function renderBody(text: string) {
		return text.split(/(@[\w.-]+)/g).map((part, i) =>
			part.startsWith('@') ? (
				<span
					key={i}
					className="text-green-600 dark:text-green-400 font-medium"
				>
					{part}
				</span>
			) : (
				<span key={i}>{part}</span>
			)
		)
	}

	function renderNode(node: CommentNode, depth = 0) {
		const isOwner = node.authorId === currentUser.id

		return (
			<div key={node.id}>
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
								<Textarea
									value={editDraft}
									onChange={(e) => setEditDraft(e.target.value)}
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
							<button onClick={() => setReplyTo(node)}>Reply</button>
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
			<header className="border-b p-4 space-y-1">
				<div className="flex justify-between">
					<h1 className="text-lg font-bold">{title}</h1>
					<Badge>{status}</Badge>
				</div>
				<div className="text-sm text-muted-foreground">
					{typeName} • Submitted by {submitterName}
				</div>
				{canSolve && status !== 'solved' && (
					<Button size="sm" onClick={onSolve}>
						Mark Solved
					</Button>
				)}
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
					{mentionResults.length > 0 && (
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
					)}

					<Textarea
						rows={3}
						value={draft}
						onChange={(e) => handleDraftChange(e.target.value)}
						placeholder="Write a comment…"
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
