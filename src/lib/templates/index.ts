/**
 * Colliq Template Registry
 * Each template contains a TipTap-compatible JSON document.
 * Content is stored as TipTap JSON (not raw HTML) for clean editing.
 */

// ─── Helper builders ──────────────────────────────────────────────────────────

const h1 = (text: string) => ({
  type: "heading",
  attrs: { level: 1, textAlign: "left" },
  content: [{ type: "text", text }],
});

const h2 = (text: string) => ({
  type: "heading",
  attrs: { level: 2, textAlign: "left" },
  content: [{ type: "text", text }],
});

const h3 = (text: string) => ({
  type: "heading",
  attrs: { level: 3, textAlign: "left" },
  content: [{ type: "text", text }],
});

const p = (text: string) => ({
  type: "paragraph",
  attrs: { textAlign: "left" },
  content: text ? [{ type: "text", text }] : undefined,
});

const emptyP = () => ({
  type: "paragraph",
  attrs: { textAlign: "left" },
});

const boldP = (label: string, value: string) => ({
  type: "paragraph",
  attrs: { textAlign: "left" },
  content: [
    { type: "text", marks: [{ type: "bold" }], text: label },
    ...(value ? [{ type: "text", text: value }] : []),
  ],
});

const bulletList = (items: string[]) => ({
  type: "bulletList",
  content: items.map((item) => ({
    type: "listItem",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "left" },
        content: [{ type: "text", text: item }],
      },
    ],
  })),
});

const orderedList = (items: string[]) => ({
  type: "orderedList",
  attrs: { start: 1 },
  content: items.map((item) => ({
    type: "listItem",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "left" },
        content: [{ type: "text", text: item }],
      },
    ],
  })),
});

const hr = () => ({ type: "horizontalRule" });

// ─── Template type ────────────────────────────────────────────────────────────

export interface Template {
  id: string;
  title: string;
  description: string;
  content: object; // TipTap JSON doc
}

// ─── 1. RESUME ────────────────────────────────────────────────────────────────

const resume: Template = {
  id: "resume",
  title: "Professional Resume",
  description: "Clean, structured resume for any industry",
  content: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1, textAlign: "center" }, content: [{ type: "text", text: "Your Full Name" }] },
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", marks: [{ type: "italic" }], text: "Professional Title · City, Country" }] },
      {
        type: "paragraph", attrs: { textAlign: "center" },
        content: [
          { type: "text", text: "email@example.com  ·  +1 (555) 000-0000  ·  " },
          { type: "text", marks: [{ type: "link", attrs: { href: "https://linkedin.com", target: "_blank" } }], text: "LinkedIn" },
          { type: "text", text: "  ·  " },
          { type: "text", marks: [{ type: "link", attrs: { href: "https://yourportfolio.com", target: "_blank" } }], text: "Portfolio" },
        ],
      },
      hr(),
      h2("Professional Summary"),
      p("Results-driven professional with 5+ years of experience in [your field]. Proven track record of [key achievement]. Passionate about [area of expertise] and committed to delivering measurable outcomes."),
      hr(),
      h2("Work Experience"),
      h3("Senior [Job Title]"),
      boldP("Company Name", "  ·  Jan 2022 – Present  ·  City, Country"),
      bulletList([
        "Led a cross-functional team of 8 to deliver [project], resulting in a 30% improvement in [metric].",
        "Designed and implemented [system/process] that reduced operational costs by $120K annually.",
        "Collaborated with stakeholders to define product roadmap and prioritize features.",
      ]),
      emptyP(),
      h3("[Previous Job Title]"),
      boldP("Previous Company", "  ·  Jun 2019 – Dec 2021  ·  City, Country"),
      bulletList([
        "Managed [responsibility] for a portfolio of 20+ clients, achieving 98% satisfaction rate.",
        "Developed [tool/process] that improved team productivity by 25%.",
        "Recognized as Employee of the Quarter for [specific achievement].",
      ]),
      hr(),
      h2("Education"),
      h3("Bachelor of Science in [Your Major]"),
      boldP("University Name", "  ·  2015 – 2019  ·  GPA: 3.8/4.0"),
      bulletList(["Dean's List — 6 semesters", "Thesis: [Thesis Title]"]),
      hr(),
      h2("Skills"),
      bulletList([
        "Technical: [Skill 1], [Skill 2], [Skill 3], [Skill 4]",
        "Soft Skills: Strategic thinking, cross-team collaboration, stakeholder communication",
        "Tools: [Tool 1], [Tool 2], [Tool 3]",
        "Languages: English (native), [Other Language] (proficient)",
      ]),
      hr(),
      h2("Projects"),
      h3("[Project Name]"),
      p("[Brief description of the project, your role, technologies used, and the outcome. Keep it to 2–3 sentences.]"),
      hr(),
      h2("Certifications"),
      bulletList([
        "[Certification Name] — [Issuing Organization], [Year]",
        "[Certification Name] — [Issuing Organization], [Year]",
      ]),
    ],
  },
};

