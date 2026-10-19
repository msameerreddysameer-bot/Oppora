export type OpportunityStatus = "active" | "draft" | "closed";
export type OpportunityGender = "all" | "Male" | "Female" | "Other";
export type OpportunitySourceStatus = "live" | "expired" | "all";
export type OpportunityEducationLevel = 'high-school' | 'diploma' | 'undergraduate' | 'postgraduate' | 'phd' | 'all';
export type OpportunityorganizationType =
  | "government"
  | "private"
  | "university"
  | "nGO"
  | "start-up"
  | "non-Profit"
  | "international organisation";

export type PublicationStatus = 'draft' | 'published';

export interface LogoCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IOpportunity {
  organizationLogo: string;
  originalLogo?: string;
  logoCrop?: LogoCrop;
  _id: string;
  title: string;
  organization: string;
  //initials: string;
  category: string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus;
  organizationType: OpportunityorganizationType;
  status: OpportunityStatus;
  publicationStatus?: PublicationStatus;
  startDate?: string;
  deadline: string;
  //benefit: string;
  eligibility: string[];
  location: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  officialSourceUrl: string;
  applicationUrl: string;
  benefitsSummary: string;
  eligibilitySummary: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface IOpportunityDetails {
    organizationLogo: string;
  _id: string;
  category: string;
  title: string;
  description: string;
  organization: string;
  organizationType: OpportunityorganizationType;
  requiredDocuments: string[];
  startDate: string; // Or Date if parsing to Date objects
  deadline: string;  // Or Date
  officialSourceUrl: string;
  eligibility: string[];
  eligibilitySummary:string;
  gender:OpportunityGender; 
  sourceStatus: OpportunitySourceStatus;
  createdBy: string;
  applicationUrl: string;
  lastVerifiedAt: string; // Or Date
  benefits: string[];
  benefitsSummary:string;
  location:string;
  educationLevel: string;
  status:OpportunityStatus;
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  __v: number;
}

export interface ISavedOpportunity {
  _id: string;
  user: string;
  opportunity: string;
  savedAt: string; // Or Date
  createdAt: string; // Or Date
  updatedAt: string; // Or Date
  __v: number;
  opportunityDetails: IOpportunityDetails;
}

export interface DemoOpportunity {
  organizationLogo: string;
  _id: string;
  title: string;
  organization: string;
  initials: string;
  category: string;
  gender: OpportunityGender;
  sourceStatus: OpportunitySourceStatus;
  organizationType: OpportunityorganizationType;
  status: OpportunityStatus;
  deadline: string;
  benefit: string;
  eligibility: string;
  location: string;
  description: string;
  benefits: string[];
  requiredDocuments: string[];
  officialUrl: string;
  applicationUrl: string;
  benefitsSummary:string;
  eligibilitySummary:string;
  
}


export interface DemoApplication {
  _id: string;
  opportunityId: string;
  status:'applied' | 'under-review' | 'interviewing' | 'offered' | 'accepted' | 'rejected' | 'withdrawn' ;
  createdAt: string;
  updatedAt: string;
  opportunityDetails:DemoOpportunity;
  opportunity:string;
}

export const DEFAULT_ADMIN_OPPORTUNITIES: IOpportunity[] = [
  {
    _id: 'opp-101',
    title: 'Google Summer of Code 2026',
    organization: 'Google Open Source',
    organizationLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png',
    category: 'open Source',
    gender: 'all',
    sourceStatus: 'live',
    organizationType: 'private',
    status: 'active',
    publicationStatus: 'published',
    deadline: 'April 28, 2026',
    startDate: 'May 15, 2026',
    location: 'Global (Remote)',
    description:
      'A global, online program focused on bringing new contributors into open source software development.\n\nStudents work with an open source mentor organization on a 12-week programming project during their break from school.',
    benefits: ['Stipend up to $3,000 USD', 'Mentorship from OSS leaders', 'Certificate of Completion'],
    eligibility: ['18+ years old', 'Enrolled in post-secondary education or beginner in OSS'],
    eligibilitySummary: '18+ years old, OSS Beginners & Students',
    benefitsSummary: '$3,000 Stipend + Mentorship',
    officialSourceUrl: 'https://summerofcode.withgoogle.com',
    applicationUrl: 'https://summerofcode.withgoogle.com/get-started',
    requiredDocuments: ['CV / Resume', 'Project Proposal'],
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-04-10T14:30:00.000Z',
  },
  {
    _id: 'opp-102',
    title: 'Rhodes Trust Global Postgraduate Scholarship',
    organization: 'University of Oxford',
    organizationLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/120px-Oxford-University-Circlet.svg.png',
    category: 'Scholarship',
    gender: 'all',
    sourceStatus: 'live',
    organizationType: 'university',
    status: 'active',
    publicationStatus: 'published',
    deadline: 'October 1, 2026',
    startDate: 'October 15, 2026',
    location: 'Oxford, United Kingdom',
    description:
      'The Rhodes Scholarship is the oldest and perhaps most prestigious international scholarship programme, enabling outstanding young people to study at the University of Oxford.\n\nCovers Oxford University course fees, as well as providing an annual stipend.',
    benefits: ['Full tuition coverage', 'Annual living stipend (£19,092/yr)', 'Airfare & Visa fees'],
    eligibility: ['Undergraduate degree completed with First Class or equivalent', 'Ages 18-24'],
    eligibilitySummary: 'Ages 18-24, Outstanding Academic & Leadership record',
    benefitsSummary: '100% Tuition + Living Stipend',
    officialSourceUrl: 'https://www.rhodeshouse.ox.ac.uk',
    applicationUrl: 'https://www.rhodeshouse.ox.ac.uk/apply',
    requiredDocuments: ['Academic Transcripts', '6 Reference Letters', 'Personal Statement', 'CV'],
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-03-22T11:20:00.000Z',
  },
  {
    _id: 'opp-103',
    title: 'Microsoft Imagine Cup Global Hackathon 2026',
    organization: 'Microsoft',
    organizationLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/120px-Microsoft_logo.svg.png',
    category: 'hackathon',
    gender: 'all',
    sourceStatus: 'live',
    organizationType: 'private',
    status: 'active',
    publicationStatus: 'published',
    deadline: 'January 22, 2027',
    startDate: 'February 1, 2027',
    location: 'Hybrid / Redmond, WA',
    description:
      'Imagine Cup is an annual competition sponsored by Microsoft Corp. which brings together student developers worldwide to help resolve some of the world’s toughest challenges.\n\nBuild innovative solutions leveraging Azure cloud and generative AI technologies.',
    benefits: ['$100,000 USD Grand Prize', 'Mentorship session with Microsoft CEO', 'Azure Cloud Credits ($10,000)'],
    eligibility: ['Must be at least 16 years old', 'Enrolled as a student in an accredited institution'],
    eligibilitySummary: 'Students 16+, Teams of up to 4',
    benefitsSummary: '$100,000 USD Grand Prize + Azure Credits',
    officialSourceUrl: 'https://imaginecup.microsoft.com',
    applicationUrl: 'https://imaginecup.microsoft.com/register',
    requiredDocuments: ['Proof of Enrollment', 'Project Submission Deck', 'Demo Video'],
    createdAt: '2026-02-10T08:30:00.000Z',
    updatedAt: '2026-04-05T16:45:00.000Z',
  },
  {
    _id: 'opp-104',
    title: 'NASA L\'SPACE Virtual Academy Apprenticeship',
    organization: 'NASA / ASU',
    organizationLogo:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/120px-NASA_logo.svg.png',
    category: 'fellowship',
    gender: 'all',
    sourceStatus: 'live',
    organizationType: 'government',
    status: 'active',
    publicationStatus: 'published',
    deadline: 'August 14, 2026',
    startDate: 'September 1, 2026',
    location: 'Online (NASA L\'SPACE Portal)',
    description:
      'The NASA L\'SPACE Program is a free, online, interactive 12-week workforce training experience open to STEM undergraduate students interested in pursuing a career with NASA or other space-focused enterprises.',
    benefits: ['Official NASA Certificate', 'Mission design experience', 'Direct NASA mentorship'],
    eligibility: ['STEM major enrolled in an accredited undergraduate program'],
    eligibilitySummary: 'Undergraduate STEM students',
    benefitsSummary: 'NASA Credential + Mentorship',
    officialSourceUrl: 'https://www.lspace.asu.edu',
    applicationUrl: 'https://www.lspace.asu.edu/apply',
    requiredDocuments: ['Proof of Enrollment', 'Resume'],
    createdAt: '2026-03-20T12:00:00.000Z',
    updatedAt: '2026-04-12T17:10:00.000Z',
  },
]

export const DEMO_OPPORTUNITIES = DEFAULT_ADMIN_OPPORTUNITIES
//    {
//      organizationLogo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4W5se-3sXcI-CuvSm5GbPoSk655stnvqEeWyX1M79KA&s=10",
//      _id: "open-source-summer",
//      title: "Open Source Summer Program",
//      organization: "Open Source Foundation",
//      initials: "OS",
//      category: "Open Source",
//      gender: "all",
//      sourceStatus: "live",
//      organizationType: "non-Profit",
//      status: "draft",
//      deadline: "Apr 30, 2026",
//      benefit: "Mentorship + stipend",
//      eligibility: "Students and beginner contributors",
//      location: "Remote",
//      description:
//        "A guided summer program for students who want to make meaningful contributions to open source projects.",
//      benefits: [
//        "Mentorship from experienced contributors",
//        "Completion certificate",
//        "Project portfolio experience",
//      ],
//      requiredDocuments: ["Resume or CV", "Proof of enrollment", "Project proposal"],
//      officialUrl: "https://example.com",
//      applicationUrl: "https://example.com/apply",
//      eligibilitySummary:'sjczxmn',
//      benefitsSummary:"nxxcbjx"
//    },
//    {
//      organizationLogo:
//        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4W5se-3sXcI-CuvSm5GbPoSk655stnvqEeWyX1M79KA&s=10",
//      _id: "campus-research",
//      title: "Undergraduate Research Fellowship",
//      organization: "National Research Lab",
//      initials: "NR",
//      category: "Research",
//      gender: "all",
//      sourceStatus: "live",
//      organizationType: "government",
//      status: "draft",
//      deadline: "Mar 28, 2026",
//      benefit: "Research stipend + mentorship",
//      eligibility: "Undergraduate students",
//      location: "Hybrid",
//      description:
//        "Work with a research mentor on a focused project and present your findings at the end of the program.",
//      benefits: [
//        "Research stipend",
//        "Faculty mentorship",
//        "Final presentation experience",
//      ],
//      requiredDocuments: [
//        "Unofficial transcript",
//        "Resume or CV",
//        "Personal statement",
//      ],
//      officialUrl: "https://example.com",
//      applicationUrl: "https://example.com/apply",
//       eligibilitySummary:'sjczxmn',
//      benefitsSummary:"nxxcbjx",
//    },
//    {
//      organizationLogo:
//        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4W5se-3sXcI-CuvSm5GbPoSk655stnvqEeWyX1M79KA&s=10",
//      _id: "student-hackathon",
//      title: "Student Innovation Hackathon",
//      organization: "Campus Innovation Hub",
//      initials: "CI",
//      category: "Hackathon",
//      gender: "all",
//      sourceStatus: "live",
//      organizationType: "university",
//      status: "draft",
//      deadline: "May 12, 2026",
//      benefit: "Prizes + certificates",
//      eligibility: "College students in teams of 2-4",
//      location: "Bengaluru + Remote",
//      description:
//        "Build a practical solution with a student team during a focused weekend of workshops, mentoring, and demos.",
//      benefits: [
//        "Cash and sponsor prizes",
//        "Workshops and mentor feedback",
//        "Participation certificate",
//      ],
//      requiredDocuments: ["Student ID", "Team registration", "Project submission"],
//      officialUrl: "https://example.com",
//      applicationUrl: "https://example.com/apply",
//       eligibilitySummary:'sjczxmn',
//      benefitsSummary:"nxxcbjx",
//    },
//  ];

// export const DEMO_APPLICATIONS: DemoApplication[] = [
//   {
//     _id: "application-1",
//     opportunityId: "campus-research",
//     status: "Under review",
//     appliedDate: "Mar 10, 2026",
//     notes: "Waiting for mentor response",
//   },
//   {
//     _id: "application-2",
//     opportunityId: "open-source-summer",
//     status: "Planning to apply",
//     appliedDate: "Mar 14, 2026",
//     notes: "Finalize project proposal",
//   },
// ];
