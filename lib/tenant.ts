export function getTenantKey() {
	return (
		process.env.SITE_TENANT_KEY ??
		process.env.NEXT_PUBLIC_SITE_TENANT_KEY ??
		'default'
	)
}
