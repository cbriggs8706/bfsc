//types/newsletters.ts

export type NewsletterLocale = 'en' | 'es' | 'pt'

export const NEWSLETTER_LOCALES: NewsletterLocale[] = ['en', 'es', 'pt']

export type RichTextHTML = string

export type NewsletterFormMode = 'create' | 'update' | 'read' | 'delete'

export type NewsletterEditorData = {
	id?: string
	slug: string
	status: 'draft' | 'published'
	featured: boolean
	featuredOrder?: string | null
	coverImageUrl?: string | null
	publishedAt?: Date | null

	translations: {
		en: {
			title: string
			excerpt?: string
			content: RichTextHTML
		}
		es: {
			title: string
			excerpt?: string
			content: RichTextHTML
		}
		pt: {
			title: string
			excerpt?: string
			content: RichTextHTML
		}
	}

	tagIds: string[]
	categoryIds: string[]
}

export type NewsletterTranslationInput = {
	title: string
	excerpt: string
	content: RichTextHTML
}

export type NewsletterFormData = {
	id?: string

	slug: string
	status: 'draft' | 'published'
	featured: boolean
	featuredOrder: string | null
	coverImageUrl: string | null
	publishedAt: Date | null

	translations: Record<NewsletterLocale, NewsletterTranslationInput>

	tagIds: string[]
	categoryIds: string[]
}

export const EMPTY_NEWSLETTER_FORM: NewsletterFormData = {
	slug: '',
	status: 'draft',
	featured: false,
	featuredOrder: null,
	coverImageUrl: null,
	publishedAt: null,

	translations: {
		en: { title: '', excerpt: '', content: '' },
		es: { title: '', excerpt: '', content: '' },
		pt: { title: '', excerpt: '', content: '' },
	},

	tagIds: [],
	categoryIds: [],
}