// ─── 2. LETTER ────────────────────────────────────────────────────────────────

const letter: Template = {
  id: "letter",
  title: "Formal Business Letter",
  description: "Professional correspondence ready to send",
  content: {
    type: "doc",
    content: [
      p(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })),
      emptyP(),
      boldP("Recipient Name", ""),
      p("Company / Organization Name"),
      p("Street Address"),
      p("City, State / Province, ZIP Code"),
      p("Country"),
      emptyP(),
      boldP("Subject: ", "[State the purpose of your letter clearly]"),
      emptyP(),
      p("Dear [Mr. / Ms. / Dr. Last Name],"),
      emptyP(),
      p("I am writing to [clearly state the purpose — e.g., express interest in, formally request, follow up on, bring to your attention]. I hope this letter finds you well."),
      emptyP(),
      p("[Main body paragraph. Provide the key details, context, or information relevant to your purpose. Be specific, professional, and concise. Include any supporting facts or references if applicable.]"),
      emptyP(),
      p("[Second body paragraph if needed. Elaborate on your request or provide additional context. Address any likely questions or concerns proactively.]"),
      emptyP(),
      p("I would greatly appreciate the opportunity to [discuss this matter further / meet at your earliest convenience / receive a response by (date)]. Please feel free to contact me at [email address] or [phone number] at your convenience."),
      emptyP(),
      p("Thank you for your time and consideration. I look forward to hearing from you."),
      emptyP(),
      p("Sincerely,"),
      emptyP(),
      emptyP(),
      boldP("Your Full Name", ""),
      p("[Your Title / Position]"),
      p("[Your Company / Organization]"),
      p("[Phone]  ·  [Email]"),
    ],
  },
};

// ─── 3. MEETING NOTES ────────────────────────────────────────────────────────

const meetingNotes: Template = {
  id: "meetingNotes",
  title: "Meeting Notes",
  description: "Structured notes, action items, and decisions",
  content: {
    type: "doc",
    content: [
      h1("Meeting Notes"),
      emptyP(),
      h2("Meeting Details"),
      boldP("Title: ", "[Meeting title or project name]"),
      boldP("Date: ", new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })),
      boldP("Time: ", "[Start time] – [End time]"),
      boldP("Location: ", "[Room / Video call link / Platform]"),
      boldP("Facilitator: ", "[Name]"),
      boldP("Notes by: ", "[Name]"),
      hr(),
      h2("Attendees"),
      bulletList(["[Name] — [Role]", "[Name] — [Role]", "[Name] — [Role]"]),
      hr(),
      h2("Agenda"),
      orderedList([
        "[Agenda item 1]",
        "[Agenda item 2]",
        "[Agenda item 3]",
      ]),
      hr(),
      h2("Discussion Points"),
      h3("Topic 1: [Topic Name]"),
      p("[Key points discussed, decisions reached, or questions raised during this topic.]"),
      bulletList(["Key point", "Decision made", "Open question"]),
      emptyP(),
      h3("Topic 2: [Topic Name]"),
      p("[Key points discussed, decisions reached, or questions raised during this topic.]"),
      bulletList(["Key point", "Decision made", "Open question"]),
      hr(),
      h2("Decisions Made"),
      bulletList([
        "[Decision 1 — agreed upon by all]",
        "[Decision 2 — agreed upon by all]",
      ]),
      hr(),
      h2("Action Items"),
      bulletList([
        "[ ] [Task description] — Owner: [Name] — Due: [Date]",
        "[ ] [Task description] — Owner: [Name] — Due: [Date]",
        "[ ] [Task description] — Owner: [Name] — Due: [Date]",
      ]),
      hr(),
      h2("Next Meeting"),
      boldP("Date: ", "[Proposed date]"),
      boldP("Agenda Preview: ", "[Brief description of next meeting topics]"),
    ],
  },
};

