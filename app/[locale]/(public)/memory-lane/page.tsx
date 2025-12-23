// app/[locale]/(public)/memory-lane/page.tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

export default function MemoryLanePage() {
	return (
		<div className="p-4 space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Memory Lane</h1>
				<p className="text-sm text-muted-foreground max-w-3xl">
					Digitizing options available at the Burley FamilySearch Center to
					preserve photos, film, audio, and video.
				</p>
			</div>

			<Card>
				<CardHeader className="text-xl font-bold">
					Epson FastFoto 680
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							This scanner will scan hundreds of photos per hour. Sizes up to 8
							1/2 x 36. There are automatic photo enhancement options as well.
							This is a sheet fed scanner, so photos much be out of the sheet
							protectors prior to loading into the machine. And it will also
							scan documents, including turning multiple page family history
							copies into a single document. Formats include tiff, pdf, and jpg
							with customized resolution from 300-1200 dpi{' '}
						</p>
						<p>We have two of these scanners.</p>
						<p>Bring your own flash drive to save your photos and documents.</p>
						<Link
							href="https://epson.com/For-Home/Scanners/Photo-Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System/p/B11B237201?utm_medium=cpc&utm_source=google&utm_campaign=Brand%2BPLA%2BScanner%2BUS%2BENG%2BSEARCH&utm_adgroup=Retail%2BPhoto+(new)&utm_term=PRODUCT_GROUP&cq_cmp=71700000059732274&cq_net=&gclid=CjwKCAjw0N6hBhAUEiwAXab-TWtLgggidWwcYOlZ_Ir8Uzr1xOPVFVkwBv7c8VinsCNP6vXFIjImThoCZP0QAvD_BwE&gclsrc=aw.ds"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/epson-fastfoto-680.jpeg"
							alt="Epson FastFoto 680"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Wolverine 8 mm and Super 8 reels MovieMaker Pro Film Digitizer
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/wolverine-8mm.jpeg"
							alt="Wolverine 8mm"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							This machine does a frame-by-frame digitization of the old 8 mm or
							Super 8 mm movie reels. This is a stand alone machine (no computer
							required). As it is a frame by frame process, it takes about 25
							minutes to complete a small movie reel. The resulting movie is
							about 3-3 1/2 minutes long. If you have the larger reels, plan on
							it taking 5-8 hours to digitize.
						</p>
						<p>
							We have two of these machines- only one of them will accommodate
							the largest reels.{' '}
						</p>
						<p>
							This machine uses a SD card (which is available for use at the
							center.) Bring your own flash drive so your movies can be
							transferred there.{' '}
						</p>
						<Link
							href="https://www.wolverinedata.com/products/MovieMaker_Pro"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Wolverine Titan 8-1 Film Digitizer
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							This machine is a stand alone device (no computer required). It
							will digitize 35 mm, 127, 126, and 110 negatives and slides. This
							machine is really fast, each takes about 3 seconds. Although when
							modifications for color, brightness and contrast are made the
							process is much slower.
						</p>
						<p>
							We have two of these machines available and also have a fast
							feeder slide adaptor for them.
						</p>
						<p>
							This machine uses a SD card (which is available for use at the
							center) Bring your own flash drive so your movies can be
							transferred there.{' '}
						</p>
						<Link
							href="https://www.wolverinedata.com/products/titan-8-in-1-high-definition-film-to-digital-converter"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/wolverine-titan.jpeg"
							alt="Wolverine Titan"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					NAXA Cassette to Digital Convertor and Player
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/naxa-cassette.jpeg"
							alt="NAXA Cassette"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							This converts audio cassette into mp3 digital files. Note: if
							wishing to upload to FamilySearch an additional conversion step is
							required and limit your recording to about 8-9 minutes to stay
							within the 15 mb file limit. Super easy with one click saves
							directly onto your flash drive. Bring your own flash drive.
						</p>
						<Link
							href="https://www.hammacher.com/product/cassette-to-digital-converter-and-player?promo=search"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
						<p>
							Reel audios or cassette tapes. This machine will digitize them and
							they can be edited using the Audacity software available at the
							center.
						</p>

						<Link
							href="https://manual.audacityteam.org/man/how_to_use_audacity.html"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Elgato Video Conversion
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							Using the Elgato Software we can digitize any of your old movie
							formats. DVD, VHS, VHS-C, 8 mm cassette and the Mini DV cassettes.
							By using the VHS/DVD machine for DVD, VHS and VHS-C. Using the
							Canon or Sharp cameras for 8 mm cassette movies. Or using the JVC
							Mini DV for the mini DV. Each is hooked up to the Elgato convertor
							and the laptop. Movies are saved on the computer and then
							transferred to your flash drive.
						</p>
						<p>Bring your own flash drive to take your movie home.</p>

						<Link
							href="https://www.elgato.com/en/video-capture"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/elgato.jpeg"
							alt="Elgato Video Conversion"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					Epson Flatbed Scanner
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/epson-flatbed.jpg"
							alt="Epson Flatbed Scanner"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							This is an all in one scanner. It will scan photos, slides,
							negatives, documents, newspaper clippings, books, etc. With
							Digital ICE technology to remove appearance of dust, tears and
							fading on photos. Resolution options from 100 to 6400 dpi for high
							quality enlargements.
						</p>
						<p>We have two of these machines.</p>

						<Link
							href="https://epson.com/For-Home/Scanners/Photo-Scanners/Epson-Perfection-V600-Photo-Scanner/p/B11B198011"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="text-xl font-bold">
					CZUR Aura Book Scanner
				</CardHeader>
				<CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
					<div className="col-span-1 lg:col-span-2 space-y-4">
						<p>
							It will scan about anything including larger sized photos and
							documents that don&apos;t fit in our other scanners. With the
							software some adjustments can be made and then saved to word
							document, excel spreadsheet, tiff, jpeg, pdf and even a searchable
							pdf. Think of the possibilities! Come check out our newest
							addition. Auto page-curve flattening and OCR. Thanks to Cameron
							Briggs letting us borrow these.
						</p>
						<p>
							We have two of these scanners. One available for checkout. There
							is also a lighted tent that you can use to take photos with your
							phone&apos;s camera for crisper images as well.
						</p>
						<p>Bring your own flash drive to save your photos and documents.</p>
						<Link
							href="https://epson.com/For-Home/Scanners/Photo-Scanners/FastFoto-FF-680W-Wireless-High-speed-Photo-Scanning-System/p/B11B237201?utm_medium=cpc&utm_source=google&utm_campaign=Brand%2BPLA%2BScanner%2BUS%2BENG%2BSEARCH&utm_adgroup=Retail%2BPhoto+(new)&utm_term=PRODUCT_GROUP&cq_cmp=71700000059732274&cq_net=&gclid=CjwKCAjw0N6hBhAUEiwAXab-TWtLgggidWwcYOlZ_Ir8Uzr1xOPVFVkwBv7c8VinsCNP6vXFIjImThoCZP0QAvD_BwE&gclsrc=aw.ds"
							target="_blank"
						>
							<Button>More Information</Button>
						</Link>
					</div>
					<div className="relative w-full h-96 flex items-center justify-center">
						<Image
							src="/czur-aura.jpeg"
							alt="Czur Aura Scanner"
							fill
							className="object-cover object-center border-4 border-background rounded-2xl shadow-lg"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
