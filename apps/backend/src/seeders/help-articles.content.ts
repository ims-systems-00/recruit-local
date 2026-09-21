import { HELP_ARTICLE_AUDIENCE, HELP_ARTICLE_TOPIC } from "@rl/types";
import { HelpArticleInput } from "../models";

/**
 * The help corpus, as data.
 *
 * Kept separate from the seeder that writes it so that reviewing a wording
 * change is reading prose, not reading prose wrapped in database calls.
 *
 * Two rules for anything added here, both of which exist because this text is
 * quoted to users as fact:
 *
 * 1. Describe only behaviour that exists. Percentages, statuses and step names
 *    below are taken from `PROFILE_COMPLETION_SECTIONS`, `KYC_STATUS` and
 *    `ONBOARDING_STEP_ENUMS` — if one of those changes, this file is wrong and
 *    the agent will confidently say so.
 * 2. Never name a URL or a screen position. The agent is told it may not link
 *    to pages on this site, and "the button in the top right" is a promise the
 *    frontend never agreed to keep.
 */
export const HELP_ARTICLES: HelpArticleInput[] = [
  {
    slug: "what-is-recruit-local",
    title: "What Recruit Local is",
    topic: HELP_ARTICLE_TOPIC.GETTING_STARTED,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "Recruit Local is a recruitment platform connecting candidates looking for work with employers hiring.",
    keywords: ["about", "overview", "what is this", "platform", "how it works"],
    body: `Recruit Local is a recruitment platform with two sides.

**Candidates** build a profile describing their experience, education, skills and what
they are looking for, then browse and apply to jobs. **Employers** set up an
organisation profile, post jobs, and review the people who apply.

What makes matching work is that both sides describe more than a job title. Candidates
record the values that matter to them in a workplace; organisations record their own.
When someone applies, the platform computes a match score from both the practical fit
and that values comparison, so employers rank applicants on more than keywords.

You can do everything on the platform through its screens. You can also ask me — I can
explain how something works, walk you through setting up your account, and for
candidates, build out your profile by talking it through with me instead of filling in
forms.`,
  },

  {
    slug: "account-types",
    title: "Candidate and employer accounts",
    topic: HELP_ARTICLE_TOPIC.ACCOUNT,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "Choosing between a candidate and an employer account, and what each one unlocks.",
    keywords: ["sign up", "register", "account type", "employer or candidate", "which account"],
    body: `Every account is either a **candidate** account or an **employer** account, and the
choice decides what the rest of the platform looks like to you.

Choose **candidate** if you are looking for work. You get a job profile, you can apply
to jobs, and your applications are tracked for you.

Choose **employer** if you are hiring. You get an organisation profile, you can post
jobs, and you can review and rank everyone who applies to them.

The choice is made once, during setup, and it is not something you can flip afterwards
on the same account — the two sides hold different records. If you picked the wrong one,
the answer is a new account rather than a setting.`,
  },

  {
    slug: "candidate-setup-steps",
    title: "Setting up a candidate account",
    topic: HELP_ARTICLE_TOPIC.GETTING_STARTED,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary: "The order of the candidate setup steps, from values through to notice period.",
    keywords: ["onboarding", "getting started", "setup", "first steps", "new account"],
    body: `Candidate setup runs as a sequence, and the platform remembers which step you reached,
so you can stop part-way and pick it up later.

The steps, in order:

1. **CV upload** — optional, but the fastest start. An uploaded CV is read and used to
   pre-fill your experience, education and skills so you are correcting details rather
   than typing them.
2. **Job title** — the roles you want. You can name more than one.
3. **Industry** — the sectors you want to work in.
4. **Experience level** — roughly where you are in your career.
5. **Work mode** — remote, on-site, hybrid, or a combination.
6. **Location** — where you are, and where you would work.
7. **Values** — five short rounds where you say what matters to you in a workplace. This
   is what lets employers be compared to you on more than job titles.
8. **Notice period** — how long before you could start. This is the last step.

None of this is permanent. Every answer is editable afterwards from your profile, and
the values rounds can be retaken.`,
  },

  {
    slug: "employer-setup-steps",
    title: "Setting up an employer account",
    topic: HELP_ARTICLE_TOPIC.GETTING_STARTED,
    audience: HELP_ARTICLE_AUDIENCE.EMPLOYER,
    summary: "What an employer fills in during setup and why the organisation profile matters for matching.",
    keywords: ["onboarding", "getting started", "setup", "organisation", "company setup"],
    body: `Employer setup builds your **organisation profile** — the record every job you post
hangs off, and one side of the values comparison used to rank applicants.

You will be asked for your organisation's basics (name, description, industry, type and
size), contact details, your logo and branding, your web presence, your mission and
vision, the products and services you offer, and your organisation's values.

The values step is the one worth slowing down for. Candidates record their own values
during their setup, and the match score on every application compares the two. An
organisation that skips its values is ranking applicants on practical fit alone and
losing the part of the score that is hardest to fake.

Setup remembers where you stopped, so you can complete it across several sittings.`,
  },

  {
    slug: "candidate-profile-completion",
    title: "How candidate profile completion is scored",
    topic: HELP_ARTICLE_TOPIC.PROFILE,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary: "The ten sections that make up your completion percentage and what each is worth.",
    keywords: ["completion", "percentage", "100%", "profile strength", "what's missing"],
    body: `Your profile carries a completion percentage built from ten weighted sections:

- **Basic details** — 15 (name, email, contact number, address, professional summary)
- **Career preferences** — 15 (job titles, industries, work mode, experience level)
- **Work experience** — 15
- **Profile photo** — 10
- **Education** — 10
- **Skills** — 10
- **CV / résumé** — 10
- **Certifications** — 5
- **Values** — 5
- **Languages** — 5

Scoring is per **field**, not per section: each field inside a section carries an equal
share of that section's weight. Filling in your contact number moves the number
immediately rather than waiting until the whole basics section is done — so there is no
penalty for finishing a section in pieces.

Ask me what is missing from your profile at any point and I will read the breakdown back
to you, section by section.`,
  },

  {
    slug: "organisation-profile-completion",
    title: "How organisation profile completion is scored",
    topic: HELP_ARTICLE_TOPIC.PROFILE,
    audience: HELP_ARTICLE_AUDIENCE.EMPLOYER,
    summary: "The eight weighted sections behind an organisation's completion percentage.",
    keywords: ["completion", "percentage", "company profile", "what's missing", "profile strength"],
    body: `An organisation profile is scored across eight weighted sections:

- **Organisation basics** — 15 (name, description, industry, type, number of employees)
- **Contact details** — 15 (contact number, contact email, office address)
- **Mission & vision** — 15
- **Products & services** — 15
- **Logo & branding** — 10
- **Profile photo** — 10
- **Web presence** — 10 (website, LinkedIn)
- **Values** — 10

As with candidate profiles, scoring is per field rather than per section, so partial
progress counts.

A fuller profile is not cosmetic. Candidates see who they would be working for, and your
values section feeds the match score on every application you receive.`,
  },

  {
    slug: "values-and-matching",
    title: "Values and how matching works",
    topic: HELP_ARTICLE_TOPIC.PROFILE,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "Both sides record workplace values, and the platform compares them to compute a match score.",
    keywords: ["values", "match score", "matching", "culture fit", "ranking", "how am I ranked"],
    body: `Candidates record the values that matter to them in a workplace during setup.
Organisations record their own values on their profile. When a candidate applies to a
job, the platform computes a **match score** for that application from the practical fit
and from comparing those two sets of values.

The score is computed by the platform, not judged by a person, and it is what employers
sort applicants by when they want a ranking.

Two things worth knowing about it:

**For employers** — the score and the pipeline stage are different things. The stage
records where somebody moved a candidate to; the score is what was computed. Ranking by
stage tells you about your own process, not about fit.

**For candidates** — you can see how a job's stated requirements line up against your
profile, but not your values score against an organisation. An organisation's values are
not visible to candidates, so that half of the comparison cannot be shown to you, and
guessing at it from the wording of a job advert would be inventing a number.`,
  },

  {
    slug: "uploading-your-cv",
    title: "Uploading your CV",
    topic: HELP_ARTICLE_TOPIC.PROFILE,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary: "An uploaded CV is read automatically to pre-fill experience, education and skills.",
    keywords: ["cv", "resume", "résumé", "upload", "pdf", "import", "autofill"],
    body: `Uploading a CV is the fastest way to fill a profile. The document is read and used to
pre-fill your work experience, education and skills, leaving you to correct details
rather than type everything from scratch.

Treat what comes back as a draft. Automatic extraction gets dates, job titles and
employer names wrong often enough that it is worth reading through once — and a profile
employers see is not the place to leave a mangled date range.

Your CV also counts for 10 points of your profile completion in its own right, and stays
attached to your profile after extraction.

If you would rather not upload anything, you can skip it entirely. Every field it would
have filled can be entered directly, or you can talk it through with me and I will fill
it in for you.`,
  },

  {
    slug: "building-profile-with-alice",
    title: "Building your profile by chatting with me",
    topic: HELP_ARTICLE_TOPIC.PROFILE,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary:
      "You can add experience, education and skills, and choose your job titles, industries, experience level and work mode, by chatting instead of using forms.",
    keywords: [
      "alice",
      "chat",
      "conversational",
      "add experience",
      "voice",
      "without forms",
      "assistant",
      "job title step",
      "choose industry",
      "setup with ai",
    ],
    body: `You do not have to use forms to build your profile. Tell me about a job you have had —
"I was a staff nurse at St Mary's from 2019 to 2022" — and I will turn it into a profile
entry.

I always show you what I am about to save and wait for you to confirm it before anything
is written. If I have misheard a date or a company name, say so and I will correct it
before saving rather than after. Nothing reaches your profile on my guess alone.

This works for your work experience, your education, your skills, and the basic details
on your profile such as your professional summary and contact number.

**Choosing job titles, industries, experience level and work mode.** These setup steps
use fixed lists, so tell me what you are after — "nursing or care work", "remote" — and I
will show you the matching options from the list and let you pick. You can choose up to
three job titles, industries and work modes, and one experience level. Once you confirm,
your choices appear ticked on the setup page and you can press Next to carry on.

If you would rather go back to filling things in directly, everything I add is an
ordinary profile entry and can be edited or deleted on your profile like any other.`,
  },

  {
    slug: "finding-and-applying-for-jobs",
    title: "Finding and applying for jobs",
    topic: HELP_ARTICLE_TOPIC.JOBS,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary: "How to search jobs, what a recommendation is based on, and what applying involves.",
    keywords: ["apply", "job search", "find jobs", "recommendations", "vacancies", "opportunities"],
    body: `You can browse and search open jobs, filter them, and apply to any that are open.

You can also ask me to recommend jobs. Recommendations are drawn from what your profile
says you want — your job titles, industries, experience level, work mode and location —
so a thin profile produces thin recommendations. If what you are shown looks
off-target, the fix is usually in your career preferences.

Before applying, it is worth asking me to check a specific job against your profile. I
can tell you what the job asks for and what your profile currently carries against it:
the experience it wants, keywords it uses, documents it requires, and any screening
questions attached to it. That is a gap list, not a score.

Some jobs attach screening questions or require particular documents. Those are part of
applying, and an application missing them is not complete.`,
  },

  {
    slug: "tracking-your-applications",
    title: "Tracking your applications",
    topic: HELP_ARTICLE_TOPIC.APPLICATIONS,
    audience: HELP_ARTICLE_AUDIENCE.CANDIDATE,
    summary: "Where applications live after you submit them and what the stages mean.",
    keywords: ["application status", "applied", "track", "progress", "rejected", "shortlisted"],
    body: `Every job you apply to is tracked for you, and you can ask me to list them at any point —
all of them, or only the ones at a particular stage.

An application moves through stages as the employer works through their pipeline. The
stage reflects where the employer has moved you to, and only they can move it. An
application sitting at its first stage has not been rejected; it usually means nobody has
reviewed it yet.

I can tell you what stage an application is at and when you applied. I cannot tell you
what an employer thinks of you, why you were moved, or what your odds are — none of that
is recorded anywhere I can read, and guessing at it would not do you any favours.`,
  },

  {
    slug: "posting-a-job",
    title: "Posting a job",
    topic: HELP_ARTICLE_TOPIC.HIRING,
    audience: HELP_ARTICLE_AUDIENCE.EMPLOYER,
    summary: "What goes into a job posting and how the details affect who you attract.",
    keywords: ["post a job", "create job", "vacancy", "job advert", "hiring", "new role"],
    body: `A job posting belongs to your organisation and carries the role's title, description,
location, work mode, experience level and salary details, along with any screening
questions or required documents.

The fields are not just a form. Candidates search and filter on them, recommendations are
computed from them, and the match score on every application is computed partly against
what the job says it wants. A posting with a vague description and no experience level
will be matched vaguely.

Screening questions are the cheapest filter available to you: a question answered badly
tells you more in ten seconds than a CV does in five minutes.

You can ask me to list your jobs, or to pull up a specific one along with everyone who
has applied to it.`,
  },

  {
    slug: "reviewing-applicants",
    title: "Reviewing and ranking applicants",
    topic: HELP_ARTICLE_TOPIC.HIRING,
    audience: HELP_ARTICLE_AUDIENCE.EMPLOYER,
    summary: "How to rank applicants by match score and what that score does and does not tell you.",
    keywords: ["applicants", "candidates", "shortlist", "rank", "best candidates", "who applied", "match"],
    body: `Everyone who applies to one of your jobs appears against that job, and each application
carries a match score computed by the platform.

Ask me to rank applicants for a job and I will sort them by that score. A ranking on its
own is not a recommendation, though, so I will also tell you what the job asked for — a
score with no criteria beside it is not something you can act on, or defend.

Worth keeping distinct: the **score** is computed from fit and values; the **stage** is
where someone on your team moved that candidate. Sorting by stage tells you about your
pipeline, not about your applicants.

You can move applicants through your pipeline stages as you work through them. Those
stage changes are yours to make — I read your pipeline, I do not move people through it.`,
  },

  {
    slug: "kyc-verification",
    title: "Identity verification (KYC)",
    topic: HELP_ARTICLE_TOPIC.VERIFICATION,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "What identity verification involves, the documents accepted, and what each status means.",
    keywords: ["kyc", "verification", "identity", "passport", "driving licence", "id", "verify"],
    body: `Identity verification — KYC — confirms you are who your account says you are. Some parts
of the platform are gated behind it.

Accepted documents are a **passport**, a **driver's licence**, a **national ID card**, or
a **national insurance number**. You submit the document and it is reviewed.

Your verification will be in one of five states:

- **Unverified** — you have not submitted anything yet.
- **Pending** — submitted and waiting on review. Nothing is needed from you.
- **Verified** — confirmed and complete.
- **Action required** — something specific is needed from you, usually a clearer image or
  a different document. The submission is still live.
- **Rejected** — the submission was not accepted and a fresh one is required.

If you are sitting at **action required** or **rejected**, the detail of what went wrong
is on your verification record. Ask me and I will read it back to you.`,
  },

  {
    slug: "accessibility-support",
    title: "Accessibility support",
    topic: HELP_ARTICLE_TOPIC.ACCESSIBILITY,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "Read-aloud, plain language, and adjusting how I explain things to you.",
    keywords: [
      "accessibility",
      "read aloud",
      "screen reader",
      "dyslexia",
      "plain english",
      "simple language",
      "speech",
      "audio",
      "disability",
      "adjustments",
    ],
    body: `Anything I say can be **read aloud**. You do not need a screen reader for this — ask me
to read something back, or turn read-aloud on so that every answer I give is spoken
automatically.

You can also change how I write:

- **Plain language** — short sentences, everyday words, no recruitment jargon.
- **Shorter answers** — the answer and nothing else, when detail gets in the way.
- **One step at a time** — during setup, a single question per turn rather than a list,
  so nothing has to be held in your head at once.

Tell me what helps — "keep it simple", "read this out", "one question at a time" — and I
will remember it for your next visit rather than asking again.

If you find forms difficult, you do not have to use them. I can build your profile by
talking it through with you, and I will confirm each entry with you before saving it.`,
  },

  {
    slug: "what-alice-can-do",
    title: "What I can and cannot do",
    topic: HELP_ARTICLE_TOPIC.GETTING_STARTED,
    audience: HELP_ARTICLE_AUDIENCE.EVERYONE,
    summary: "The assistant's scope: what it reads, what it can change, and what stays with you.",
    keywords: ["alice", "assistant", "ai", "what can you do", "help", "chatbot", "limits"],
    body: `I can explain how the platform works, walk you through setting up your account, read your
own records back to you, and for candidates, build your profile out through conversation.

What I read is exactly what you could open yourself. I have no access to other people's
profiles, other organisations' jobs, or anything your account is not entitled to — not
as a matter of my own restraint, but because the same permission checks that guard the
screens guard me.

What I change, I confirm first. I show you what I am about to save and wait for a yes.

What I will not do is guess. If a question needs data I have not fetched, I fetch it. If
the answer is not available to me, I will say so rather than produce a plausible number —
a made-up salary or match score is worse than an admission that I do not know.

Actions that carry consequences stay with you. I do not submit applications on your
behalf, and I do not move candidates through a hiring pipeline.`,
  },
];