// ─── 4. PROJECT PROPOSAL ─────────────────────────────────────────────────────

const projectProposal: Template = {
  id: "projectProposal",
  title: "Project Proposal",
  description: "Formal proposal with objectives, timeline, and budget",
  content: {
    type: "doc",
    content: [
      h1("[Project Name]"),
      { type: "paragraph", attrs: { textAlign: "left" }, content: [{ type: "text", marks: [{ type: "italic" }], text: "Project Proposal · Prepared by [Your Name] · " + new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) }] },
      hr(),
      h2("Executive Summary"),
      p("This proposal outlines [brief description of the project]. The initiative aims to [primary goal] by [key approach], resulting in [expected outcome]. Estimated investment: [budget range] over [timeline]."),
      hr(),
      h2("Problem Statement"),
      p("[Describe the specific problem, pain point, or opportunity this project addresses. Use data or anecdotes to make it concrete. Explain why solving this problem matters now.]"),
      hr(),
      h2("Objectives"),
      bulletList([
        "Achieve [specific, measurable outcome] by [date]",
        "Reduce [metric] by [X%] within [timeframe]",
        "Deliver [output/deliverable] that enables [stakeholder] to [benefit]",
      ]),
      hr(),
      h2("Scope"),
      h3("In Scope"),
      bulletList(["[Feature / workstream 1]", "[Feature / workstream 2]", "[Feature / workstream 3]"]),
      h3("Out of Scope"),
      bulletList(["[What will NOT be covered]", "[Future phases or related work excluded]"]),
      hr(),
      h2("Proposed Solution"),
      p("[Describe your recommended approach in 2–3 paragraphs. Explain the methodology, tools, or technologies involved. Highlight why this solution is the best fit for the problem.]"),
      hr(),
      h2("Timeline"),
      bulletList([
        "Phase 1 — Discovery & Planning: [Start date] – [End date]",
        "Phase 2 — Development / Execution: [Start date] – [End date]",
        "Phase 3 — Testing & Review: [Start date] – [End date]",
        "Phase 4 — Launch / Delivery: [Start date] – [End date]",
      ]),
      hr(),
      h2("Budget"),
      bulletList([
        "Personnel / Labor: $[amount]",
        "Tools & Software: $[amount]",
        "Infrastructure / Hosting: $[amount]",
        "Contingency (10%): $[amount]",
        "Total Estimated Cost: $[total]",
      ]),
      hr(),
      h2("Team & Resources"),
      bulletList([
        "[Name] — [Role] — [Responsibility]",
        "[Name] — [Role] — [Responsibility]",
      ]),
      hr(),
      h2("Risks & Mitigation"),
      bulletList([
        "Risk: [Description] — Likelihood: [H/M/L] — Mitigation: [Plan]",
        "Risk: [Description] — Likelihood: [H/M/L] — Mitigation: [Plan]",
      ]),
      hr(),
      h2("Expected Outcomes"),
      p("[Describe the measurable impact this project will deliver. Include KPIs, business value, and long-term benefits. Make the case for why approving this proposal is the right decision.]"),
      hr(),
      h2("Approval"),
      boldP("Submitted by: ", "[Your Name], [Title]"),
      boldP("Date: ", new Date().toLocaleDateString()),
      boldP("Reviewed by: ", "_________________________"),
      boldP("Approved by: ", "_________________________"),
    ],
  },
};

// ─── 5. RESEARCH NOTES ───────────────────────────────────────────────────────

