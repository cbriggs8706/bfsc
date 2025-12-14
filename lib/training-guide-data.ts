export type TrainingResource = {
	label: string
	href?: string
}

export type TrainingSection = {
	id: string
	title: string
	items: TrainingResource[]
}

export const TRAINING_GUIDE_TITLE =
	'Training Guide for New Workers/ Helps for Others' as const

export const TRAINING_GUIDE_INTRO = [
	'Although this was originally designed to be used by trainers in teaching new workers at the center, it can be used by anyone wishing to learn more about FamilySearch. Each of the sections applies to a specific topic, if one already understands that topic, they can skip to the next section. If they desire to learn more about that topic, the links go to tutorials (videos), the Family History Guide, or to Knowledge or blog articles written by FamilySearch. It is not necessary to do all of the learning options for each section. As each person learns differently, pick the options that make the most sense to their learning style. Clicking the links will take one directly to that website.',
	'Note: Some of the articles and activities on the Family History Guide haven’t been updated as of 1 Sept 2022 to show the new person page. These are the most updated links available at this time. The guide will continue to be updated as new pages are added or updated.',
	'For those completing this on their own, if more assistance is needed, come to the center for one to one assistance or attend some of the numerous classes offered at the center.',
	'Note: Using beta.familysearch.org is a great option to practice these skills. Changes made there do not affect familysearch.org. So one may practice whatever skills they wish in beta.familysearch.org to get comfortable before working in familysearch.org It’s the same username and password to sign in there. As this is a beta website, sometimes there are issues when working within it. If you have problems with functionality, wait a couple of days and try the activity again. This is also a great resource for consultants in assisting others as they can take patrons directly to the websites to answer their questions.',
] as const

