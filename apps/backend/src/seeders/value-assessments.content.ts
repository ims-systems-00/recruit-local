import { IValueAssessment, VALUE_TYPE_ENUM } from "@rl/types";

/**
 * The self-evaluation questions for every value in the catalog, as data.
 *
 * Keyed by type, then by the value's exact `label` in `value.seeder.ts` — that
 * pair is how the seeder finds the value document. A label renamed there must be
 * renamed here, or the seeder logs it as unmatched and the value cannot be
 * evaluated.
 *
 * Three rules for anything added here, because the LLM scores answers against
 * these questions:
 *
 * 1. Ask for behaviour, not self-description. "Describe a time…" gives the
 *    scorer evidence; "Are you reliable?" only gives it a claim.
 * 2. The placeholder is an example of the *topic*, never a model answer. The
 *    scoring prompt treats an answer that copies it as empty.
 * 3. Keep the wording plain. Candidates may be writing in a second language.
 */

type Question = [text: string, placeholder: string];

/** Exactly three questions, keyed q1..q3 in order — the tuple type enforces the count. */
const assessment = (heading: string, ...questions: [Question, Question, Question]): IValueAssessment => ({
  heading,
  questions: questions.map(([text, placeholder], index) => ({ key: `q${index + 1}`, text, placeholder })),
});