const researchNotes: Template = {
  id: "researchNotes",
  title: "Research Notes",
  description: "Capture findings, references, and insights",
  content: {
    type: "doc",
    content: [
      h1("[Research Topic Title]"),
      boldP("Researcher: ", "[Your Name]"),
      boldP("Date: ", new Date().toLocaleDateString()),
      boldP("Status: ", "In Progress"),
      hr(),
      h2("Research Question"),
      p("[State your central research question clearly. What are you trying to learn, prove, or understand?]"),
      hr(),
      h2("Background & Context"),
      p("[Summarize what is already known about this topic. Why is this research needed? What gap does it address?]"),
      hr(),
      h2("Methodology"),
      bulletList([
        "Research type: [Qualitative / Quantitative / Mixed]",
        "Data sources: [Primary interviews / secondary sources / experiments / surveys]",
        "Sample size: [N/A or specify]",
        "Analysis approach: [Thematic / statistical / comparative]",
      ]),
      hr(),
      h2("Key Findings"),
      bulletList([
        "[Finding 1 — include source or evidence]",
        "[Finding 2 — include source or evidence]",
        "[Finding 3 — include source or evidence]",
      ]),
      hr(),
      h2("Detailed Notes"),
      h3("Source 1: [Title / Author / URL]"),
      p("[Your notes on this source. Key quotes, data points, and your interpretation.]"),
      emptyP(),
      h3("Source 2: [Title / Author / URL]"),
      p("[Your notes on this source. Key quotes, data points, and your interpretation.]"),
      hr(),
      h2("Observations & Patterns"),
      p("[What patterns, contradictions, or surprises emerged across sources? What do the findings collectively suggest?]"),
      hr(),
      h2("Open Questions"),
      bulletList(["[Question that still needs answering]", "[Conflicting data point to resolve]", "[Next area to investigate]"]),
      hr(),
      h2("Conclusions"),
      p("[Summarize what you have learned. How does this answer your research question? What are the implications?]"),
      hr(),
      h2("References"),
      orderedList([
        "[Author, A. (Year). Title. Publisher/URL]",
        "[Author, B. (Year). Title. Publisher/URL]",
        "[Author, C. (Year). Title. Publisher/URL]",
      ]),
    ],
  },
};

// ─── 6. CLASS NOTES ──────────────────────────────────────────────────────────

const classNotes: Template = {
  id: "classNotes",
  title: "Class Notes",
  description: "Organized lecture notes with key concepts",
  content: {
    type: "doc",
    content: [
      h1("[Subject Name]"),
      boldP("Topic: ", "[Lecture or chapter topic]"),
      boldP("Date: ", new Date().toLocaleDateString()),
      boldP("Instructor: ", "[Professor / Teacher Name]"),
      boldP("Chapter / Week: ", "[Week X / Chapter X]"),
      hr(),
      h2("Learning Objectives"),
      p("By the end of this class, I should be able to:"),
      bulletList([
        "Understand and explain [Concept 1]",
        "Apply [method/framework] to [type of problem]",
        "Distinguish between [A] and [B]",
      ]),
      hr(),
      h2("Main Concepts"),
      h3("Concept 1: [Name]"),
      p("[Definition and explanation in your own words.]"),
      p("Key point: [The most important thing to remember about this concept]"),
      emptyP(),
      h3("Concept 2: [Name]"),
      p("[Definition and explanation in your own words.]"),
      p("Key point: [The most important thing to remember about this concept]"),
      emptyP(),
      h3("Concept 3: [Name]"),
      p("[Definition and explanation in your own words.]"),
      p("Key point: [The most important thing to remember about this concept]"),
      hr(),
      h2("Examples & Case Studies"),
      h3("Example 1"),
      p("[Describe the example given in class and how it illustrates the concept.]"),
      emptyP(),
      h3("Example 2"),
      p("[Describe the example given in class and how it illustrates the concept.]"),
      hr(),
      h2("Formulas / Frameworks / Models"),
      p("[Any formulas, diagrams, frameworks, or models introduced in class. Add images or draw them out.]"),
      hr(),
      h2("Summary"),
      p("[3–5 sentence summary of what was covered in this class in your own words.]"),
      hr(),
      h2("Questions & Clarifications Needed"),
      bulletList(["[Something I didn't fully understand]", "[A question to ask the instructor]"]),
      hr(),
      h2("Assignments & Homework"),
      bulletList([
        "[ ] [Assignment description] — Due: [Date]",
        "[ ] Read: [Chapter/pages] — Due: [Date]",
      ]),
    ],
  },
};

// ─── 7. NEWSLETTER ───────────────────────────────────────────────────────────

