import {
	Document,
	Page,
	Text,
	View,
	StyleSheet,
	renderToBuffer,
} from '@react-pdf/renderer'
import type { SocialMediaConsentValues } from '@/components/forms/SocialMediaConsentForm'

const styles = StyleSheet.create({
	page: { padding: 32, fontSize: 11, lineHeight: 1.4 },
	header: { fontSize: 16, fontWeight: 700, marginBottom: 8 },
	subheader: { fontSize: 12, fontWeight: 600, marginTop: 12, marginBottom: 6 },
	label: { fontWeight: 600 },
	row: { marginBottom: 6 },
	box: { border: '1px solid #222', padding: 8, marginTop: 6 },
	muted: { color: '#555' },
	listItem: { marginBottom: 4 },
})

const TERMS = [
	'Grantor hereby irrevocably grants to Intellectual Reserve, Inc. (IRI) and its licensees, successors, and assigns consent and full right to interview Grantor; record or otherwise reproduce interviews; and to publish, distribute, perform, or otherwise use interview materials and related content in any media now known or later developed, worldwide and in perpetuity.',
	'Grantor agrees that Grantor has no right, title, or interest in any IRI work or publication produced under this Release, and makes no claim against IRI based on any use of these rights.',
	'Grantor will not issue or authorize publicity relating to this Release or IRI without prior written approval, and will not imply IRI endorsement of Grantor or any third party.',
	'Grantor represents and warrants that Grantor is free to enter into this Release and agrees to indemnify and hold IRI harmless from any losses arising from breach of this Release.',
	'This Release is governed by Utah law. Disputes will be handled first by mutual consultation; if unresolved, the parties agree to the jurisdiction of the courts in Utah.',
]

function ConsentDocument(data: SocialMediaConsentValues) {
	return (
		<Document>
			<Page size="LETTER" style={styles.page}>
				<Text style={styles.header}>Release to Use Image</Text>
				<Text style={styles.muted}>
					Intellectual Property Office - 50 E North Temple St RM 1888 - Salt Lake
					 City, UT 84150-3011
				</Text>
				<Text style={styles.muted}>Telephone 1-801-240-3959 - Fax 1-801-240-1187</Text>
				<Text style={styles.muted}>cor-intellectualproperty@ldschurch.org</Text>

				<Text style={styles.subheader}>Project Information</Text>
				<View style={styles.row}>
					<Text>
						<Text style={styles.label}>Grantor: </Text>
						{data.projectGrantor}
					</Text>
					<Text>
						<Text style={styles.label}>IPO number: </Text>
						{data.ipoNumber || '-'}
					</Text>
					<Text>
						<Text style={styles.label}>File number: </Text>
						{data.fileNumber || '-'}
					</Text>
				</View>

				<Text style={styles.subheader}>Parties to Release</Text>
				<View style={styles.row}>
					<Text>
						<Text style={styles.label}>Grantor name: </Text>
						{data.grantorName}
					</Text>
					<Text>
						<Text style={styles.label}>Telephone: </Text>
						{data.grantorPhone}
					</Text>
					<Text>
						<Text style={styles.label}>Photographer: </Text>
						{data.photographerName || '-'}
					</Text>
					<Text>
						<Text style={styles.label}>Address: </Text>
						{data.grantorAddress}
					</Text>
					<Text>
						<Text style={styles.label}>Description of product: </Text>
						{data.description}
					</Text>
				</View>

				<Text style={styles.subheader}>Terms and Conditions</Text>
				<View style={styles.box}>
					{TERMS.map((term) => (
						<Text key={term} style={styles.listItem}>
							- {term}
						</Text>
					))}
					<Text>
						By signing below, Grantor warrants and represents that he or she has read
						 this Release, understands its contents, and has the legal capacity to
						 execute this Release.
					</Text>
				</View>

				<Text style={styles.subheader}>Signatures</Text>
				<View style={styles.row}>
					<Text>
						<Text style={styles.label}>Grantor signature: </Text>
						{data.grantorSignature}
					</Text>
					<Text>
						<Text style={styles.label}>Date: </Text>
						{data.grantorDate}
					</Text>
				</View>

				{data.isMinor && (
					<View>
						<Text style={styles.subheader}>Parental Consent</Text>
						<View style={styles.row}>
							<Text>
								<Text style={styles.label}>Parent/guardian: </Text>
								{data.parentName}
							</Text>
							<Text>
								<Text style={styles.label}>Telephone: </Text>
								{data.parentPhone || '-'}
							</Text>
							<Text>
								<Text style={styles.label}>Address: </Text>
								{data.parentAddress || '-'}
							</Text>
							<Text>
								<Text style={styles.label}>Signature: </Text>
								{data.parentSignature}
							</Text>
							<Text>
								<Text style={styles.label}>Date: </Text>
								{data.parentDate}
							</Text>
						</View>
					</View>
				)}

				{data.additionalGrantors?.length ? (
					<View>
						<Text style={styles.subheader}>Additional Grantors</Text>
						{data.additionalGrantors.map((grantor, index) => (
							<View key={`${grantor.name}-${index}`} style={styles.box}>
								<Text>
									<Text style={styles.label}>Grantor name: </Text>
									{grantor.name || '-'}
								</Text>
								<Text>
									<Text style={styles.label}>Telephone: </Text>
									{grantor.phone || '-'}
								</Text>
								<Text>
									<Text style={styles.label}>Address: </Text>
									{grantor.address || '-'}
								</Text>
								<Text>
									<Text style={styles.label}>Signature: </Text>
									{grantor.signature || '-'}
								</Text>
								<Text>
									<Text style={styles.label}>Date: </Text>
									{grantor.date || '-'}
								</Text>
								{grantor.parentName && (
									<View style={{ marginTop: 6 }}>
										<Text>
											<Text style={styles.label}>Parent/guardian: </Text>
											{grantor.parentName}
										</Text>
										<Text>
											<Text style={styles.label}>Parent signature: </Text>
										{grantor.parentSignature || '-'}
										</Text>
										<Text>
											<Text style={styles.label}>Parent date: </Text>
										{grantor.parentDate || '-'}
										</Text>
									</View>
								)}
							</View>
						))}
					</View>
				) : null}
			</Page>
		</Document>
	)
}

export async function renderSocialMediaConsentPdf(data: SocialMediaConsentValues) {
	return renderToBuffer(<ConsentDocument {...data} />)
}