export const VALUE_ASSESSMENTS: Record<VALUE_TYPE_ENUM, Record<string, IValueAssessment>> = {
  [VALUE_TYPE_ENUM.WORKING_STYLE]: {
    Independent: assessment(
      "Tell us how you work on your own",
      [
        "How do you decide what to work on when no one has given you clear direction?",
        "e.g., List the goals, pick the highest-impact task, check in at milestones",
      ],
      [
        "Describe a task you completed largely on your own from start to finish.",
        "e.g., Building our team's onboarding guide with minimal supervision",
      ],
      [
        "When you get stuck working alone, what do you do before asking for help?",
        "e.g., Research the problem, try two approaches, then ask with specifics",
      ]
    ),
    "Fast-paced": assessment(
      "Tell us how you keep up with the pace",
      [
        "How do you stay effective when priorities change several times in a day?",
        "e.g., Re-plan quickly and confirm the new top priority with my lead",
      ],
      [
        "Describe a time you delivered good work under a tight timeframe.",
        "e.g., Turning around a client proposal in 24 hours",
      ],
      [
        "How do you keep quality from slipping when you're moving quickly?",
        "e.g., A short checklist I run before anything goes out",
      ]
    ),
    Structured: assessment(
      "Tell us how you organise your work",
      ["How do you plan and organise your work week?", "e.g., A Monday plan with daily priorities and time blocks"],
      [
        "Describe a time you brought structure to a disorganised task or team.",
        "e.g., Setting up a shared tracker for a messy project",
      ],
      [
        "What tools or systems help you stay organised, and why do they work for you?",
        "e.g., A task board and calendar blocks for focused work",
      ]
    ),
    "Detail-oriented": assessment(
      "Tell us how you handle the details",
      [
        "How do you check your work for mistakes before you hand it over?",
        "e.g., Review against the brief, then a final line-by-line pass",
      ],
      [
        "Describe a time you caught an error others had missed.",
        "e.g., Spotting a pricing mistake before an invoice went out",
      ],
      [
        "How do you balance attention to detail with meeting deadlines?",
        "e.g., Focus the deepest checks on the parts with the highest risk",
      ]
    ),
    Methodical: assessment(
      "Tell us how you work step by step",
      [
        "Walk us through how you usually approach a new, complex task.",
        "e.g., Break it down, order the steps, then work through them",
      ],
      [
        "Describe a time a step-by-step approach helped you solve a problem.",
        "e.g., Tracing a stock discrepancy one stage at a time",
      ],
      [
        "How do you make sure no step gets skipped in work you repeat often?",
        "e.g., A written process I follow and keep up to date",
      ]
    ),
    "Results-driven": assessment(
      "Tell us how you deliver results",
      [
        "How do you define success before you start a piece of work?",
        "e.g., Agree a measurable target with my manager up front",
      ],
      [
        "Describe a result you achieved that you're proud of, and how you got there.",
        "e.g., Cutting customer response time by 30%",
      ],
      [
        "What do you do when you realise you're falling short of a target?",
        "e.g., Find the gap, adjust the plan and flag it early",
      ]
    ),
    Reliable: assessment(
      "Tell us how others can count on you",
      [
        "How do you make sure you follow through on what you commit to?",
        "e.g., Track every commitment and confirm when it's done",
      ],
      [
        "Describe a time someone relied on you and you delivered.",
        "e.g., Covering a colleague's shifts during a busy week",
      ],
      [
        "What do you do when you realise you might not meet a commitment?",
        "e.g., Tell people early and offer a new plan",
      ]
    ),
    "Self-starter": assessment(
      "Tell us how you take the first step",
      [
        "Describe something you started at work without being asked.",
        "e.g., Creating an FAQ document to reduce repeat questions",
      ],
      [
        "How do you decide when to act on your own initiative and when to wait for direction?",
        "e.g., Act when it's low-risk and clearly helps the team",
      ],
      [
        "What motivates you to get started on a task nobody has assigned?",
        "e.g., Seeing a recurring problem that nobody owns",
      ]
    ),
    "Hands-on": assessment(
      "Tell us how you get stuck in",
      [
        "Describe a time you rolled up your sleeves to get something done yourself.",
        "e.g., Helping the warehouse team pack orders during a peak",
      ],
      [
        "Do you learn best by reading about something or by doing it? Give an example.",
        "e.g., Learning a new tool by building a small project with it",
      ],
      [
        "When is being hands-on most useful in your role, and when do you step back?",
        "e.g., In a crisis I dive in; for routine work I delegate",
      ]
    ),
    Efficient: assessment(
      "Tell us how you make the most of your time",
      [
        "Describe a process you made faster or simpler.",
        "e.g., Automating a weekly report that used to take two hours",
      ],
      ["How do you avoid spending time on low-value work?", "e.g., Ask what the output is for before starting"],
      ["What habit helps you get more done in a day?", "e.g., Handling emails at two set times"]
    ),
    Disciplined: assessment(
      "Tell us how you stay on track",
      [
        "How do you keep going on important work that you don't enjoy?",
        "e.g., Do it first thing and reward myself after",
      ],
      [
        "Describe a routine or habit you've kept up that improved your work.",
        "e.g., A daily end-of-day review for the past year",
      ],
      [
        "How do you handle distractions when you need to focus?",
        "e.g., Notifications off and set blocks of focused time",
      ]
    ),
    Flexible: assessment(
      "Tell us how you adapt",
      [
        "Describe a time your plans changed suddenly at work. How did you respond?",
        "e.g., Switching to online delivery a day before an event",
      ],
      [
        "How do you handle being asked to take on work outside your usual role?",
        "e.g., Ask a few questions, then start and learn as I go",
      ],
      [
        "What helps you stay calm and productive when things don't go to plan?",
        "e.g., Focus on what I can control and re-plan quickly",
      ]
    ),
    "Time management": assessment(
      "Tell us how you manage your time",
      [
        "How do you plan your day when you have more to do than time allows?",
        "e.g., Rank tasks by deadline and impact, then block out time",
      ],
      [
        "Describe a time you juggled several deadlines successfully.",
        "e.g., Delivering three client reports in the same week",
      ],
      [
        "What do you do when a task is taking much longer than you expected?",
        "e.g., Reassess the scope and update whoever is waiting",
      ]
    ),
    Prioritisation: assessment(
      "Tell us how you decide what matters most",
      [
        "How do you decide which task to do first when everything feels urgent?",
        "e.g., Weigh impact and deadline, and check with my manager",
      ],
      [
        "Describe a time you had to say no to, or delay, something to focus on a priority.",
        "e.g., Pushing back a nice-to-have feature to fix a key bug",
      ],
      [
        "How do you re-prioritise when something unexpected comes up?",
        "e.g., Review my list and move the least critical item",
      ]
    ),
    "Process-driven": assessment(
      "Tell us how you use processes",
      ["Describe a process you created or improved at work.", "e.g., A checklist that cut onboarding errors in half"],
      [
        "Why do processes matter to you, and when do you think they should change?",
        "e.g., They create consistency, but should change when they slow us down",
      ],
      [
        "How do you make sure others follow a process consistently?",
        "e.g., Document it clearly and walk the team through it",
      ]
    ),
    Accountable: assessment(
      "Tell us how you own your work",
      [
        "Describe a time you took responsibility for a mistake you made.",
        "e.g., Owning a missed deadline and putting a fix in place",
      ],
      [
        "How do you keep others informed about the progress of work you own?",
        "e.g., Short weekly updates with risks flagged early",
      ],
      [
        "What does owning an outcome mean to you in practice?",
        "e.g., Seeing it through, including the parts nobody checks",
      ]
    ),
    Resourceful: assessment(
      "Tell us how you make things work",
      [
        "Describe a time you solved a problem with limited time, money or tools.",
        "e.g., Running a campaign with free tools and no budget",
      ],
      [
        "Where do you go first when you need information or help you don't have?",
        "e.g., Documentation, then colleagues who've done it before",
      ],
      [
        "Tell us about a creative workaround you used to get something done.",
        "e.g., Using a spreadsheet as a temporary booking system",
      ]
    ),
    "Quality-focused": assessment(
      "Tell us how you deliver quality",
      ["How do you define good quality for the work you do?", "e.g., Accurate, meets the brief and needs no rework"],
      [
        "Describe a time you raised the quality of a piece of work or a process.",
        "e.g., Adding peer review that reduced customer complaints",
      ],
      [
        "What do you do when you're under pressure to deliver faster than quality allows?",
        "e.g., Explain the trade-off and agree what can safely be cut",
      ]
    ),
    "Deadline-driven": assessment(
      "Tell us how you meet deadlines",
      ["How do you plan backwards from a deadline?", "e.g., Set milestones and leave a buffer before the due date"],
      [
        "Describe a time you met a tough deadline. What did you do to make it happen?",
        "e.g., Re-planning tasks to launch a website on time",
      ],
      ["What do you do when a deadline looks impossible?", "e.g., Flag it early and negotiate scope or extra help"]
    ),
    "Execution-focused": assessment(
      "Tell us how you get things done",
      [
        "Describe a plan or idea you turned into a finished result.",
        "e.g., Taking a team suggestion from idea to a live process",
      ],
      [
        "How do you keep work moving when a project starts to stall?",
        "e.g., Break down the next step and give it a clear owner",
      ],
      [
        "How do you know when something is done and ready to deliver?",
        "e.g., It meets the agreed criteria and has been checked",
      ]
    ),
  },

  [VALUE_TYPE_ENUM.MINDSET]: {
    // Wording taken from the onboarding design; the other values follow its pattern.
    "Growth-oriented": assessment(
      "Tell us how you grow",
      [
        "What is one skill you are currently trying to improve, and why?",
        "e.g., Improving communication skills for better teamwork",
      ],
      ["How do you usually learn from a mistake or failure?", "e.g., Reflect, adapt, and try again"],
      [
        "Describe a recent challenge that helped you grow professionally.",
        "e.g., Leading a project outside my comfort zone",
      ]
    ),
    Curious: assessment(
      "Tell us what sparks your curiosity",
      [
        "What have you recently explored or learned just because it interested you?",
        "e.g., How our product's pricing model was designed",
      ],
      [
        "Describe a time asking questions led you to a better result at work.",
        "e.g., Asking 'why' uncovered the real cause of a delay",
      ],
      ["How do you go about understanding something unfamiliar?", "e.g., Read up, ask an expert, then try it myself"]
    ),
    "Open-minded": assessment(
      "Tell us how you consider other views",
      [
        "Describe a time you changed your mind after hearing a different perspective.",
        "e.g., Adopting a colleague's approach to a client issue",
      ],
      [
        "How do you respond when someone disagrees with your idea?",
        "e.g., Ask them to explain their reasoning before I respond",
      ],
      ["How do you seek out views different from your own?", "e.g., Asking quieter team members for their input"]
    ),
    Resilient: assessment(
      "Tell us how you bounce back",
      [
        "Describe a setback at work and how you recovered from it.",
        "e.g., Losing a major client and rebuilding the pipeline",
      ],
      ["What helps you keep going when work gets tough?", "e.g., Breaking problems into small wins"],
      ["What did a difficult experience teach you that you still use today?", "e.g., To ask for help earlier"]
    ),
    Ambitious: assessment(
      "Tell us what you're aiming for",
      [
        "What is a professional goal you're working towards right now?",
        "e.g., Moving into a team lead role within two years",
      ],
      [
        "What steps have you already taken towards that goal?",
        "e.g., Leading a project and completing a management course",
      ],
      [
        "Describe a time you aimed higher than what was expected of you.",
        "e.g., Setting myself a target above the team quota",
      ]
    ),
    Innovative: assessment(
      "Tell us how you bring new ideas",
      [
        "Describe a new idea you introduced at work and what happened.",
        "e.g., Suggesting a self-service portal that cut support calls",
      ],
      [
        "How do you come up with new ways of doing things?",
        "e.g., Looking at how other industries solve similar problems",
      ],
      ["How do you test whether a new idea is worth pursuing?", "e.g., Run a small pilot and measure the result"]
    ),
    Creative: assessment(
      "Tell us how you think creatively",
      [
        "Describe a problem you solved with a creative or unusual approach.",
        "e.g., Turning training into a game to boost completion",
      ],
      ["Where do your best ideas usually come from?", "e.g., Talking problems through with people outside my team"],
      [
        "How do you turn a creative idea into something practical?",
        "e.g., Sketch it, get feedback, then build a simple version",
      ]
    ),
    "Problem solver": assessment(
      "Tell us how you solve problems",
      [
        "Walk us through how you approach a problem you haven't seen before.",
        "e.g., Define it, find the root cause, try options, review",
      ],
      ["Describe a difficult problem you solved at work.", "e.g., Fixing a recurring scheduling clash across teams"],
      ["How do you decide between several possible solutions?", "e.g., Compare the cost, impact and risk of each"]
    ),
    Proactive: assessment(
      "Tell us how you act ahead of time",
      [
        "Describe a problem you spotted early and acted on before it grew.",
        "e.g., Reordering stock before a supplier delay hit",
      ],
      [
        "How do you look ahead to anticipate what your team will need?",
        "e.g., Reviewing upcoming deadlines every Monday",
      ],
      ["What is something you improved without being asked?", "e.g., Creating templates for common customer replies"]
    ),
    "Lifelong learner": assessment(
      "Tell us how you keep learning",
      [
        "What have you learned in the past year, and how did you learn it?",
        "e.g., Data analysis through an online course",
      ],
      ["How do you make time for learning alongside your work?", "e.g., Thirty minutes of reading every morning"],
      [
        "Describe how something you learned recently improved your work.",
        "e.g., Using spreadsheet formulas to cut reporting time",
      ]
    ),
    Determined: assessment(
      "Tell us how you push through",
      ["Describe a goal you achieved despite obstacles.", "e.g., Earning a certification while working full time"],
      ["What keeps you going when progress is slow?", "e.g., Tracking small wins along the way"],
      [
        "How do you decide whether to keep going with something or change course?",
        "e.g., Keep the goal, but change the approach if it isn't working",
      ]
    ),
    Adaptable: assessment(
      "Tell us how you adapt to change",
      [
        "Describe a significant change at work and how you adjusted to it.",
        "e.g., Moving to a new system in the middle of a project",
      ],
      [
        "How do you get up to speed quickly in a new environment?",
        "e.g., Ask lots of questions and find a go-to person",
      ],
      [
        "What is one way you changed your approach to fit a new situation?",
        "e.g., Adjusting my style for a more senior audience",
      ]
    ),
    Visionary: assessment(
      "Tell us how you see the future",
      [
        "Where do you see your field heading in the next few years, and how are you preparing?",
        "e.g., More automation of routine tasks",
      ],
      ["Describe a long-term idea or goal you've worked towards.", "e.g., Building a referral programme from scratch"],
      ["How do you get others excited about a future you can see?", "e.g., Sharing a clear picture of the benefits"]
    ),
    Entrepreneurial: assessment(
      "Tell us how you create opportunities",
      [
        "Describe an opportunity you spotted and acted on.",
        "e.g., Launching a side service that brought in new clients",
      ],
      [
        "How do you weigh the risks and rewards before starting something new?",
        "e.g., Estimate the upside, limit the downside, start small",
      ],
      [
        "Tell us about something you built or started from scratch.",
        "e.g., A small online shop I ran during university",
      ]
    ),
    Coachable: assessment(
      "Tell us how you take feedback",
      ["Describe a piece of feedback that changed how you work.", "e.g., Being told to listen more in meetings"],
      ["How do you respond when feedback feels unfair or hard to hear?", "e.g., Pause, ask for examples, then reflect"],
      ["How do you show that you've acted on feedback?", "e.g., Following up with my manager on what I changed"]
    ),
    "Risk-taker": assessment(
      "Tell us about the risks you take",
      ["Describe a calculated risk you took at work and the outcome.", "e.g., Proposing a new supplier to cut costs"],
      ["How do you decide whether a risk is worth taking?", "e.g., Compare the worst case with the potential gain"],
      [
        "Tell us about a risk that didn't work out and what you learned.",
        "e.g., Launching too early taught me to test first",
      ]
    ),
    "Forward-thinking": assessment(
      "Tell us how you plan ahead",
      [
        "How do you prepare for changes you can see coming in your work?",
        "e.g., Learning a new tool before the team adopts it",
      ],
      [
        "Describe a decision you made with the long term in mind.",
        "e.g., Documenting processes so the team could grow",
      ],
      ["What trend in your industry are you preparing for, and how?", "e.g., AI tools, by experimenting with them now"]
    ),
    "Continuous improvement": assessment(
      "Tell us how you make things better",
      [
        "Describe a small improvement you made that had a real impact.",
        "e.g., Changing a form to reduce data-entry errors",
      ],
      [
        "How do you identify what could be done better?",
        "e.g., Asking customers and colleagues where things get stuck",
      ],
      [
        "How do you check whether a change actually improved things?",
        "e.g., Comparing turnaround times before and after",
      ]
    ),
    "Comfortable with ambiguity": assessment(
      "Tell us how you handle the unknown",
      [
        "Describe a time you had to move forward without all the information.",
        "e.g., Starting a project while requirements were still changing",
      ],
      [
        "How do you make decisions when the path isn't clear?",
        "e.g., Make the best call I can and revisit it as I learn more",
      ],
      [
        "What helps you stay productive when goals or roles are unclear?",
        "e.g., Setting my own short-term goals and checking in",
      ]
    ),
    "Achievement-oriented": assessment(
      "Tell us what you achieve",
      ["What achievement are you most proud of, and why?", "e.g., Exceeding my sales target four quarters in a row"],
      ["How do you set goals that stretch you?", "e.g., Aim a little above what feels comfortable"],
      ["How do you track progress towards your goals?", "e.g., A simple weekly scorecard"]
    ),
  },

  [VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR]: {
    Integrity: assessment(
      "Tell us how you act with integrity",
      [
        "Describe a time you did the right thing even though it was harder.",
        "e.g., Reporting an error that made my team look bad",
      ],
      [
        "How do you handle being asked to do something you think is wrong?",
        "e.g., Raise my concern calmly and suggest an alternative",
      ],
      [
        "What does integrity look like in your day-to-day work?",
        "e.g., Keeping promises and being honest about progress",
      ]
    ),
    Empathy: assessment(
      "Tell us how you understand others",
      [
        "Describe a time you supported a colleague or customer who was struggling.",
        "e.g., Helping a new starter who felt overwhelmed",
      ],
      [
        "How do you try to understand someone's point of view when it differs from yours?",
        "e.g., Ask questions and listen before responding",
      ],
      [
        "How has understanding someone else's situation changed how you acted?",
        "e.g., Adjusting a deadline for a colleague who was unwell",
      ]
    ),
    Respect: assessment(
      "Tell us how you show respect",
      [
        "How do you show respect to colleagues you disagree with?",
        "e.g., Hear them out and focus on the issue, not the person",
      ],
      [
        "Describe a time you made sure someone's contribution was recognised.",
        "e.g., Crediting a teammate's idea in a meeting",
      ],
      [
        "How do you respect other people's time and boundaries at work?",
        "e.g., Keeping meetings short and avoiding late messages",
      ]
    ),
    Inclusive: assessment(
      "Tell us how you include others",
      [
        "Describe a time you made sure someone felt included in a team or discussion.",
        "e.g., Inviting a remote colleague's view in a meeting",
      ],
      [
        "How do you adapt the way you work for people with different needs?",
        "e.g., Sharing notes in advance for those who prefer to read",
      ],
      ["What do you do when you notice someone being left out?", "e.g., Bring them into the conversation directly"]
    ),
    Fairness: assessment(
      "Tell us how you act fairly",
      [
        "Describe a decision where you had to be fair to several people at once.",
        "e.g., Splitting weekend shifts evenly across the team",
      ],
      [
        "How do you make sure your judgements aren't based on bias or favouritism?",
        "e.g., Use the same criteria for everyone",
      ],
      [
        "What do you do when you see someone being treated unfairly?",
        "e.g., Speak up or raise it with the right person",
      ]
    ),
    Trustworthy: assessment(
      "Tell us how you earn trust",
      [
        "Describe a time someone trusted you with something important.",
        "e.g., Handling confidential payroll information",
      ],
      ["How do you build trust with a new team or manager?", "e.g., Deliver on small promises consistently"],
      ["What do you do to rebuild trust if you've let someone down?", "e.g., Own it, fix it and follow through"]
    ),
    Honesty: assessment(
      "Tell us how you stay honest",
      [
        "Describe a time you gave honest feedback that was difficult to share.",
        "e.g., Telling a client their timeline wasn't realistic",
      ],
      [
        "How do you handle situations where the truth might disappoint someone?",
        "e.g., Be clear and kind, and offer options",
      ],
      [
        "Tell us about a time you admitted you didn't know something.",
        "e.g., Saying 'I'll find out' instead of guessing",
      ]
    ),
    Accountability: assessment(
      "Tell us how you take responsibility",
      [
        "Describe a time you owned up to a mistake. What happened next?",
        "e.g., Admitting a wrong order and arranging a fix",
      ],
      ["How do you hold yourself accountable for your commitments?", "e.g., Track them and review progress every week"],
      [
        "How do you encourage accountability in a team without blaming people?",
        "e.g., Focus on fixing the problem, not finding fault",
      ]
    ),
    Transparency: assessment(
      "Tell us how you stay open",
      [
        "How do you keep people informed about your work, including problems?",
        "e.g., Sharing updates and risks in a weekly note",
      ],
      [
        "Describe a time being open about an issue led to a better outcome.",
        "e.g., Flagging a delay early so the client could plan",
      ],
      [
        "What information do you think teams should share more openly, and why?",
        "e.g., Priorities, so everyone knows what matters most",
      ]
    ),
    "Psychological safety": assessment(
      "Tell us how you help people feel safe to speak up",
      [
        "How do you make it easy for others to share ideas or admit mistakes?",
        "e.g., Thank people for raising issues instead of blaming them",
      ],
      [
        "Describe a time you spoke up about a concern in a team setting.",
        "e.g., Questioning an unrealistic plan at a project kickoff",
      ],
      ["How do you respond when someone brings you bad news?", "e.g., Stay calm, thank them and focus on next steps"]
    ),
    Humility: assessment(
      "Tell us how you stay humble",
      [
        "Describe a time you learned something important from someone more junior than you.",
        "e.g., An intern showed me a faster tool",
      ],
      ["How do you share credit for team successes?", "e.g., Naming everyone who contributed"],
      ["How do you react when you realise you were wrong?", "e.g., Say so openly and change course"]
    ),
    "Diversity-minded": assessment(
      "Tell us how you value diversity",
      [
        "Describe a time a diverse team or perspective led to a better result.",
        "e.g., A mixed team spotted a customer group we'd missed",
      ],
      [
        "How do you make sure different backgrounds and views are heard?",
        "e.g., Asking everyone for input before deciding",
      ],
      [
        "What have you done to learn about people or cultures different from your own?",
        "e.g., Joining a cross-cultural mentoring scheme",
      ]
    ),
    "Socially responsible": assessment(
      "Tell us how you care about your impact",
      [
        "Describe something you've done at work or in your community to have a positive social impact.",
        "e.g., Organising a team volunteering day",
      ],
      [
        "How do you consider the wider impact of your decisions at work?",
        "e.g., Choosing suppliers with fair labour practices",
      ],
      [
        "What cause matters to you, and how does it show up in how you work?",
        "e.g., Sustainability, by cutting waste in our processes",
      ]
    ),
    "Emotional intelligence": assessment(
      "Tell us how you read and manage emotions",
      [
        "Describe a time you noticed someone was upset and changed how you dealt with them.",
        "e.g., Pausing a meeting when a colleague seemed overwhelmed",
      ],
      ["How do you manage your own emotions when you're under stress?", "e.g., Take a short break before responding"],
      ["Tell us about a tense conversation you handled well.", "e.g., Calming an angry customer by listening first"]
    ),
    Principled: assessment(
      "Tell us about the principles that guide you",
      [
        "What principles guide how you work, and why do they matter to you?",
        "e.g., Do what I say I'll do, and treat people fairly",
      ],
      [
        "Describe a time you stuck to your principles under pressure.",
        "e.g., Refusing to skip safety checks to save time",
      ],
      [
        "How do you handle a conflict between your principles and a business goal?",
        "e.g., Raise it openly and look for an option that respects both",
      ]
    ),
    Compassionate: assessment(
      "Tell us how you show care",
      [
        "Describe a time you went out of your way to help someone at work.",
        "e.g., Covering for a colleague during a family emergency",
      ],
      [
        "How do you show care for colleagues while still getting the job done?",
        "e.g., Check in on workloads during busy periods",
      ],
      [
        "How do you support someone who is going through a difficult time?",
        "e.g., Listen, offer practical help and respect their privacy",
      ]
    ),
    Authentic: assessment(
      "Tell us how you stay true to yourself",
      ["How do you bring your genuine self to work?", "e.g., Being open about how I like to work and learn"],
      [
        "Describe a time being honest about who you are helped a working relationship.",
        "e.g., Admitting I was nervous about presenting",
      ],
      ["How do you stay true to your values in a new environment?", "e.g., Keep my standards while I learn the culture"]
    ),
    "Values-driven": assessment(
      "Tell us how values guide your choices",
      [
        "Which personal values matter most to you at work, and why?",
        "e.g., Honesty and teamwork, because trust makes work easier",
      ],
      ["Describe a decision you made based on your values.", "e.g., Choosing a role with a mission I believe in"],
      [
        "How do you check whether an employer's values match your own?",
        "e.g., Ask how they handle mistakes and disagreements",
      ]
    ),
    "Community-oriented": assessment(
      "Tell us how you contribute to your community",
      [
        "How do you contribute to the community around you, at work or outside it?",
        "e.g., Running a weekly coding club at the library",
      ],
      [
        "Describe a time you brought people together around a shared goal.",
        "e.g., Organising a charity fundraiser with colleagues",
      ],
      ["Why does being part of a community matter to you?", "e.g., It helps me learn and give something back"]
    ),
    "Conflict resolution": assessment(
      "Tell us how you resolve conflict",
      [
        "Describe a disagreement at work and how you helped resolve it.",
        "e.g., Helping two teams agree on shared deadlines",
      ],
      ["What steps do you take to calm a tense situation?", "e.g., Listen to both sides and find common ground"],
      [
        "How do you make sure a resolved conflict stays resolved?",
        "e.g., Agree next steps in writing and check in later",
      ]
    ),
  },

  [VALUE_TYPE_ENUM.LEADERSHIP]: {
    Mentorship: assessment(
      "Tell us how you mentor others",
      [
        "Describe someone you've mentored or supported in their development.",
        "e.g., Guiding a junior colleague through their first project",
      ],
      ["How do you adjust your guidance to the person you're helping?", "e.g., Ask how they learn best and adapt"],
      ["How do you know your mentoring has made a difference?", "e.g., They now handle the work on their own"]
    ),
    "Servant leadership": assessment(
      "Tell us how you lead by serving",
      [
        "How do you put your team's needs first while still meeting goals?",
        "e.g., Removing blockers before taking on my own tasks",
      ],
      [
        "Describe a time you supported your team behind the scenes to help them succeed.",
        "e.g., Handling admin so the team could focus on delivery",
      ],
      ["How do you find out what your team needs from you?", "e.g., Regular one-to-ones and asking directly"]
    ),
    Empowerment: assessment(
      "Tell us how you empower others",
      [
        "Describe a time you gave someone the authority to make a decision.",
        "e.g., Letting a team member own a client relationship",
      ],
      [
        "How do you build others' confidence to take on more responsibility?",
        "e.g., Give stretch tasks with support available",
      ],
      [
        "How do you balance giving freedom with making sure work gets done?",
        "e.g., Agree outcomes and check in, without micromanaging",
      ]
    ),
    "Coaching culture": assessment(
      "Tell us how you coach",
      [
        "How do you help someone find their own answer rather than giving it to them?",
        "e.g., Ask open questions that guide their thinking",
      ],
      [
        "Describe a time coaching helped someone improve their performance.",
        "e.g., Helping a colleague prepare for difficult client calls",
      ],
      [
        "How do you encourage a team to coach and learn from each other?",
        "e.g., Setting up peer reviews and skill-share sessions",
      ]
    ),
    "Visionary leadership": assessment(
      "Tell us how you set a vision",
      [
        "Describe a vision or direction you set for a team or project.",
        "e.g., Becoming the fastest-responding support team in the region",
      ],
      ["How do you communicate a vision so others believe in it?", "e.g., Linking it to what matters to each person"],
      [
        "How do you keep a team focused on the long-term goal day to day?",
        "e.g., Connecting weekly priorities back to the vision",
      ]
    ),
    "Strategic thinking": assessment(
      "Tell us how you think strategically",
      [
        "Describe a time you looked beyond the immediate task to the bigger picture.",
        "e.g., Redesigning a process to support future growth",
      ],
      [
        "How do you decide which opportunities to focus on and which to leave?",
        "e.g., Weigh the impact against our main goals",
      ],
      ["How do you plan for risks that might affect your goals?", "e.g., List the key risks and prepare a backup plan"]
    ),
    "Decision-making": assessment(
      "Tell us how you make decisions",
      [
        "Walk us through how you made an important decision at work.",
        "e.g., Choosing a vendor by comparing cost, quality and risk",
      ],
      [
        "How do you make decisions when time is short or information is limited?",
        "e.g., Decide on the best available facts and review later",
      ],
      [
        "Describe a decision that turned out wrong and what you learned.",
        "e.g., Hiring too quickly taught me to involve the team",
      ]
    ),
    "Feedback culture": assessment(
      "Tell us how you give and receive feedback",
      ["How do you give feedback that is honest but helpful?", "e.g., Specific examples with a clear suggestion"],
      [
        "Describe a time you asked for feedback and acted on it.",
        "e.g., Asking my team how I could run better meetings",
      ],
      ["How do you make feedback a normal part of how a team works?", "e.g., Short reviews at the end of every project"]
    ),
    "Talent growth": assessment(
      "Tell us how you grow talent",
      [
        "Describe how you helped someone develop a new skill or move up.",
        "e.g., Supporting a colleague into a supervisor role",
      ],
      ["How do you spot potential in others?", "e.g., Noticing who takes initiative and learns quickly"],
      ["How do you create opportunities for others to grow?", "e.g., Sharing projects that stretch their skills"]
    ),
    "Leading by example": assessment(
      "Tell us how you lead by example",
      [
        "Describe a time your own behaviour set the standard for others.",
        "e.g., Coming prepared to every meeting, which the team adopted",
      ],
      ["Which behaviours do you model for others, and why?", "e.g., Owning mistakes openly so others feel safe to"],
      [
        "How do you make sure you meet the standards you expect from others?",
        "e.g., Applying the same deadlines and checks to my own work",
      ]
    ),
    "High-performance culture": assessment(
      "Tell us how you drive high performance",
      [
        "How do you set high standards without burning people out?",
        "e.g., Clear goals, realistic workloads and regular check-ins",
      ],
      [
        "Describe a time you helped a team perform at a higher level.",
        "e.g., Introducing clear targets that raised output",
      ],
      [
        "How do you deal with performance that isn't meeting expectations?",
        "e.g., Talk early, understand why, agree a plan",
      ]
    ),
    Delegation: assessment(
      "Tell us how you delegate",
      ["How do you decide what to delegate and to whom?", "e.g., Match tasks to people's skills and growth goals"],
      [
        "Describe a time delegating well led to a better result.",
        "e.g., Handing a report to an analyst who improved it",
      ],
      ["How do you stay informed on delegated work without micromanaging?", "e.g., Agree check-in points up front"]
    ),
    "Inspiring others": assessment(
      "Tell us how you inspire others",
      [
        "Describe a time you motivated a team or person through a difficult period.",
        "e.g., Keeping morale up during a long product launch",
      ],
      ["What do you do to energise people around a goal?", "e.g., Share the 'why' and celebrate progress"],
      ["How do you know when you've inspired someone?", "e.g., They take ownership without being asked"]
    ),
    "Succession planning": assessment(
      "Tell us how you plan for continuity",
      [
        "How do you make sure work continues smoothly if you or a key person is away?",
        "e.g., Documenting processes and training others to cover",
      ],
      [
        "Describe a time you prepared someone to take over your responsibilities.",
        "e.g., Training my replacement before a promotion",
      ],
      [
        "How do you identify who could step into a key role in future?",
        "e.g., Looking at skills, interest and readiness",
      ]
    ),
    "Setting direction": assessment(
      "Tell us how you set direction",
      [
        "How do you turn a broad goal into clear priorities for a team?",
        "e.g., Break it into quarterly objectives with owners",
      ],
      [
        "Describe a time you set direction when a team was unsure what to do.",
        "e.g., Agreeing three priorities after a reorganisation",
      ],
      [
        "How do you keep a team aligned when circumstances change?",
        "e.g., Re-share priorities and explain what changed",
      ]
    ),
    "Recognition culture": assessment(
      "Tell us how you recognise others",
      ["How do you recognise good work in your team?", "e.g., Specific thanks in team meetings"],
      [
        "Describe a time recognising someone's effort made a difference.",
        "e.g., Praise that encouraged a colleague to lead a project",
      ],
      [
        "How do you make sure recognition is fair and reaches everyone?",
        "e.g., Noticing behind-the-scenes work, not just visible wins",
      ]
    ),
    "Developing others": assessment(
      "Tell us how you develop others",
      [
        "Describe how you helped a colleague improve their performance.",
        "e.g., Working alongside them on tricky tasks",
      ],
      ["How do you create learning opportunities in everyday work?", "e.g., Involving junior staff in client meetings"],
      [
        "How do you support someone who is struggling to develop a skill?",
        "e.g., Break it into steps and practise together",
      ]
    ),
    "Ownership of outcomes": assessment(
      "Tell us how you own outcomes",
      [
        "Describe a project where you owned the result, good or bad.",
        "e.g., Leading a launch and fixing the issues that followed",
      ],
      [
        "How do you respond when an outcome you're responsible for goes wrong?",
        "e.g., Take responsibility, fix it and share the lessons",
      ],
      [
        "How do you make sure an outcome is achieved, not just tasks completed?",
        "e.g., Track the result, not just the to-do list",
      ]
    ),
    "Raising the bar": assessment(
      "Tell us how you raise standards",
      [
        "Describe a time you raised the standard of work in your team.",
        "e.g., Introducing peer review for client documents",
      ],
      ["How do you encourage others to aim higher?", "e.g., Share great examples and set stretch goals"],
      ["How do you keep improving your own standards over time?", "e.g., Learning from top performers in my field"]
    ),
    "Accountability for results": assessment(
      "Tell us how you deliver on results",
      [
        "How do you set clear targets and track results for yourself or a team?",
        "e.g., A weekly dashboard with agreed measures",
      ],
      [
        "Describe a time you were held accountable for a result. How did you handle it?",
        "e.g., Explaining a missed target and presenting a recovery plan",
      ],
      [
        "What do you do when results fall short of what you committed to?",
        "e.g., Work out why, adjust the plan and report honestly",
      ]
    ),
  },

  [VALUE_TYPE_ENUM.MOTIVATION]: {
    "Purpose-driven": assessment(
      "Tell us what gives your work purpose",
      ["What gives your work meaning, and why?", "e.g., Knowing my work helps people find jobs"],
      [
        "Describe a time your sense of purpose kept you going through difficult work.",
        "e.g., Supporting patients during a busy winter",
      ],
      ["How do you connect everyday tasks to a bigger purpose?", "e.g., Thinking about who benefits from each task"]
    ),
    "Goal-oriented": assessment(
      "Tell us how you work towards goals",
      [
        "What is a goal you set yourself recently, and how did you approach it?",
        "e.g., Earning a certification in six months",
      ],
      ["How do you break a big goal into manageable steps?", "e.g., Monthly milestones with weekly actions"],
      [
        "How do you stay focused on a goal when other demands get in the way?",
        "e.g., Protecting time for it in my calendar",
      ]
    ),
    Passionate: assessment(
      "Tell us what you're passionate about",
      [
        "What part of your work are you most passionate about, and why?",
        "e.g., Solving customer problems that seem impossible",
      ],
      [
        "Describe a time your passion made a difference to the quality of your work.",
        "e.g., Putting in extra effort to perfect a design I cared about",
      ],
      ["How do you keep your enthusiasm for work over time?", "e.g., Taking on new challenges regularly"]
    ),
    "Self-motivated": assessment(
      "Tell us what drives you",
      ["What drives you to do your best when no one is watching?", "e.g., Pride in doing the job properly"],
      [
        "Describe something you achieved purely through your own drive.",
        "e.g., Teaching myself design and taking on freelance work",
      ],
      [
        "How do you motivate yourself on days when your energy is low?",
        "e.g., Start with a quick win to build momentum",
      ]
    ),
    Driven: assessment(
      "Tell us what pushes you forward",
      ["What are you working hard to achieve right now?", "e.g., Becoming a specialist in my field"],
      [
        "Describe a time your drive helped you achieve something difficult.",
        "e.g., Studying in the evenings to change careers",
      ],
      ["How do you keep your drive without burning out?", "e.g., Setting limits and taking proper breaks"]
    ),
    "Impact-focused": assessment(
      "Tell us about the impact you make",
      [
        "What is the biggest impact your work has had so far?",
        "e.g., A process change that saved the team hours every week",
      ],
      ["How do you decide which work will have the most impact?", "e.g., Ask who benefits and by how much"],
      ["How do you measure the impact of what you do?", "e.g., Tracking customer satisfaction before and after"]
    ),
    "Mission-aligned": assessment(
      "Tell us about the missions you care about",
      ["What kind of company mission motivates you, and why?", "e.g., Making healthcare easier to access"],
      [
        "Describe a time you chose work because of what an organisation stood for.",
        "e.g., Joining a charity over a higher-paying role",
      ],
      [
        "How do you stay connected to an organisation's mission in your daily work?",
        "e.g., Reading customer stories and feedback",
      ]
    ),
    "Recognition-seeking": assessment(
      "Tell us how recognition motivates you",
      ["What kind of recognition motivates you most?", "e.g., Specific feedback from my manager on what went well"],
      [
        "Describe a time recognition encouraged you to do even better.",
        "e.g., Praise for a report led me to take on more analysis",
      ],
      ["How do you make sure your contributions are visible to others?", "e.g., Sharing progress updates with the team"]
    ),
    "Growth-motivated": assessment(
      "Tell us how growth motivates you",
      [
        "How important is personal and career growth to you, and why?",
        "e.g., Very important, because I want to keep building new skills",
      ],
      [
        "Describe a choice you made mainly because it helped you grow.",
        "e.g., Taking a sideways move to learn a new area",
      ],
      ["What growth are you looking for in your next role?", "e.g., Leading projects and managing people"]
    ),
    "Achievement-focused": assessment(
      "Tell us about your achievements",
      ["What is an achievement that matters to you, and why?", "e.g., Winning our team's biggest client"],
      ["How do you set targets for yourself?", "e.g., Base them on past results and add a stretch"],
      ["Describe how you reflect on an achievement once it's done.", "e.g., Note what worked so I can repeat it"]
    ),
    "Intrinsically motivated": assessment(
      "Tell us what motivates you from within",
      [
        "What do you enjoy about your work, regardless of reward?",
        "e.g., The satisfaction of solving a tricky problem",
      ],
      [
        "Describe a time you put in extra effort simply because you cared about the work.",
        "e.g., Refining a presentation nobody asked me to improve",
      ],
      ["What kind of work makes you lose track of time?", "e.g., Analysing data to find patterns"]
    ),
    Ambitious: assessment(
      "Tell us about your ambitions",
      ["Where do you want your career to be in five years?", "e.g., Leading a team in a growing company"],
      ["What are you doing now to move towards that ambition?", "e.g., Taking on projects with more responsibility"],
      [
        "Describe a time you went after an opportunity others thought was out of reach.",
        "e.g., Applying for a senior role earlier than expected",
      ]
    ),
    Enthusiastic: assessment(
      "Tell us what excites you",
      ["What excites you most about the work you want to do next?", "e.g., Working with new technology"],
      ["Describe a time your enthusiasm lifted a team or project.", "e.g., Bringing energy to a stalled campaign"],
      ["How do you stay positive during repetitive or routine work?", "e.g., Set small challenges to beat my own time"]
    ),
    Committed: assessment(
      "Tell us how you commit",
      [
        "Describe a long-term commitment you've kept, at work or outside it.",
        "e.g., Volunteering every week for three years",
      ],
      ["How do you show commitment to your team or employer?", "e.g., Seeing projects through even when they get hard"],
      ["What do you do when your commitment is tested?", "e.g., Remind myself why I started and ask for support"]
    ),
    Energetic: assessment(
      "Tell us how you bring energy",
      [
        "How do you bring energy to your work and the people around you?",
        "e.g., Starting meetings by sharing a recent win",
      ],
      [
        "Describe a time your energy helped get something over the line.",
        "e.g., Keeping momentum during a busy product launch",
      ],
      [
        "How do you manage your energy across a long or demanding week?",
        "e.g., Plan the hardest work for when I'm sharpest",
      ]
    ),
    Perseverance: assessment(
      "Tell us how you persevere",
      [
        "Describe a time you kept going on something that took much longer than expected.",
        "e.g., A year-long project with repeated setbacks",
      ],
      ["What keeps you going when you face repeated setbacks?", "e.g., Focusing on progress, not perfection"],
      ["What has perseverance taught you?", "e.g., Most problems can be solved with time and patience"]
    ),
    Initiative: assessment(
      "Tell us how you take initiative",
      ["Describe something you started or improved without being asked.", "e.g., Setting up a shared knowledge base"],
      [
        "How do you decide when to take initiative on something outside your role?",
        "e.g., When it helps the team and I can do it well",
      ],
      ["What happened the last time you took the initiative?", "e.g., My idea became the team's standard process"]
    ),
    "Drive for excellence": assessment(
      "Tell us how you pursue excellence",
      ["What does excellent work look like in your field?", "e.g., Accurate, on time and easy for others to use"],
      ["Describe a time you went beyond good enough.", "e.g., Rewriting a guide so new staff needed no extra help"],
      ["How do you keep raising your own standards?", "e.g., Asking experts for feedback on my work"]
    ),
    "Inspired by challenge": assessment(
      "Tell us how you take on challenges",
      ["Describe the toughest challenge you've taken on at work.", "e.g., Turning around an underperforming team"],
      ["Why do challenges motivate you?", "e.g., They push me to learn faster"],
      [
        "How do you approach a challenge you don't yet know how to solve?",
        "e.g., Research, ask for help and try small experiments",
      ]
    ),
    "Reward-oriented": assessment(
      "Tell us how rewards motivate you",
      ["What kinds of rewards motivate you most at work?", "e.g., Performance bonuses and clear progression"],
      [
        "Describe a time a reward or incentive pushed you to perform better.",
        "e.g., Exceeding a sales target to earn a bonus",
      ],
      [
        "How do you balance working for rewards with doing what's best for the team?",
        "e.g., Choose goals where both line up",
      ]
    ),
  },
};