const newsletter: Template = {
  id: "newsletter",
  title: "Newsletter",
  description: "Professional newsletter layout with sections",
  content: {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 1, textAlign: "center" }, content: [{ type: "text", text: "[Newsletter Name]" }] },
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", marks: [{ type: "italic" }], text: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }) + " Edition" }] },
      hr(),
      h2("Editor's Note"),
      p("Welcome to this month's edition of [Newsletter Name]! This issue, we're covering [brief overview of what's inside]. As always, thank you for being part of our community."),
      p("— [Editor's Name], [Title]"),
      hr(),
      h2("Feature Story"),
      h3("[Feature Headline]"),
      p("[Write your lead story here. This is the most important or compelling piece of content in this edition. Aim for 150–250 words. Include a compelling hook, supporting details, and a clear takeaway or call to action.]"),
      hr(),
      h2("In This Issue"),
      bulletList([
        "🔹 [Story / Section 1]",
        "🔹 [Story / Section 2]",
        "🔹 [Story / Section 3]",
        "🔹 Upcoming Events",
        "🔹 Resources & Links",
      ]),
      hr(),
      h2("Story 2: [Headline]"),
      p("[Secondary story or article. Provide context, key details, and wrap up with what readers should take away or do next.]"),
      hr(),
      h2("Story 3: [Headline]"),
      p("[Third article or update. Keep it concise — 80–120 words is ideal for secondary stories.]"),
      hr(),
      h2("Upcoming Events"),
      bulletList([
        "📅 [Event Name] — [Date] — [Location / Platform]",
        "📅 [Event Name] — [Date] — [Location / Platform]",
        "📅 [Event Name] — [Date] — [Location / Platform]",
      ]),
      hr(),
      h2("Resources & Recommended Reading"),
      bulletList([
        "[Resource / Article / Tool] — [1-sentence description]",
        "[Resource / Article / Tool] — [1-sentence description]",
      ]),
      hr(),
      h2("Community Spotlight"),
      p("[Highlight a member, customer, partner, or achievement. This humanizes your newsletter and builds community.]"),
      hr(),
      h2("Contact & Subscribe"),
      boldP("Website: ", "[yourwebsite.com]"),
      boldP("Email: ", "[contact@yourdomain.com]"),
      boldP("Unsubscribe: ", "[unsubscribe link]"),
      { type: "paragraph", attrs: { textAlign: "center" }, content: [{ type: "text", marks: [{ type: "italic" }], text: "© " + new Date().getFullYear() + " [Your Organization]. All rights reserved." }] },
    ],
  },
};

// ─── 8. REPORT ───────────────────────────────────────────────────────────────

const report: Template = {
  id: "report",
  title: "Business Report",
  description: "Formal report with findings and recommendations",
  content: {
    type: "doc",
    content: [
      h1("[Report Title]"),
      boldP("Prepared by: ", "[Your Name / Team]"),
      boldP("Date: ", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })),
      boldP("Classification: ", "Internal / Confidential / Public"),
      hr(),
      h2("Table of Contents"),
      orderedList([
        "Executive Summary",
        "Introduction",
        "Background",
        "Methodology",
        "Findings",
        "Analysis",
        "Recommendations",
        "Conclusion",
        "Appendix",
      ]),
      hr(),
      h2("Executive Summary"),
      p("[Write 3–5 sentences that capture the essence of the entire report. Include the purpose, the key finding, and the primary recommendation. Decision-makers should be able to read only this section and understand the core message.]"),
      hr(),
      h2("Introduction"),
      p("[Provide context and background for the report. Explain why this report was commissioned, what problem or question it addresses, and who the intended audience is.]"),
      hr(),
      h2("Background"),
      p("[Detail any relevant history, prior research, or contextual factors needed to understand the report's findings. Cite specific events, data, or conditions that led to this investigation.]"),
      hr(),
      h2("Methodology"),
      p("The following methods were used to gather and analyze data for this report:"),
      bulletList([
        "Data sources: [List sources — databases, interviews, surveys, financial records, etc.]",
        "Time period: [Date range of data or research]",
        "Sample: [Who was surveyed or included, N=?]",
        "Analysis tools: [Software, frameworks, or approaches used]",
        "Limitations: [Any known gaps or constraints in the data]",
      ]),
      hr(),
      h2("Findings"),
      h3("Finding 1: [Title]"),
      p("[Present the finding with supporting data, statistics, or evidence. Be factual and specific.]"),
      emptyP(),
      h3("Finding 2: [Title]"),
      p("[Present the finding with supporting data, statistics, or evidence.]"),
      emptyP(),
      h3("Finding 3: [Title]"),
      p("[Present the finding with supporting data, statistics, or evidence.]"),
      hr(),
      h2("Analysis"),
      p("[Interpret the findings. What do the numbers and data points mean in context? What patterns, correlations, or trends are significant? This is where you provide expert insight beyond the raw facts.]"),
      hr(),
      h2("Recommendations"),
      orderedList([
        "[Recommendation 1: Specific, actionable, with clear rationale]",
        "[Recommendation 2: Specific, actionable, with clear rationale]",
        "[Recommendation 3: Specific, actionable, with clear rationale]",
      ]),
      hr(),
      h2("Conclusion"),
      p("[Synthesize the report's key points. Restate the most important finding and the primary recommendation. End with a forward-looking statement about next steps or implications.]"),
      hr(),
      h2("Appendix"),
      p("[Include any supporting data tables, charts descriptions, raw survey results, or additional reference material that supports the report but would interrupt the flow of the main document.]"),
    ],
  },
};