export const TRAINING_GUIDE_SECTIONS: TrainingSection[] = [
	{
		id: 'accounts',
		title: 'Accounts',
		items: [
			{
				label: 'Log into FamilySearch and personalize your settings',
			},
			{
				label: 'BYU Family History Tutorial -Registration and Settings',
				href: 'https://fh.lib.byu.edu/2022/04/13/familysearch-registration-and-settings-apr-2022/',
			},
			{
				label: 'Family History Guide Project 1 Goal 13 - Choice A',
				href: 'https://www.thefhguide.com/project-1-family-tree13.html',
			},
			{
				label: 'How to set up a new account',
			},
			{
				label: 'BYU Family History Tutorial - Registration and Settings',
				href: 'https://fh.lib.byu.edu/2022/04/13/familysearch-registration-and-settings-apr-2022/',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-create-a-free-familysearch-account',
			},
			{
				label: 'How to help someone recover a password or username.',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/i-forgot-my-familysearch-password-or-username',
			},
			{
				label: 'Creating a child’s account',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-create-a-free-account-for-a-child',
			},
		],
	},
	{
		id: 'navigating-family-search',
		title: 'Navigating Family Search',
		items: [
			{
				label:
					'Navigate the home page (including the magic button - return to home page when clicking on FamilySearch icon)',
			},
			{
				label: 'BYU Family History Tutorial -FamilySearch Homepage',
				href: 'https://fh.lib.byu.edu/2018/08/16/familysearch-tree-overview-3-mar-2018/',
			},
			{
				label:
					'Family History Guide Project 1 Goal 1 - Navigating FamilySearch',
				href: 'https://www.thefhguide.com/project-1-family-tree.html',
			},
			{
				label: 'Navigating FamilySearch Quiz',
				href: 'https://www.thefhguide.com/Quizzes/FS1-1/index.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-features-are-on-my-home-page',
			},
			{
				label:
					'Open and navigate the Tree views [Landscape, Portrait, Fan Chart (including all options) and Descendancy]',
			},
			{
				label: 'BYU Family History Tutorial - FamilySearch Pedigree Views',
				href: 'https://fh.lib.byu.edu/2022/07/13/familysearch-pedigree-views-vivien-brown-3-jul-2022/',
			},
			{
				label: 'Family History Guide Project 1 Goal 5 - Choices A and B',
				href: 'https://www.thefhguide.com/project-1-family-tree05.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Different Views',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-are-the-different-pedigree-views-in-family-tree',
			},
			{
				label: 'Understand the Privacy Rules for FamilySearch',
			},
			{
				label: 'Family History Guide Project 1 Goal 1 - Choice E',
				href: 'https://www.thefhguide.com/project-1-family-tree.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-is-a-private-space-in-family-tree',
			},
			{
				label: 'Navigate a Summary Card',
			},
			{
				label: 'Family History Guide Project 1 Goal 2 - Choice A',
				href: 'https://www.thefhguide.com/project-1-family-tree02.html',
			},
			{
				label: 'Navigate a Person Page',
			},
			{
				label: 'Family History Guide Project 1 Goal 2 - Choice B',
				href: 'https://www.thefhguide.com/project-1-family-tree02.html',
			},
			{
				label: 'Family History Guide Project 1 Goal 3 - Choices B and C',
				href: 'https://www.thefhguide.com/project-1-family-tree03.html',
			},
			{
				label: 'FamilySearch Knowledge Article - New Person Page August 2022',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/the-new-person-page-in-family-tree',
			},
			{
				label: 'FamilySearch Knowledge Article -Person Page FAQ',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/frequently-asked-questions-about-the-new-person-page',
			},
			{
				label: 'Find someone in your Family Tree- by name and by ID',
			},
			{
				label: 'Family History Guide Project 1 Goal 4 - Choice A',
				href: 'https://www.thefhguide.com/project-1-family-tree04.html',
			},
			{
				label: 'FamilySearch Blog Article - Using Person ID (old screenshots)',
				href: 'https://www.familysearch.org/en/blog/familysearch-person-id-numbers',
			},
			{
				label: 'Use the Recent Menu',
			},
			{
				label: 'Family History Guide Project 1 Goal 4 - Choice B',
				href: 'https://www.thefhguide.com/project-1-family-tree04.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-find-the-records-i-last-viewed-in-family-tree',
			},
			{
				label: 'Adding People to FamilySearch',
			},
			{
				label: 'Family History Guide Project 1 Goal 7 - Choices A and B',
				href: 'https://www.thefhguide.com/project-1-family-tree07.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Adding a spouse',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-a-spouse-or-partner-in-family-tree',
			},
			{
				label: 'FamilySearch Knowledge Article - Adding a child',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-a-child-to-family-tree',
			},
			{
				label: 'FamilySearch Knowledge Article - Adding a parent',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-a-parent-in-family-tree',
			},
			{
				label:
					'FamilySearch Knowledge Article - Adding step, foster, adoptive child',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-step-adopted-and-foster-parents-to-a-child-in-family-tree',
			},
			{
				label:
					'Optional- Complete Project #1 Activity in beta.familysearch.org to add persons Project #1 Activity',
				href: 'https://docs.google.com/document/d/1yPWRvdtLD6p9KljTWQa8vJYwHzUZltMBPsjjztAB5o0/edit?usp=sharing',
			},
		],
	},
	{
		id: 'editing-on-familysearch',
		title: 'Editing on FamilySearch',
		items: [
			{
				label: 'Editing person vitals, marriage, and relationships',
			},
			{
				label: 'FamilySearch Knowledge Article - Edit vital information',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-change-vital-information-in-family-tree',
			},
			{
				label: 'FamilySearch Knowledge Article - Edit children relationships',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-correct-parent-child-relationships-in-family-tree',
			},
			{
				label:
					'FamilySearch Knowledge Article - Edit or add marriage information',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-or-change-marriage-information-in-family-tree',
			},
			{
				label: 'Standardization of dates and places',
			},
			{
				label: 'FamilySearch Knowledge Article - Standardization information',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-enter-dates-and-places-into-family-tree',
			},
			{
				label: 'Editing Teaching/Learning Options',
			},
			{
				label: 'BYU Family History Tutorials - Editing Facts and Relationships',
				href: 'https://fh.lib.byu.edu/2018/08/16/editing-facts-and-relationships-in-familysearch/',
			},
			{
				label: 'Family History Guide Project 1 Goal 6 - All Choices',
				href: 'https://www.thefhguide.com/project-1-family-tree06.html',
			},
			{
				label:
					'Optional - Complete Project #2 Activity in beta.familysearch.org to practice editing relationships. Project #2 Activity',
				href: 'https://docs.google.com/document/d/1M7rMIwakUH3XhG1s1W-nYrnr8n15n85F9Q73N2lNJ58/edit?usp=sharingM7rMIwakUH3XhG1s1W-nYrnr8n15n85F9Q73N2lNJ58/edit?usp=sharing',
			},
		],
	},
	{
		id: 'sources-on-familysearch',
		title: 'Sources on FamilySearch',
		items: [
			{
				label: 'How to use the Record Hints',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-attach-record-hints-in-family-tree',
			},
			{
				label: 'How to use the Tasks',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-are-all-the-different-tasks-lists-in-the-family-tree',
			},
			{
				label:
					'How to search on FamilySearch and Ancestry using those options on the Person Page, including using the filters',
			},
			{
				label: 'FamilySearch Blog Article - Using the Search Page',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-attach-a-historical-record-to-a-person-in-family-tree',
			},
			{
				label:
					'How to use RecordSeek to attach sources from ancestry (or other websites) to FamilySearch',
			},
			{
				label: 'FamilySearch Wiki Article',
				href: 'https://www.familysearch.org/en/wiki/RecordSeek',
			},
			{
				label: 'Record Seek website',
				href: 'https://recordseek.com/index.html',
			},
			{
				label:
					'YouTube Video on using Record Seek - this is from 2018 so screenshots are old, but the process is the same.',
				href: 'https://www.youtube.com/watch?v=rMXc2UkoYmQ',
			},
			{
				label: "Alice Child's Article with screenshots",
				href: 'https://alicechilds.com/use-recordseek-to-quickly-record-a-website-as-a-source-at-familysearch-and-ancestry/',
			},
			{
				label: 'How to use the “Similar Historical Records Tool”',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-view-similar-records-when-searching-historical-records-online',
			},
			{
				label: 'FamilySearch Blog Article - old screen shots',
				href: 'https://www.familysearch.org/en/blog/record-searches-easier-with-new-tool-now-you-can-see-similar-historical-records',
			},
			{
				label: 'Sources- Teaching/Learning Options',
			},
			{
				label: 'BYU Family History Tutorials - FamilySearch.org',
				href: 'https://fh.lib.byu.edu/2018/08/16/familysearch-updated-oct-2017/',
			},
			{
				label: 'BYU Family History Tutorials - Adding Sources',
				href: 'https://fh.lib.byu.edu/2018/08/16/adding-sources-in-familysearch-tree-30-nov-2016/',
			},
			{
				label: 'Family History Guide Project 1 Goal 8 - Add Sources',
				href: 'https://www.thefhguide.com/project-1-family-tree08.html',
			},
			{
				label:
					'Family History Guide Project 1 Goal 9 - All Choices - Record Hints and Attaching Sources',
				href: 'https://www.thefhguide.com/project-1-family-tree09.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Attaching Historical Records',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-attach-a-historical-record-to-a-person-in-family-tree',
			},
			{
				label:
					'SourceLinking101 - Several short videos done by Cameron Briggs for different skill levels and many different options.',
				href: 'https://www.sourcelinker101.com/home',
			},
			{
				label: '4 minute video',
				href: 'https://www.youtube.com/watch?v=PDLXi7PzhBA',
			},
			{
				label: '65 minute video',
				href: 'https://www.youtube.com/watch?v=OPBA0-yIbag',
			},
			{
				label: 'Link to download extension',
				href: 'https://www.goldiemay.com/',
			},
		],
	},
	{
		id: 'merging-and-separating-on-familysearch',
		title: 'Merging and Separating on FamilySearch',
		items: [
			{
				label:
					'Merging [Use beta.familysearch.org to find and merge duplicates]',
			},
			{
				label: 'BYU Family History Tutorials - Merging Duplicates',
				href: 'https://fh.lib.byu.edu/2020/01/11/merging-duplicates-in-familysearch-tree/',
			},
			{
				label: 'Family History Guide Project 1 Goal 11 - Merging',
				href: 'https://www.thefhguide.com/project-1-family-tree11.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Are they the same person?',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-decide-if-two-records-in-family-tree-are-about-the-same-person',
			},
			{
				label: 'FamilySearch Knowledge Article - Using Merge by ID',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-merge-duplicates-in-family-tree-by-id',
			},
			{
				label:
					'Optional- Complete Project #3 Activity in beta.familysearch.org to practice merging. Project #3 Activity',
				href: 'https://docs.google.com/document/d/1AJ6DOMKo7dcRQTzdIyKFPhsYUTvQHjr_udxCFWdtjhw/edit?usp=sharing',
			},
			{
				label: 'Separating',
			},
			{
				label:
					'FamilySearch Knowledge Article - Fixing a record with multiple people',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-fix-a-merge-that-has-information-from-multiple-people-in-family-tree',
			},
			{
				label: 'FamilySearch Knowledge Article - Undo a merge',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-undo-a-merge-in-family-tree',
			},
		],
	},
	{
		id: 'temple-ordinances',
		title: 'Temple Ordinances',
		items: [
			{
				label: 'How to use Ordinances Ready',
			},
			{
				label: 'BYU Family History Tutorial - Using Ordinance Ready',
				href: 'https://fh.lib.byu.edu/2018/08/16/ordinancesready/',
			},
			{
				label: 'Family History Guide LDS Goal 2 - Choice A',
				href: 'https://www.thefhguide.com/lds02.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-find-family-names-for-the-temple-with-ordinances-ready',
			},
			{
				label: 'Temple Reservation Policies',
			},
			{
				label: 'Family History Guide LDS Goal 1 - Choice C',
				href: 'https://www.thefhguide.com/lds.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/individuals-for-whom-i-can-request-temple-ordinances',
			},
			{
				label: 'Information required to Temple Ordinances',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-information-is-required-to-do-temple-ordinances-for-my-ancestors',
			},
			{
				label:
					'110 year rule : what it is and how to provide permission [copies in the binder on the reception desk]',
			},
			{
				label: 'Family History Guide LDS Goal 1 - Choice C',
				href: 'https://www.thefhguide.com/lds.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-request-ordinances-for-an-ancestor-who-was-born-in-the-last-110-years',
			},
			{
				label: 'Temple icons and their meanings',
			},
			{
				label: 'Family History Guide LDS Goal 1 - Choice A',
				href: 'https://www.thefhguide.com/lds.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-do-the-different-temple-icons-and-statuses-mean',
			},
			{
				label: 'Importance of sharing temple ordinances with the temple',
			},
			{
				label: 'Family History Guide LDS Goal 6 - Choices A and B',
				href: 'https://www.thefhguide.com/lds06.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-share-a-family-name-with-the-temple',
			},
		],
	},
	{
		id: 'memories',
		title: 'Memories',
		items: [
			{
				label: 'Memories',
			},
			{
				label: 'BYU Family History Tutorials - Adding Memories',
				href: 'https://fh.lib.byu.edu/2018/08/16/adding-memories-in-familysearch-tree-23-may-2018/',
			},
			{
				label: 'How to browse Memories for an individual person',
			},
			{
				label: 'Family History Guide Project 2 Goal 4',
				href: 'https://www.thefhguide.com/project-2-memories04.html',
			},
			{
				label:
					'How to use the fan chart to find ancestors with stories and photos',
			},
			{
				label: 'How to change a portrait photo',
			},
			{
				label: 'Family History Guide Project 2 Goal 4 - Choice B',
				href: 'https://www.thefhguide.com/project-2-memories04.html',
			},
			{
				label:
					'How to upload memories to the gallery and/or to a specific person',
			},
			{
				label: 'Family History Guide Project 2 Goal 5 - Choice A',
				href: 'https://www.thefhguide.com/project-2-memories06.html',
			},
			{
				label:
					'FamilySearch Knowledge Article - Uploading Photos and Documents',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-upload-photos-or-documents-to-memories',
			},
			{
				label:
					'How to tag, edit, add information to, and the way to manipulate a photo in FamilySearch',
			},
			{
				label: 'Family History Guide Project 2 Goal 6 Choices B, C, D, and E',
				href: 'https://www.thefhguide.com/project-2-memories06.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Adding Photo to Stories',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-add-an-image-to-the-story-i-created',
			},
			{
				label: 'How to add Documents',
			},
			{
				label: 'Family History Guide Project 2 Goal 7',
				href: 'https://www.thefhguide.com/project-2-memories07.html',
			},
			{
				label:
					'FamilySearch Knowledge Article - Adding Documents and Photos (same as above)',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-upload-photos-or-documents-to-memories',
			},
			{
				label: 'How to add Stories',
			},
			{
				label: 'Family History Guide Project 2 Goal 8',
				href: 'https://www.thefhguide.com/project-2-memories08.htmlmemories07.html',
			},
			{
				label: 'FamilySearch Knowledge Article - How to Tag Stories and Audios',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-tag-people-in-stories-and-audio-files',
			},
			{
				label: 'How to add Audio',
			},
			{
				label: 'Family History Guide Project 2 Goal 10',
				href: 'https://www.thefhguide.com/project-2-memories10.htmlmories08.html',
			},
			{
				label:
					'FamilySearch Knowledge Article - How to Tag Stories and Audios (same as above)',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-tag-people-in-stories-and-audio-files',
			},
			{
				label: 'How to use the Gallery and Albums',
			},
			{
				label: 'Family History Guide Project 2 Goal 11',
				href: 'https://www.thefhguide.com/project-2-memories11.html',
			},
			{
				label: 'How to use the FamilySearch Memories app for memories',
			},
			{
				label: 'Downloading App',
			},
			{
				label: 'Family History Guide Memories App Goal 1 - Choice A',
				href: 'https://www.thefhguide.com/project-2-memories-app.html',
			},
			{
				label: 'FamilySearch Knowledge Article - Downloading the App',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-download-familysearch-mobile-apps',
			},
			{
				label: 'FamilySearch Knowledge Article - What the app does',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-are-the-features-of-the-family-tree-and-memories-mobile-apps',
			},
			{
				label: 'Uploading Photos with Memories app',
			},
			{
				label: 'Family History Guide Memories App Goal 1 -Choices B, C, D',
				href: 'https://www.thefhguide.com/project-2-memories-app.html',
			},
			{
				label: 'Adding Documents with Memories app',
			},
			{
				label: 'Family History Guide Memories App Goal 3 -Choice A',
				href: 'https://www.thefhguide.com/project-2-memories-app03.html',
			},
			{
				label: 'Adding Audio with Memories app',
			},
			{
				label: 'Family History Guide Memories App Goal 4 - Choice A',
				href: 'https://www.thefhguide.com/project-2-memories-app04.html',
			},
		],
	},
	{
		id: 'descendancy-research',
		title: 'Descendancy Research',
		items: [
			{
				label: 'Descendancy View for research options',
			},
			{
				label: 'How to use to find and attach record hints',
			},
			{
				label: 'Family History Guide Project 3 Goal 2',
				href: 'https://www.thefhguide.com/project-3-descendants02.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-does-the-descendancy-view-do-in-family-tree',
			},
			{
				label: 'How to use for data problems',
			},
			{
				label: 'FamilySearch Knowledge Article (same as above)',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-does-the-descendancy-view-do-in-family-tree',
			},
			{
				label: 'Descendancy Research for missing cousins',
			},
			{
				label: 'How to use it to find potential holes in the tree',
			},
			{
				label:
					'BYU Family History Tutorial - Descendancy Research in FamilySearch',
				href: 'https://fh.lib.byu.edu/2018/08/16/descendancy-research-in-familysearch/',
			},
			{
				label: 'Family History Guide Project 3 Goal 1',
				href: 'https://www.thefhguide.com/project-3-descendants.html',
			},
			{
				label: 'What is Descendancy Research - Choice A',
			},
			{
				label: 'Choose a Descendancy Ancestor- Choice B',
			},
			{
				label: 'Use Descendancy View- Choice C',
			},
			{
				label: 'Optional- Show how to use Puzzilla',
			},
			{
				label: 'BYU Family History Tutorial - Descendancy Research in Puzzilla',
				href: 'https://fh.lib.byu.edu/2018/08/16/descendancy-research-in-puzilla/',
			},
			{
				label: 'Family History Guide Project 3 Goal 3 - Using Puzzilla',
				href: 'https://www.thefhguide.com/project-3-descendants03.html',
			},
			{
				label: 'FamilySearch Knowledge Article',
				href: 'https://www.familysearch.org/en/blog/puzzilla-premium-services-are-free-at-family-history-centers',
			},
			{
				label: 'Family History Fanatics- youtube.com',
				href: 'https://www.youtube.com/watch?v=8QEMhuTEUb0',
			},
			{
				label: 'Descendancy Research Video',
				href: 'https://www.familysearch.org/en/help/helpcenter/lessons/descendancy-research',
			},
			{
				label: 'Using the Research Wiki',
			},
			{
				label: 'BYU Family History Class - Using the Wiki and Catalog',
				href: 'https://fh.lib.byu.edu/2020/06/05/how-to-use-the-familysearch-wiki-and-catalog-amber-oldenburg-3-june-2020/',
			},
			{
				label: 'FamilySearch Knowledge Article - What is the Wiki',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/what-is-the-research-wiki',
			},
			{
				label: 'FamilySearch Knowledge Article - How to use the Wiki',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-search-the-familysearch-research-wiki',
			},
			{
				label: 'FamilySearch Knowledge Article - Help finding Ancestors',
				href: 'https://www.familysearch.org/en/help/helpcenter/article/how-do-i-get-help-using-the-familysearch-research-wiki',
			},
			{
				label: 'Using and Finding Help',
			},
			{
				label: 'Help Center on FamilySearch.org',
			},
			{
				label: 'Family History Guide Project 6 Goal 1 - Choice A',
				href: 'https://www.thefhguide.com/project-6-help.html',
			},
			{
				label: 'FamilySearch Demo YouTube - Demo of FamilySearch Help',
				href: 'https://www.youtube.com/watch?v=1ZXIozyHVv0',
			},
			{
				label: 'Using Community',
			},
			{
				label: 'Family History Guide Project 6 Goal 1 - Choice A',
				href: 'https://www.thefhguide.com/project-6-help.html',
			},
			{
				label: 'Connect and Collaborate in Community - Kathryn Grant video',
				href: 'https://www.youtube.com/watch?v=dWxP-WGGDYk',
			},
			{
				label: 'Using Family History Guide',
			},
			{
				label: 'Introduction to Family History Guide',
				href: 'https://www.thefhguide.com/get-started.html',
			},
			{
				label: 'About the Family History Guide',
				href: 'https://www.thefhguide.com/introduction.html#about',
			},
			{
				label: 'Contact Us',
			},
			{
				label: 'Scheduling appointments for groups at the center',
			},
			{
				label: 'Youth Appointments- Call/Text Wendy Brown',
			},
			{
				label: 'Other appointments- call/text their own Stake Assistants',
			},
			{
				label: 'Show how to use the Discovery Screens and Recording Studio',
			},
			{
				label:
					'Specific training for all of the devices at the center is given on a rotating basis- check the calendar for specifics.',
			},
		],
	},
	{
		id: 'using-the-research-wiki',
		title: 'Using the Research Wiki',
		items: [],
	},
	{
		id: 'using-and-finding-help',
		title: 'Using and Finding Help',
		items: [],
	},
	{
		id: 'center-specific-training',
		title: 'Center-Specific Training',
		items: [],
	},
]