// ─── 9. LESSON PLAN ──────────────────────────────────────────────────────────

const lessonPlan: Template = {
  id: "lessonPlan",
  title: "Lesson Plan",
  description: "Structured teaching plan with objectives and activities",
  content: {
    type: "doc",
    content: [
      h1("[Lesson Title]"),
      boldP("Subject: ", "[Subject / Course Name]"),
      boldP("Grade Level: ", "[Grade / Year / Age Group]"),
      boldP("Duration: ", "[e.g., 45 minutes / 1 hour]"),
      boldP("Date: ", new Date().toLocaleDateString()),
      boldP("Teacher: ", "[Your Name]"),
      hr(),
      h2("Learning Objectives"),
      p("By the end of this lesson, students will be able to:"),
      bulletList([
        "Define and explain [key concept]",
        "Apply [skill or method] to [task or problem type]",
        "Analyze and evaluate [topic] using [framework]",
        "Create / demonstrate [product or performance]",
      ]),
      hr(),
      h2("Standards Alignment"),
      bulletList(["[Standard code] — [Brief description]", "[Standard code] — [Brief description]"]),
      hr(),
      h2("Materials Required"),
      bulletList([
        "[ ] Whiteboard / Smartboard",
        "[ ] [Worksheet or handout name]",
        "[ ] [Technology / device / software]",
        "[ ] [Physical materials if applicable]",
      ]),
      hr(),
      h2("Lesson Introduction (5–10 min)"),
      p("[Describe how you will hook students' interest and activate prior knowledge. Include the opening question, activity, or discussion prompt you'll use to engage students from the start.]"),
      hr(),
      h2("Main Instruction (20–25 min)"),
      h3("Direct Instruction"),
      p("[What will you explain, model, or demonstrate? How will you present the new material?]"),
      emptyP(),
      h3("Guided Practice"),
      p("[Describe an activity where students practice the skill WITH your support. How will you check for understanding?]"),
      hr(),
      h2("Independent / Group Activities (10–15 min)"),
      p("[Describe what students will do independently or in groups to apply what they've learned.]"),
      bulletList(["Activity: [Name]", "Instructions: [Brief description]", "Expected output: [What students produce]"]),
      hr(),
      h2("Assessment"),
      h3("Formative"),
      bulletList(["Exit ticket: [Question or task]", "Observation during activity", "Q&A / thumbs up-down"]),
      h3("Summative"),
      p("[Describe any quiz, project, or assignment that will assess deeper learning.]"),
      hr(),
      h2("Differentiation"),
      bulletList([
        "Advanced learners: [Extension activity or challenge]",
        "Struggling learners: [Scaffolding or support strategy]",
        "ELL students: [Language support strategy]",
      ]),
      hr(),
      h2("Homework / Follow-Up"),
      p("[Assign any reading, practice, or project to reinforce today's lesson. State due date clearly.]"),
      hr(),
      h2("Teacher Reflection"),
      p("[Complete after class: What went well? What needs adjustment? How will I change this for next time?]"),
    ],
  },
};

// ─── 10. BRAINSTORMING ───────────────────────────────────────────────────────

const brainstorming: Template = {
  id: "brainstorming",
  title: "Brainstorming Session",
  description: "Structure your ideas, priorities, and next steps",
  content: {
    type: "doc",
    content: [
      h1("[Project / Topic]"),
      boldP("Session Date: ", new Date().toLocaleDateString()),
      boldP("Facilitator: ", "[Name]"),
      boldP("Participants: ", "[Names]"),
      boldP("Time Box: ", "[e.g., 60 minutes]"),
      hr(),
      h2("Goal"),
      p("[State exactly what you want to achieve by the end of this brainstorming session. Be specific: 'Generate 20 ideas for X', 'Decide on the top 3 approaches for Y'.]"),
      hr(),
      h2("Problem Statement"),
      p("[How might we [accomplish something] for [who] so that [desired outcome]?]"),
      hr(),
      h2("Constraints & Requirements"),
      bulletList([
        "Must: [Non-negotiable requirement]",
        "Should: [Strong preference]",
        "Won't: [Out of scope for this session]",
      ]),
      hr(),
      h2("Raw Ideas (No Judgment)"),
      bulletList([
        "💡 [Idea 1]",
        "💡 [Idea 2]",
        "💡 [Idea 3]",
        "💡 [Idea 4]",
        "💡 [Idea 5]",
        "💡 [Idea 6]",
        "💡 [Idea 7]",
        "💡 [Idea 8]",
      ]),
      hr(),
      h2("Top Priority Ideas"),
      h3("Idea 1: [Name]"),
      p("[Expand on this idea. Why is it compelling? What would it take to implement?]"),
      boldP("Pros: ", "[List benefits]"),
      boldP("Cons: ", "[List challenges]"),
      boldP("Effort: ", "Low / Medium / High"),
      boldP("Impact: ", "Low / Medium / High"),
      emptyP(),
      h3("Idea 2: [Name]"),
      p("[Expand on this idea. Why is it compelling? What would it take to implement?]"),
      boldP("Pros: ", "[List benefits]"),
      boldP("Cons: ", "[List challenges]"),
      boldP("Effort: ", "Low / Medium / High"),
      boldP("Impact: ", "Low / Medium / High"),
      emptyP(),
      h3("Idea 3: [Name]"),
      p("[Expand on this idea. Why is it compelling? What would it take to implement?]"),
      boldP("Pros: ", "[List benefits]"),
      boldP("Cons: ", "[List challenges]"),
      boldP("Effort: ", "Low / Medium / High"),
      boldP("Impact: ", "Low / Medium / High"),
      hr(),
      h2("Decision"),
      p("[What did the group decide to pursue? Document the final decision and the reasoning behind it.]"),
      hr(),
      h2("Next Steps"),
      bulletList([
        "[ ] [Action] — Owner: [Name] — Due: [Date]",
        "[ ] [Action] — Owner: [Name] — Due: [Date]",
        "[ ] [Action] — Owner: [Name] — Due: [Date]",
      ]),
      hr(),
      h2("Parking Lot"),
      p("[Ideas or topics that came up but weren't in scope for this session. Revisit later.]"),
      bulletList(["[Parked idea 1]", "[Parked idea 2]"]),
    ],
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const TEMPLATES: Record<string, Template> = {
  resume,
  letter,
  meetingNotes,
  projectProposal,
  researchNotes,
  classNotes,
  newsletter,
  report,
  lessonPlan,
  brainstorming,
};

/** Map workspace card titles → template keys */
export const TEMPLATE_TITLE_MAP: Record<string, string> = {
  "Resume":           "resume",
  "Letter":           "letter",
  "Meeting Notes":    "meetingNotes",
  "Project Proposal": "projectProposal",
  "Research Notes":   "researchNotes",
  "Class Notes":      "classNotes",
  "Newsletter":       "newsletter",
  "Report":           "report",
  "Lesson Plan":      "lessonPlan",
  "Brainstorming":    "brainstorming",
};
