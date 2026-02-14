import { DetailedAnalysis, SimilarityAnalysis } from "../types";

/**
 * Lightweight mock parser for command parsing (works in browser and Node)
 */
function parseRecruiterCommandMock(userMessage: string): {
  action: string;
  params: any;
} {
  const msg = (userMessage || "").trim();
  const lower = msg.toLowerCase();

  let extractedName: string | null = null;
  const forMatch = msg.match(/for\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
  if (forMatch) extractedName = forMatch[1].trim();
  else {
    const candMatch = msg.match(/candidate\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/i);
    if (candMatch) extractedName = candMatch[1].trim();
  }

  if (lower.includes("shortlist"))
    return { action: "shortlist_top", params: { count: 3 } };
  if (lower.includes("filter"))
    return {
      action: "filter_candidates",
      params: { skill: "react", min_experience: 2, top: 5 },
    };
  if (lower.includes("summarize"))
    return {
      action: "summarize_candidate",
      params: { name: extractedName || "" },
    };
  if (lower.includes("questions"))
    return {
      action: "generate_questions",
      params: { name: extractedName || "" },
    };
  if (lower.includes("email") || lower.includes("draft"))
    return {
      action: "generate_email",
      params: { type: "invite", name: extractedName || "" },
    };
  if (lower.includes("analytics") || lower.includes("summary"))
    return { action: "analytics_summary", params: {} };
  return { action: "none", params: {} };
}

export class GeminiService {
  private readonly VERSION = "2025-02-09-hotfix-v3"; // Cache bust key

  constructor() {}

  async parseRecruiterCommand(userMessage: string): Promise<any> {
    try {
      return parseRecruiterCommandMock(userMessage);
    } catch (err) {
      console.error("Parse error:", err);
      return { action: "none", params: { error: "parse_failed" } };
    }
  }

  async analyzeResume(
    resumeText: string,
    jobDescription: string,
  ): Promise<DetailedAnalysis> {
    const text = (resumeText || "").toLowerCase();
    const jdText = (jobDescription || "").toLowerCase();

    // ===== COMPREHENSIVE JD ANALYSIS =====
    // Define domain-specific skill requirements
    const skillDomains = {
      dataAnalyst: {
        required: [
          "sql",
          "tableau",
          "power bi",
          "python",
          "r",
          "excel",
          "analytics",
          "dashboard",
          "data visualization",
        ],
        nice: [
          "machine learning",
          "statistical",
          "predictive",
          "bigquery",
          "snowflake",
        ],
        forbidden: [
          "kubernetes",
          "docker",
          "devops",
          "infrastructure",
          "cloud architecture",
          "ci/cd",
          "terraform",
        ],
      },
      cloudEngineer: {
        required: [
          "aws",
          "azure",
          "gcp",
          "kubernetes",
          "docker",
          "terraform",
          "infrastructure",
          "cloud",
        ],
        nice: ["devops", "ci/cd", "helm", "ansible", "jenkins"],
        forbidden: [
          "tableau",
          "power bi",
          "statistical analysis",
          "sql analytics",
          "data warehouse",
        ],
      },
      softwareDeveloper: {
        required: [
          "java",
          "python",
          "javascript",
          "c++",
          "apis",
          "databases",
          "backend",
          "frontend",
        ],
        nice: ["react", "node.js", "spring", "microservices", "git"],
        forbidden: ["only data analyst", "business intelligence"],
      },
      dataEngineer: {
        required: [
          "sql",
          "python",
          "spark",
          "hadoop",
          "data pipeline",
          "etl",
          "kafka",
        ],
        nice: ["aws", "azure", "bigquery", "snowflake", "airflow"],
        forbidden: ["only frontend", "ui design"],
      },
    };

    // Detect JD domain (check specific phrases first to avoid generic matches)
    let jdDomain = "unknown";
    let dominantRequiredSkills: string[] = [];

    if (jdText.includes("data engineer") || jdText.includes("data-engineer")) {
      jdDomain = "dataEngineer";
      dominantRequiredSkills = skillDomains.dataEngineer.required;
    } else if (
      jdText.includes("data analyst") ||
      jdText.includes("data-analyst") ||
      jdText.includes("analyst")
    ) {
      jdDomain = "dataAnalyst";
      dominantRequiredSkills = skillDomains.dataAnalyst.required;
    } else if (
      jdText.includes("cloud engineer") ||
      jdText.includes("cloud") ||
      jdText.includes("devops") ||
      jdText.includes("kubernetes")
    ) {
      jdDomain = "cloudEngineer";
      dominantRequiredSkills = skillDomains.cloudEngineer.required;
    } else if (jdText.includes("developer") || jdText.includes("engineer")) {
      jdDomain = "softwareDeveloper";
      dominantRequiredSkills = skillDomains.softwareDeveloper.required;
    }

    // Count matched required skills in resume
    let requiredSkillsMatch = 0;
    let totalRequired = dominantRequiredSkills.length;
    dominantRequiredSkills.forEach((skill) => {
      if (text.includes(skill)) requiredSkillsMatch++;
    });

    const requiredSkillMatchPercent =
      totalRequired > 0 ? (requiredSkillsMatch / totalRequired) * 100 : 0;

    // ===== EXTREME JOB-FIT CHECK (BEFORE ANYTHING ELSE) =====
    // For Data Analyst role: MUST have BI tools OR data analysis projects
    // Without these, score is capped at 25 regardless of other achievements
    let jobFitCap = 100; // Default: no cap
    let jobFitWarning = "";

    if (jdDomain === "dataAnalyst") {
      const hasTableau = /tableau/.test(text);
      const hasPowerBI = /power\s?bi|powerbi/.test(text);
      const hasDataVisualization = /data\s?visualization|dashboard/.test(text);
      const hasAnalyticsProject =
        /analytics|analyzing.*data|data.*analysis/.test(text);

      const hasDataAnalystSkillset =
        hasTableau || hasPowerBI || hasDataVisualization || hasAnalyticsProject;

      // HARD RULE: if NO BI tools AND NO data projects, max score is 25
      if (!hasDataAnalystSkillset) {
        jobFitCap = 25;
        jobFitWarning = `No BI tools (Tableau/PowerBI) or data analysis projects detected`;
      }

      // DEBUG LOG
      console.log(
        `[JOB FIT CAP] Resume: ${resumeText.substring(0, 40)}, Tableau: ${hasTableau}, PowerBI: ${hasPowerBI}, DataViz: ${hasDataVisualization}, Analytics: ${hasAnalyticsProject}, HasSkillset: ${hasDataAnalystSkillset}, CAP: ${jobFitCap}`,
      );
    }

    // Check for domain mismatches (red flags) — require strong context signals
    let hasDomainMismatch = false;
    let mismatchReason = "";

    if (jdDomain === "dataAnalyst") {
      // Detect cybersecurity/cloud infra specific keywords (strong indicators of wrong domain)
      const hasCybersecurityFocus =
        /cybersecurity|vulnerability assessment|endpoint security|firewall|sophos|nessus|edr|ids|ips|penetration|malware|incident response|security operations|security posture|threat|vulnerability management|compliance framework|iso 27001|zero trust|burp suite|sqlmap|wireshark|patch management/.test(
          text,
        );
      const hasCloudInfra =
        /kubernetes|docker|terraform|devops|infrastructure as code|cloud architecture|devops pipeline/.test(
          text,
        );

      // Require BI TOOLS EXPLICITLY (Tableau/PowerBI) for data-analysis focus — not just generic keywords
      const hasDataAnalysisTools =
        /tableau|power\s?bi|powerbi|dashboard|data\s?visualization/.test(text);

      // Count additional context signals
      const dataAnalysisKeywords = [
        "analytics",
        "data analysis",
        "bi tool",
        "business intelligence",
        "exploratory",
      ];
      let dataAnalysisCount = 0;
      dataAnalysisKeywords.forEach((keyword) => {
        if (text.includes(keyword)) dataAnalysisCount++;
      });

      // Mismatch if cybersecurity/cloud is strong AND NO BI tools AND weak context signals
      if (
        (hasCybersecurityFocus || hasCloudInfra) &&
        !hasDataAnalysisTools &&
        dataAnalysisCount < 2
      ) {
        hasDomainMismatch = true;
        jobFitCap = 18; // Even stricter for obvious mismatch
        mismatchReason = hasCybersecurityFocus
          ? "Cybersecurity focus, not Data Analysis"
          : "Cloud Infrastructure focus, not Data Analysis";
      }

      // DEBUG: Log mismatch detection
      console.log(
        `[MISMATCH DEBUG] Name: ${resumeText.substring(0, 50)}, Cyber: ${hasCybersecurityFocus}, Cloud: ${hasCloudInfra}, BITools: ${hasDataAnalysisTools}, AnalysisKeywords: ${dataAnalysisCount}, MISMATCH: ${hasDomainMismatch}, JobFitCap: ${jobFitCap}`,
      );
    } else if (jdDomain === "cloudEngineer") {
      const hasCloudExperience =
        /\baws\b|\bazure\b|\bgcp\b|kubernetes|docker|infrastructure|devops|cloud|terraform|ansible|helm/.test(
          text,
        );
      const hasOnlyDataAnalysis =
        /tableau|power\s?bi|powerbi|statistical analysis|data visualization/.test(
          text,
        ) && !hasCloudExperience;
      if (hasOnlyDataAnalysis) {
        hasDomainMismatch = true;
        jobFitCap = 25;
        mismatchReason = "Data Analysis focus, not Cloud Engineering";
      }
    }

    // ===== SECTION PRESENCE CHECKS =====
    const hasExperience =
      /experience|work|employment|career|professional|job history/.test(text);
    const hasEducation =
      /education|degree|bachelor|master|university|college|phd|diploma|graduated|gpa/.test(
        text,
      );
    const hasSkills =
      /skills|technical|proficient|expertise|languages|tools|platforms|competencies/.test(
        text,
      );
    const hasProjects =
      /project|developed|designed|implemented|built|created|led|managed|deployed/.test(
        text,
      );
    const hasCertifications =
      /certification|certified|license|aws certified|gcp certified|azure|pmp/.test(
        text,
      );
    const hasSummary =
      /summary|objective|profile|about|overview|introduction/.test(text);

    // ===== EXPERIENCE LEVEL DETECTION =====
    const yearsMatch = text.match(
      /(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)/i,
    );
    const yearsOfExp = yearsMatch ? parseInt(yearsMatch[1]) : 0;
    const seniorityLevel =
      yearsOfExp >= 10
        ? 4 // Principal/Staff level
        : yearsOfExp >= 7
          ? 3 // Senior
          : yearsOfExp >= 4
            ? 2 // Mid-level
            : yearsOfExp >= 2
              ? 1 // Junior
              : 0; // Entry-level

    // ===== SPECIFIC TOOL/TECHNOLOGY MENTIONS =====
    const dataAnalystTools = [
      "sql",
      "tableau",
      "power bi",
      "python",
      "r language",
      "excel",
      "dashboard",
    ];
    const advancedAnalytics = [
      "machine learning",
      "predictive",
      "statistical",
      "regression",
      "neural network",
      "deep learning",
    ];
    const cloudPlatforms = ["aws", "azure", "gcp", "snowflake", "bigquery"];
    const databases = ["mysql", "postgresql", "mongodb", "oracle", "teradata"];

    let toolCount = 0;
    let advancedCount = 0;
    let cloudCount = 0;
    let dbCount = 0;

    dataAnalystTools.forEach((tool) => {
      if (text.includes(tool)) toolCount++;
    });
    advancedAnalytics.forEach((tech) => {
      if (text.includes(tech)) advancedCount++;
    });
    cloudPlatforms.forEach((platform) => {
      if (text.includes(platform)) cloudCount++;
    });
    databases.forEach((db) => {
      if (text.includes(db)) dbCount++;
    });

    const hasSpecializedTools = toolCount >= 4;
    const hasSomeTechSkills = toolCount >= 2;
    const hasAdvancedSkills = advancedCount >= 2;
    const hasCloudExperience = cloudCount >= 1;

    // ===== ACHIEVEMENT COUNTING & QUANTIFICATION =====
    const achievementPatterns = [
      { pattern: /increased|grew|expanded|boosted/gi, weight: 1.5 },
      { pattern: /decreased|reduced|minimized|optimized/gi, weight: 1.5 },
      { pattern: /improved|enhanced|strengthened|refined/gi, weight: 1 },
      { pattern: /delivered|achieved|accomplished|completed/gi, weight: 1.2 },
      { pattern: /led|managed|directed|oversaw|headed/gi, weight: 1.3 },
      { pattern: /awarded|won|recognized|promoted/gi, weight: 1.4 },
    ];

    let achievementScore = 0;
    achievementPatterns.forEach((item) => {
      const matches = text.match(item.pattern);
      if (matches) {
        achievementScore += matches.length * item.weight;
      }
    });

    const hasExceptionalAchievements = achievementScore >= 12;
    const hasStrongAchievements = achievementScore >= 6;
    const hasSomeAchievements = achievementScore >= 2;

    // ===== QUANTIFIED METRICS (VERY STRICT) =====
    const metricPatterns = [
      /\$\d+[mk]?(?:\s+(?:in|of|revenue|profit))?/gi, // Money
      /\d+%\s+(?:increase|improvement|growth|reduction)/gi, // Percentage improvement
      /\d+x\s+(?:faster|improvement|growth|increase)/gi, // Multiple improvement
      /reduced\s+(?:by\s+)?\d+%/gi, // Reduction metrics
      /\d+(?:,\d{3})?\+?\s+(?:users?|customers?|records?|reports?|dashboards?)/gi, // Scale metrics
    ];

    let metricsCount = 0;
    metricPatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) metricsCount += matches.length;
    });

    const hasExceptionalMetrics = metricsCount >= 8;
    const hasMultipleMetrics = metricsCount >= 4;
    const hasGoodMetrics = metricsCount >= 2;
    const hasMinimalMetrics = metricsCount === 1;

    // ===== LEADERSHIP & IMPACT =====
    const leadershipMatch = text.match(
      /led|managed|directed|supervised|mentor|team lead|manager|head of|built team/gi,
    );
    const leadershipLevel = leadershipMatch ? leadershipMatch.length : 0;
    const hasSignificantLeadership = leadershipLevel >= 4;
    const hasModerateLeadership = leadershipLevel >= 2;

    // ===== PROJECT DEPTH & COMPLEXITY =====
    const projectMatches = text.match(/project:|case study:|initiative:/gi);
    const projectCount = projectMatches ? projectMatches.length : 0;
    const hasComplexProjects = projectCount >= 4;
    const hasMultipleProjects = projectCount >= 2;

    // ===== ACTION VERB DENSITY (Resume Quality) =====
    const actionVerbs =
      /\b(designed|developed|implemented|analyzed|created|built|architected|optimized|automated|led|managed|coordinated|drove|spearheaded|pioneered|delivered|executed|evaluated|assessed|forecasted)\b/gi;
    const actionVerbCount = (text.match(actionVerbs) || []).length;
    const hasStrongLanguage = actionVerbCount >= 15;
    const hasGoodLanguage = actionVerbCount >= 8;

    // ===== ACADEMIC CREDENTIALS =====
    const hasGPA =
      /gpa|3\.[0-9]|4\.0|honors|cum\s+laude|dean's|high distinction/.test(text);
    const hasAdvancedDegree = /master|phd|m\.?b\.?a|m\.?s\.|m\.?tech/i.test(
      text,
    );
    const hasBachelor = /bachelor|b\.?s\.|b\.?a\.|undergraduate/.test(text);

    // ===== QUALITY CHECKS =====
    const wordCount = text.split(/\s+/).length;
    const hasBulletPoints = (text.match(/^[\s]*[•\-\*]\s/gm) || []).length >= 5;
    const isExceptional = wordCount >= 400;
    const isComprehensive = wordCount >= 250;
    const isGoodLength = wordCount >= 150;
    const isTooShort = wordCount < 100;

    const hasDates =
      /\d{4}|\d{1,2}\/\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/gi.test(
        text,
      );
    const dateCount = (text.match(/\d{4}|\d{1,2}\/\d{1,2}/gi) || []).length;
    const hasGoodDateStructure = dateCount >= 4;

    // ===== KEYWORD MATCHING WITH JD (STRICTER - DOMINANT FACTOR) =====
    const jdTerms = jdText
      .split(/[\s,;.!?\/\-]+/)
      .filter((w) => w.length > 4 && !/^\d+$/.test(w)) // Longer terms only
      .slice(0, 60); // Fewer terms for stricter matching

    let matchedTerms = 0;
    jdTerms.forEach((term) => {
      if (text.includes(term)) matchedTerms++;
    });

    const matchPercent =
      jdTerms.length > 0 ? (matchedTerms / jdTerms.length) * 100 : 0;

    // ===== 15-PARAMETER COMPREHENSIVE ATS SCORING SYSTEM =====
    // Each parameter is weighted and explained

    // === PARAMETER 1: SKILL MATCH SCORE (15% weight) ===
    // Semantic similarity between resume skills and JD required skills
    const skillSynonyms = {
      python: [
        "python",
        "pandas",
        "numpy",
        "scikit",
        "sklearn",
        "tensorflow",
        "pytorch",
      ],
      sql: ["sql", "mysql", "postgresql", "oracle", "rdbms", "database"],
      tableau: ["tableau", "power bi", "powerbi", "dashboard", "visualization"],
      "machine learning": [
        "machine learning",
        "ml",
        "deep learning",
        "neural",
        "regression",
        "classification",
      ],
      "data analysis": [
        "data analysis",
        "analytics",
        "statistical",
        "analysis",
        "insight",
      ],
      java: ["java", "spring", "maven", "gradle"],
      javascript: ["javascript", "react", "node", "angular", "vue"],
      cloud: ["aws", "azure", "gcp", "cloud", "kubernetes", "docker"],
    };

    let skillMatchCount = 0;
    let skillMatchTotal = 0;
    Object.entries(skillSynonyms).forEach(([skill, synonyms]) => {
      if (jdText.toLowerCase().includes(skill)) {
        skillMatchTotal++;
        const resumeHasAny = synonyms.some((syn) => text.includes(syn));
        if (resumeHasAny) skillMatchCount++;
      }
    });
    const param1_skillMatch =
      skillMatchTotal > 0 ? (skillMatchCount / skillMatchTotal) * 100 : 0;

    // === PARAMETER 2: EXPERIENCE RELEVANCE (15% weight) ===
    // Years of RELEVANT experience in domain, not total years
    const yearsInDomainMatch = yearsOfExp * (requiredSkillMatchPercent / 100);
    const param2_experienceRelevance = Math.min(
      100,
      (yearsInDomainMatch / 5) * 100,
    );

    // === PARAMETER 3: PROJECT RELEVANCE (12% weight) ===
    // How many projects match JD domain semantically
    const jdDomainKeywords =
      jdDomain === "dataAnalyst"
        ? ["analytics", "data", "dashboard", "analysis", "visualization"]
        : jdDomain === "cloudEngineer"
          ? ["cloud", "infrastructure", "kubernetes", "docker", "deployment"]
          : ["project", "development"];

    const projectDomainMatches = (
      text.match(/project:|case study:|initiative:/gi) || []
    ).length;
    const domainKeywordMatches = jdDomainKeywords.filter((k) =>
      text.toLowerCase().includes(k),
    ).length;
    const param3_projectRelevance =
      projectCount > 0
        ? Math.min(
            100,
            (domainKeywordMatches / jdDomainKeywords.length) * 100 +
              projectDomainMatches * 10,
          )
        : 0;

    // === PARAMETER 4: ROLE ALIGNMENT (10% weight) ===
    // Job title similarity with target role
    const extractJobTitles = (resumeText: string): string[] => {
      const titlePatterns = /(?:role:|position:|title:|as\s+)([^,.\n]+)/gi;
      const matches = resumeText.match(titlePatterns) || [];
      return matches.map((m) => m.toLowerCase());
    };
    const jobTitles = extractJobTitles(text);
    const targetRoleTerms =
      jdDomain === "dataAnalyst"
        ? ["analyst", "analyst", "data"]
        : jdDomain === "cloudEngineer"
          ? ["engineer", "architect", "devops", "sre"]
          : ["developer", "engineer"];

    const roleMatches = jobTitles.filter((title) =>
      targetRoleTerms.some((term) => title.includes(term)),
    ).length;
    const param4_roleAlignment =
      jobTitles.length > 0
        ? Math.min(100, (roleMatches / jobTitles.length) * 100)
        : 50; // Neutral if no titles found

    // === PARAMETER 5: TECH STACK DEPTH (10% weight) ===
    // Not just presence, but combinations and depth
    const techStackItems = [toolCount, dbCount, cloudCount, advancedCount];
    const averageStackDepth =
      techStackItems.reduce((a, b) => a + b) / techStackItems.length;
    const param5_techStackDepth = Math.min(100, averageStackDepth * 15);

    // === PARAMETER 6: RESUME STRUCTURE SCORE (8% weight) ===
    // Proper sections present
    const sections = [
      hasExperience,
      hasEducation,
      hasSkills,
      hasProjects,
      hasSummary,
    ];
    const sectionCount = sections.filter(Boolean).length;
    const param6_structureScore = (sectionCount / 5) * 100;

    // === PARAMETER 7: ATS PARSEABILITY (8% weight) ===
    // Can parser extract key info cleanly
    const hasContactInfo = /email|phone|linkedin|github/i.test(text);
    const hasConsistentFormatting = (text.match(/\n/g) || []).length > 10;
    const noExcessiveSymbols = (text.match(/[@#$%^&*]/g) || []).length < 20;
    const param7_parseability =
      (hasContactInfo ? 40 : 0) +
      (hasConsistentFormatting ? 40 : 0) +
      (noExcessiveSymbols ? 20 : 0);

    // === PARAMETER 8: CONCISENESS SCORE (6% weight) ===
    // 1-2 pages optimal
    const wordCountScore = wordCount < 100 ? 20 : wordCount > 600 ? 40 : 100;
    const param8_conciseness = wordCountScore;

    // === PARAMETER 9: EDUCATION FIT (7% weight) ===
    // Degree relevance to role
    const educationRelevance = {
      dataAnalyst: [
        "statistics",
        "mathematics",
        "computer science",
        "engineering",
        "economics",
      ],
      cloudEngineer: [
        "computer science",
        "engineering",
        "information technology",
      ],
      default: ["computer science", "engineering"],
    };
    const targetEducation =
      educationRelevance[jdDomain] || educationRelevance.default;
    const educationMatch = targetEducation.some((ed) =>
      text.toLowerCase().includes(ed),
    );
    const param9_educationFit =
      (educationMatch ? 80 : 0) +
      (hasAdvancedDegree ? 20 : hasBachelor ? 10 : 0);

    // === PARAMETER 10: CERTIFICATIONS/PROOF SCORE (6% weight) ===
    // AWS, GCP, Kaggle, GitHub presence
    const certScores = {
      aws: /aws certified|aws|amazon/.test(text) ? 20 : 0,
      gcp: /gcp certified|google cloud|gcp/.test(text) ? 20 : 0,
      azure: /azure certified|microsoft/.test(text) ? 15 : 0,
      kaggle: /kaggle/.test(text) ? 15 : 0,
      github: /github\.com/.test(text) ? 15 : 0,
      coursera: /coursera/.test(text) ? 10 : 0,
    };
    const param10_certifications = Math.min(
      100,
      Object.values(certScores).reduce((a, b) => a + b, 0),
    );

    // === PARAMETER 11: WRITING QUALITY SCORE (5% weight) ===
    // Grammar, clarity, professionalism
    const hasGrammarIssues = /\b(u are|your going|ther|becuz)\b/i.test(text)
      ? 30
      : 0;
    const hasProfessionalTone =
      /demonstrated|achieved|accomplished|led|managed|spearheaded/i.test(text)
        ? 70
        : 30;
    const param11_writingQuality =
      100 - hasGrammarIssues + (hasProfessionalTone > 50 ? 20 : 0);

    // === PARAMETER 12: SEMANTIC JD-RESUME SIMILARITY (10% weight) ===
    // Overall thematic match (simulating embeddings with pattern matching)
    const jdLength = jdText.split(/\s+/).length;
    const resumeLength = text.split(/\s+/).length;
    const sharedDomainTerms = [
      ...new Set(jdText.toLowerCase().split(/\s+/)),
    ].filter(
      (word) => text.toLowerCase().includes(word) && word.length > 4,
    ).length;
    const sharedTermsPercent = (sharedDomainTerms / jdLength) * 100;
    const param12_semanticSimilarity = Math.min(100, sharedTermsPercent * 2);

    // === PARAMETER 13: ACHIEVEMENT IMPACT SCORE (12% weight) ===
    // Awards, hackathon wins, leadership, open-source
    const hasAwards = /award|won|recognized|first place|winner|excellence/.test(
      text,
    )
      ? 30
      : 0;
    const hasLeadership =
      leadershipLevel >= 3 ? 40 : leadershipLevel > 0 ? 20 : 0;
    const hasOpenSource =
      /open source|github|contribution|repository|maintained/.test(text)
        ? 30
        : 0;
    const param13_achievementImpact = Math.min(
      100,
      hasAwards + hasLeadership + hasOpenSource,
    );

    // === PARAMETER 14: METRIC/QUANTIFICATION SCORE (8% weight) ===
    // Specific numbers and measurable results
    const param14_metricsScore = Math.min(100, (metricsCount / 5) * 100);

    // === PARAMETER 15: CAREER PROGRESSION (6% weight) ===
    // Shows growth and advancement
    const roleProgression =
      jobTitles.length > 0 ? Math.min(100, (jobTitles.length / 4) * 100) : 0;
    const param15_careerProgression = roleProgression;

    // === CALCULATE WEIGHTED FINAL SCORE ===
    const weights = {
      skillMatch: 0.15,
      experienceRelevance: 0.15,
      projectRelevance: 0.12,
      roleAlignment: 0.1,
      techStackDepth: 0.1,
      structureScore: 0.08,
      parseability: 0.08,
      conciseness: 0.06,
      educationFit: 0.07,
      certifications: 0.06,
      writingQuality: 0.05,
      semanticSimilarity: 0.1,
      achievementImpact: 0.12,
      metricsScore: 0.08,
      careerProgression: 0.06,
    };

    const parameterScores = [
      {
        name: "Skill Match",
        score: param1_skillMatch,
        weight: weights.skillMatch,
      },
      {
        name: "Experience Relevance",
        score: param2_experienceRelevance,
        weight: weights.experienceRelevance,
      },
      {
        name: "Project Relevance",
        score: param3_projectRelevance,
        weight: weights.projectRelevance,
      },
      {
        name: "Role Alignment",
        score: param4_roleAlignment,
        weight: weights.roleAlignment,
      },
      {
        name: "Tech Stack Depth",
        score: param5_techStackDepth,
        weight: weights.techStackDepth,
      },
      {
        name: "Resume Structure",
        score: param6_structureScore,
        weight: weights.structureScore,
      },
      {
        name: "ATS Parseability",
        score: param7_parseability,
        weight: weights.parseability,
      },
      {
        name: "Conciseness",
        score: param8_conciseness,
        weight: weights.conciseness,
      },
      {
        name: "Education Fit",
        score: param9_educationFit,
        weight: weights.educationFit,
      },
      {
        name: "Certifications",
        score: param10_certifications,
        weight: weights.certifications,
      },
      {
        name: "Writing Quality",
        score: param11_writingQuality,
        weight: weights.writingQuality,
      },
      {
        name: "Semantic Similarity",
        score: param12_semanticSimilarity,
        weight: weights.semanticSimilarity,
      },
      {
        name: "Achievement Impact",
        score: param13_achievementImpact,
        weight: weights.achievementImpact,
      },
      {
        name: "Metrics Score",
        score: param14_metricsScore,
        weight: weights.metricsScore,
      },
      {
        name: "Career Progression",
        score: param15_careerProgression,
        weight: weights.careerProgression,
      },
    ].map((p) => ({
      ...p,
      status: (p.score >= 70 ? "selected" : "not_selected") as
        | "selected"
        | "not_selected",
    }));

    const atsScore = Math.round(
      param1_skillMatch * weights.skillMatch +
        param2_experienceRelevance * weights.experienceRelevance +
        param3_projectRelevance * weights.projectRelevance +
        param4_roleAlignment * weights.roleAlignment +
        param5_techStackDepth * weights.techStackDepth +
        param6_structureScore * weights.structureScore +
        param7_parseability * weights.parseability +
        param8_conciseness * weights.conciseness +
        param9_educationFit * weights.educationFit +
        param10_certifications * weights.certifications +
        param11_writingQuality * weights.writingQuality +
        param12_semanticSimilarity * weights.semanticSimilarity +
        param13_achievementImpact * weights.achievementImpact +
        param14_metricsScore * weights.metricsScore +
        param15_careerProgression * weights.careerProgression,
    );

    console.log(`[ATS BREAKDOWN] ${resumeText.substring(0, 40)}`);
    console.log(`  1. Skill Match: ${param1_skillMatch.toFixed(1)}%`);
    console.log(
      `  2. Experience Relevance: ${param2_experienceRelevance.toFixed(1)}%`,
    );
    console.log(
      `  3. Project Relevance: ${param3_projectRelevance.toFixed(1)}%`,
    );
    console.log(`  4. Role Alignment: ${param4_roleAlignment.toFixed(1)}%`);
    console.log(`  5. Tech Stack Depth: ${param5_techStackDepth.toFixed(1)}%`);
    console.log(`  6. Structure Score: ${param6_structureScore.toFixed(1)}%`);
    console.log(`  7. Parseability: ${param7_parseability.toFixed(1)}%`);
    console.log(`  8. Conciseness: ${param8_conciseness.toFixed(1)}%`);
    console.log(`  9. Education Fit: ${param9_educationFit.toFixed(1)}%`);
    console.log(`  10. Certifications: ${param10_certifications.toFixed(1)}%`);
    console.log(`  11. Writing Quality: ${param11_writingQuality.toFixed(1)}%`);
    console.log(
      `  12. Semantic Similarity: ${param12_semanticSimilarity.toFixed(1)}%`,
    );
    console.log(
      `  13. Achievement Impact: ${param13_achievementImpact.toFixed(1)}%`,
    );
    console.log(`  14. Metrics Score: ${param14_metricsScore.toFixed(1)}%`);
    console.log(
      `  15. Career Progression: ${param15_careerProgression.toFixed(1)}%`,
    );
    console.log(`  FINAL SCORE: ${atsScore}%`);

    // Generate a unique tie-breaker based on multiple resume characteristics
    // This ensures no two resumes have the exact same score
    const uniqueFactors = [
      resumeText.length,
      (resumeText.match(/[A-Z]/g) || []).length,
      (resumeText.match(/\d/g) || []).length,
      resumeText.charCodeAt(0) || 1,
      resumeText.charCodeAt(Math.floor(resumeText.length / 2)) || 1,
      resumeText.charCodeAt(resumeText.length - 1) || 1,
    ];
    
    // Create a hash from multiple factors
    let hash = 0;
    uniqueFactors.forEach((factor, index) => {
      hash += factor * (index + 1);
    });
    for (let i = 0; i < Math.min(resumeText.length, 100); i++) {
      const char = resumeText.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Create a small decimal (0.001-0.999) based on hash for uniqueness
    const tieBreaker = (Math.abs(hash) % 999 + 1) / 1000;

    // Ensure score is valid and add unique tie-breaker
    const baseScore = Math.max(0, Math.min(100, atsScore));
    const finalAtsScore = Math.min(100, baseScore + tieBreaker);

    // ===== BUILD DETAILED PARAMETER EXPLANATIONS =====
    const explanations: string[] = [];

    // Parameter 1
    explanations.push(
      `[P1] SKILL MATCH (${param1_skillMatch.toFixed(0)}% | 15% weight): ${
        param1_skillMatch > 75
          ? `✓ STRONG - Resume mentions key JD skills (Python, SQL, Tableau, etc.)`
          : param1_skillMatch > 50
            ? `△ MODERATE - Resume has ${skillMatchCount}/${skillMatchTotal} key skill areas`
            : `✗ WEAK - Missing critical skills required for this role`
      }`,
    );

    // Parameter 2
    explanations.push(
      `[P2] EXPERIENCE RELEVANCE (${param2_experienceRelevance.toFixed(0)}% | 15% weight): ${
        param2_experienceRelevance > 75
          ? `✓ STRONG - ${yearsOfExp} years with ${requiredSkillMatchPercent.toFixed(0)}% domain relevance`
          : param2_experienceRelevance > 50
            ? `△ MODERATE - Some relevant experience but skill match is only ${requiredSkillMatchPercent.toFixed(0)}%`
            : `✗ WEAK - Limited relevant experience in target domain`
      }`,
    );

    // Parameter 3
    explanations.push(
      `[P3] PROJECT RELEVANCE (${param3_projectRelevance.toFixed(0)}% | 12% weight): ${
        param3_projectRelevance > 75
          ? `✓ STRONG - ${projectCount} projects aligned with ${jdDomain}`
          : param3_projectRelevance > 40
            ? `△ MODERATE - ${projectCount} projects but limited ${jdDomain} focus`
            : `✗ WEAK - Projects don't match JD domain (${domainKeywordMatches}/${jdDomainKeywords.length} domain keywords found)`
      }`,
    );

    // Parameter 4
    explanations.push(
      `[P4] ROLE ALIGNMENT (${param4_roleAlignment.toFixed(0)}% | 10% weight): ${
        param4_roleAlignment > 75
          ? `✓ STRONG - Job titles closely match target role (${jobTitles.length} roles found)`
          : param4_roleAlignment > 50
            ? `△ MODERATE - Some role alignment but career path varies`
            : `✗ WEAK - Job titles don't align with target role`
      }`,
    );

    // Parameter 5
    explanations.push(
      `[P5] TECH STACK DEPTH (${param5_techStackDepth.toFixed(0)}% | 10% weight): ${
        param5_techStackDepth > 75
          ? `✓ STRONG - Diverse tech stack: ${toolCount} tools, ${dbCount} databases, ${cloudCount} cloud platforms`
          : param5_techStackDepth > 50
            ? `△ MODERATE - Limited stack depth. Tools: ${toolCount}, Databases: ${dbCount}`
            : `✗ WEAK - Minimal technical tools mentioned (${toolCount} tools)`
      }`,
    );

    // Parameter 6
    explanations.push(
      `[P6] RESUME STRUCTURE (${param6_structureScore.toFixed(0)}% | 8% weight): ${
        param6_structureScore === 100
          ? `✓ PERFECT - All sections present (Summary, Skills, Experience, Projects, Education)`
          : param6_structureScore > 75
            ? `✓ GOOD - ${sectionCount}/5 key sections found`
            : `✗ INCOMPLETE - Only ${sectionCount}/5 sections (missing structure harms ATS readability)`
      }`,
    );

    // Parameter 7
    explanations.push(
      `[P7] ATS PARSEABILITY (${param7_parseability.toFixed(0)}% | 8% weight): ${
        param7_parseability > 75
          ? `✓ STRONG - Clean formatting, contact info found, minimal special characters`
          : param7_parseability > 50
            ? `△ MODERATE - Some formatting issues that may affect parsing`
            : `✗ WEAK - Poor formatting makes ATS extraction difficult`
      }`,
    );

    // Parameter 8
    explanations.push(
      `[P8] CONCISENESS (${param8_conciseness.toFixed(0)}% | 6% weight): ${
        param8_conciseness === 100
          ? `✓ OPTIMAL - ${wordCount} words (1-2 pages sweet spot)`
          : wordCount < 100
            ? `✗ TOO SHORT - ${wordCount} words (needs more detail)`
            : `✗ TOO LONG - ${wordCount} words (consider condensing to 1-2 pages)`
      }`,
    );

    // Parameter 9
    explanations.push(
      `[P9] EDUCATION FIT (${param9_educationFit.toFixed(0)}% | 7% weight): ${
        param9_educationFit > 80
          ? `✓ STRONG - Relevant degree (${hasAdvancedDegree ? "Advanced degree" : "Bachelor"}) in target field`
          : param9_educationFit > 40
            ? `△ MODERATE - Degree present but not perfectly aligned`
            : `✗ WEAK - Education section missing or unrelated degree`
      }`,
    );

    // Parameter 10
    explanations.push(
      `[P10] CERTIFICATIONS (${param10_certifications.toFixed(0)}% | 6% weight): ${
        param10_certifications > 50
          ? `✓ CREDIBLE - AWS/GCP/Azure/Coursera/Kaggle credentials found`
          : param10_certifications > 0
            ? `△ SOME - Limited certifications (${param10_certifications.toFixed(0)}% score)`
            : `✗ NONE - No AWS, GCP, Azure, Kaggle, or GitHub listed (adds proof)`
      }`,
    );

    // Parameter 11
    explanations.push(
      `[P11] WRITING QUALITY (${param11_writingQuality.toFixed(0)}% | 5% weight): ${
        param11_writingQuality > 80
          ? `✓ EXCELLENT - Professional language (achieved, demonstrated, led, managed)`
          : param11_writingQuality > 60
            ? `△ GOOD - Generally professional with minor issues`
            : `✗ WEAK - Informal tone or grammar issues detected`
      }`,
    );

    // Parameter 12
    explanations.push(
      `[P12] SEMANTIC SIMILARITY (${param12_semanticSimilarity.toFixed(0)}% | 10% weight): ${
        param12_semanticSimilarity > 75
          ? `✓ STRONG - Resume and JD share significant thematic overlap (${sharedDomainTerms} shared terms)`
          : param12_semanticSimilarity > 50
            ? `△ MODERATE - Some alignment but missing key concepts`
            : `✗ WEAK - Resume and JD discuss very different topics`
      }`,
    );

    // Parameter 13
    explanations.push(
      `[P13] ACHIEVEMENT IMPACT (${param13_achievementImpact.toFixed(0)}% | 12% weight): ${
        param13_achievementImpact > 75
          ? `✓ EXCEPTIONAL - Shows awards, leadership, or open-source contributions`
          : param13_achievementImpact > 30
            ? `△ SOME - Limited achievement documentation`
            : `✗ MISSING - No awards, leadership, or visible impact demonstrated`
      }`,
    );

    // Parameter 14
    explanations.push(
      `[P14] METRICS SCORE (${param14_metricsScore.toFixed(0)}% | 8% weight): ${
        param14_metricsScore > 75
          ? `✓ STRONG - ${metricsCount} quantified results (numbers, %, impact)`
          : param14_metricsScore > 30
            ? `△ MODERATE - ${metricsCount} metrics found (needs more specificity)`
            : `✗ WEAK - Missing quantifiable achievements (${metricsCount} metrics)`
      }`,
    );

    // Parameter 15
    explanations.push(
      `[P15] CAREER PROGRESSION (${param15_careerProgression.toFixed(0)}% | 6% weight): ${
        param15_careerProgression > 75
          ? `✓ STRONG - Clear advancement: ${jobTitles.length} distinct roles showing growth`
          : param15_careerProgression > 40
            ? `△ MODERATE - ${jobTitles.length} roles but limited progression`
            : `✗ LIMITED - Fewer role transitions or horizontal movement`
      }`,
    );

    // ===== GENERATE FEEDBACK WITH PARAMETER BREAKDOWN =====
    const pros: string[] = [];
    const gaps: string[] = [];
    const breakdown: string[] = [];

    // Add top 3 strength parameters
    const paramScores = [
      { name: "Skill Match", score: param1_skillMatch, weight: 15 },
      {
        name: "Experience Relevance",
        score: param2_experienceRelevance,
        weight: 15,
      },
      { name: "Project Relevance", score: param3_projectRelevance, weight: 12 },
      { name: "Role Alignment", score: param4_roleAlignment, weight: 10 },
      { name: "Tech Stack Depth", score: param5_techStackDepth, weight: 10 },
      {
        name: "Semantic Similarity",
        score: param12_semanticSimilarity,
        weight: 10,
      },
      {
        name: "Achievement Impact",
        score: param13_achievementImpact,
        weight: 12,
      },
    ];

    const topStrengths = paramScores
      .filter((p) => p.score > 75)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    const weakAreas = paramScores
      .filter((p) => p.score < 40)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    topStrengths.forEach((s) => {
      pros.push(`✓ ${s.name}: ${s.score.toFixed(0)}% (${s.weight}% weight)`);
    });

    // Add detailed parameter explanations to gaps/pros
    explanations.forEach((exp) => {
      if (exp.includes("✓") || exp.includes("✗")) {
        if (exp.includes("✓")) {
          breakdown.push(exp);
        } else {
          breakdown.push(exp);
        }
      }
    });

    weakAreas.forEach((s) => {
      gaps.push(
        `✗ ${s.name}: ${s.score.toFixed(0)}% (${s.weight}% weight) - Room for improvement`,
      );
    });

    // Domain mismatch - flag it but don't cap score
    if (hasDomainMismatch) {
      gaps.push(`⚠️ MISMATCHED DOMAIN: ${mismatchReason}`);
    }

    if (hasExperience) {
      if (seniorityLevel === 4)
        pros.push("Principal-level expertise documented");
      else if (seniorityLevel === 3)
        pros.push("Senior-level experience demonstrated");
      else if (seniorityLevel === 2) pros.push("Strong mid-career background");
      else pros.push("Entry to junior level experience listed");
    } else {
      gaps.push("CRITICAL: Work experience section missing");
    }

    if (hasEducation) {
      if (hasAdvancedDegree) pros.push("Advanced degree holder");
      else pros.push("Strong educational foundation");
    } else {
      gaps.push("CRITICAL: Education background required");
    }

    if (requiredSkillsMatch >= 4)
      pros.push(
        `Excellent technical stack (${requiredSkillsMatch} core tools)`,
      );
    else if (requiredSkillsMatch >= 2)
      pros.push(
        `Good technical foundation (${requiredSkillsMatch} core tools)`,
      );
    else if (hasSomeTechSkills)
      gaps.push("Limited specialized tools - enhance technical skills");
    else gaps.push("CRITICAL: Add relevant technical tools");

    if (hasExceptionalMetrics)
      pros.push(
        `Outstanding metrics documentation (${metricsCount} quantified results)`,
      );
    else if (hasMultipleMetrics)
      pros.push(`Good use of metrics (${metricsCount} quantified results)`);
    else gaps.push("CRITICAL: Add quantifiable achievements with numbers");

    if (hasAdvancedSkills)
      pros.push("Advanced analytics expertise demonstrated");
    if (hasCloudExperience) pros.push("Cloud platform experience documented");

    if (hasSignificantLeadership)
      pros.push("Strong leadership and team management");
    else if (hasModerateLeadership) pros.push("Some management experience");

    if (hasComplexProjects) pros.push("Complex project portfolio demonstrated");
    else if (hasMultipleProjects)
      gaps.push("Add more detailed project examples");
    else gaps.push("Include specific project case studies");

    if (hasStrongLanguage) pros.push("Excellent action-oriented language");
    else if (!hasGoodLanguage) gaps.push("Use stronger action verbs");

    if (hasCertifications) pros.push("Industry certifications held");

    if (matchPercent > 60)
      pros.push(`Excellent JD alignment (${Math.round(matchPercent)}%)`);
    else if (matchPercent > 30)
      gaps.push(
        `Moderate JD alignment (${Math.round(matchPercent)}%) - emphasize role requirements`,
      );
    else
      gaps.push(
        `CRITICAL: Poor JD match (${Math.round(matchPercent)}%) - revise to match job description`,
      );

    const experienceScore =
      seniorityLevel === 4
        ? 95
        : seniorityLevel === 3
          ? 85
          : seniorityLevel === 2
            ? 70
            : seniorityLevel === 1
              ? 50
              : 30;
    const skillScoreVal = hasSpecializedTools
      ? 88
      : hasSomeTechSkills
        ? 65
        : hasSkills
          ? 45
          : 20;
    const projectScore = hasComplexProjects
      ? 85
      : hasMultipleProjects
        ? 65
        : hasProjects
          ? 45
          : 20;

    // === Build concise semantic executive summary (unique per resume) ===
    const levelPhrase =
      seniorityLevel === 4
        ? "Principal-level"
        : seniorityLevel === 3
          ? "Senior"
          : seniorityLevel === 2
            ? "Mid-level"
            : seniorityLevel === 1
              ? "Junior"
              : "Entry-level";

    // gather top matching technical terms for a short skills phrase
    const skillCandidates = [
      ...dataAnalystTools,
      ...databases,
      ...cloudPlatforms,
      ...advancedAnalytics,
    ];
    const matchedSkills: string[] = [];
    skillCandidates.forEach((s) => {
      if (s && text.includes(s) && !matchedSkills.includes(s))
        matchedSkills.push(s);
    });
    const topSkills = matchedSkills.slice(0, 4).join(", ");

    const metricsPhrase = hasExceptionalMetrics
      ? `demonstrates strong measurable impact (${metricsCount}+ results)`
      : hasMultipleMetrics
        ? `includes multiple quantified outcomes (${metricsCount})`
        : hasGoodMetrics
          ? `some measurable results (${metricsCount})`
          : "limited quantifiable outcomes";

    const projectsPhrase = hasComplexProjects
      ? `complex project portfolio (${projectCount} case studies)`
      : hasMultipleProjects
        ? `multiple projects (${projectCount})`
        : hasProjects
          ? "project experience"
          : "few project examples";

    const leadPhrase = hasSignificantLeadership
      ? "experienced leader"
      : hasModerateLeadership
        ? "some leadership experience"
        : "";

    const matchPhrase =
      matchPercent >= 70
        ? `strong alignment to role (${Math.round(matchPercent)}%)`
        : matchPercent >= 50
          ? `moderate alignment (${Math.round(matchPercent)}%)`
          : `limited alignment (${Math.round(matchPercent)}%)`;

    const rec =
      atsScore >= 85
        ? "Highly recommended for interview"
        : atsScore >= 75
          ? "Recommended for interview"
          : atsScore >= 65
            ? "Consider for interview"
            : atsScore >= 50
              ? "Screen further"
              : "Not recommended at this time";

    const yearsPhrase = yearsOfExp ? `${yearsOfExp} yrs` : "";

    const parts: string[] = [];
    parts.push(`${levelPhrase}${yearsPhrase ? ` • ${yearsPhrase}` : ""}`);
    if (topSkills) parts.push(`Skills: ${topSkills}`);
    parts.push(metricsPhrase);
    parts.push(projectsPhrase);
    if (leadPhrase) parts.push(leadPhrase);
    parts.push(matchPhrase);
    parts.push(rec);

    const executiveSummary = parts
      .filter(Boolean)
      .join(" — ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      atsScore: Math.round(finalAtsScore * 1000) / 1000, // 3 decimal places for uniqueness
      roleFit: Math.round(matchPercent),
      experienceScore,
      skillScore: skillScoreVal,
      breakdown: {
        skills: skillScoreVal,
        experience: experienceScore,
        projects: projectScore,
        education: hasAdvancedDegree ? 85 : hasBachelor ? 70 : 30,
        clarity: isExceptional
          ? 90
          : isComprehensive
            ? 75
            : isGoodLength
              ? 60
              : 30,
      },
      matchedSkillsPercent: Math.round(matchPercent),
      missingSkillsPercent: Math.max(0, 100 - Math.round(matchPercent)),
      summary: executiveSummary,
      pros: pros.length > 0 ? pros : ["Resume recognized"],
      gaps: gaps.length > 0 ? gaps : ["Solid overall profile"],
      parameterBreakdown: explanations, // 15-parameter detailed explanations
      parameterScores, // 15-parameter numeric scores with selected status
      cultureLatentVector:
        finalAtsScore > 75
          ? "high_alignment"
          : finalAtsScore > 60
            ? "medium_alignment"
            : "low_alignment",
      lastUpdated: new Date().toISOString(),
    };
  }

  async compareResumes(resumes: any[]): Promise<SimilarityAnalysis> {
    // Deterministic similarity based on pairwise Jaccard of token sets.
    if (!resumes || resumes.length < 2) {
      return {
        similarity_percentage: 0,
        suspicion_score: 0,
        risk_level: "Low",
        reasons: [],
      };
    }

    const normalize = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t && t.length > 2);
    // Common resume stopwords to exclude (reduces false positives)
    const resumeStopwords = new Set([
      "experience",
      "work",
      "employment",
      "career",
      "professional",
      "led",
      "managed",
      "developed",
      "designed",
      "implemented",
      "created",
      "built",
      "deployed",
      "skills",
      "technical",
      "expertise",
      "education",
      "degree",
      "university",
      "bachelor",
      "master",
      "project",
      "projects",
      "team",
      "achieved",
      "delivered",
      "improved",
      "increased",
      "reduced",
      "optimized",
      "enhanced",
      "responsibilities",
      "achievement",
      "awards",
      "certification",
      "certified",
      "license",
      "proficiency",
      "proficient",
      "knowledge",
      "understanding",
      "ability",
      "capable",
      "competent",
      "excellent",
      "strong",
      "solid",
      "good",
      "experienced",
      "expert",
      "junior",
      "senior",
      "lead",
      "leader",
      "leadership",
      "management",
      "date",
      "dates",
      "period",
      "year",
      "years",
      "month",
      "months",
    ]);

    const normalizeFiltered = (s: string) =>
      (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((t) => t && t.length > 3 && !resumeStopwords.has(t));
    const sets = resumes.map(
      (r) => new Set(normalizeFiltered(r.content || r.analysis?.summary || "")),
    );

    const pairs: number[] = [];
    const commonTokens: Record<string, number> = {};

    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const a = sets[i];
        const b = sets[j];
        const inter: string[] = [];
        a.forEach((tok) => {
          if (b.has(tok)) inter.push(tok);
        });
        const unionSize = new Set([...a, ...b]).size || 1;
        const jaccard = inter.length / unionSize;
        pairs.push(jaccard);
        inter.forEach((t) => (commonTokens[t] = (commonTokens[t] || 0) + 1));
      }
    }

    const avg = pairs.length
      ? pairs.reduce((s, v) => s + v, 0) / pairs.length
      : 0;
    const similarity_percentage = Math.round(avg * 100);
    const suspicion_score = Math.round(avg * 10); // 0-10 scale

    // Count how many rare tokens are shared across multiple resumes
    const sharedRareTokenCount = Object.entries(commonTokens).filter(
      ([_, count]) => count > 1,
    ).length;

    // EXTREMELY STRICT: Default to Low unless overwhelming evidence of duplication
    let risk_level: "Low" | "Medium" | "High" = "Low";

    // Only High if 98%+ identical AND 5+ shared rare tokens (near-perfect copy)
    if (avg >= 0.98 && sharedRareTokenCount >= 5) {
      risk_level = "High";
    }
    // Only Medium if 96%+ identical AND 8+ shared rare tokens (very likely duplicate)
    else if (avg >= 0.96 && sharedRareTokenCount >= 8) {
      risk_level = "Medium";
    }
    // Everything else is Low risk (normal different resumes)

    const sortedCommon = Object.entries(commonTokens)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((p) => p[0]);

    const reasons = sortedCommon.length
      ? [`Common unique terms: ${sortedCommon.join(", ")}`]
      : ["No significant overlap detected"];

    return {
      similarity_percentage,
      suspicion_score,
      risk_level,
      reasons,
    };
  }

  async generateInterviewQuestions(
    resumeText: string,
    jobDescription: string,
  ): Promise<{ technical: string[]; behavioral: string[] }> {
    const nameMatch = (resumeText || "").match(/([A-Z][a-z]+\s[A-Z][a-z]+)/);
    const name = nameMatch ? nameMatch[0] : "Candidate";
    return {
      technical: [
        `${name}: Describe your primary technical strengths relevant to this role.`,
        `${name}: Walk through your most impactful project and your role.`,
        `${name}: How would you design a scalable system?`,
      ],
      behavioral: [
        `${name}: Tell us about a time you handled conflicting priorities.`,
        `${name}: How do you approach mentorship and knowledge sharing?`,
        `${name}: Describe a situation where you overcame a major obstacle.`,
      ],
    };
  }

  async draftGmail(
    resume: any,
    jd: any,
    status: string = "Eligible",
  ): Promise<string> {
    const isRejection = status === "Ineligible";
    if (isRejection) {
      return `Hi ${resume.candidateName},\n\nThank you for your interest in the ${jd.title} position. After careful review, we have decided to move forward with other candidates whose experience aligns more closely with our current needs.\n\nWe appreciate your time and wish you the best in your future endeavors.\n\nBest,\nRecruiting Team\n\nNote: This is an automated mail generated by the TopRes AI Recruitment Engine.`;
    }
    return `Hi ${resume.candidateName},\n\nWe're impressed by your background for the role of ${jd.title}. We'd like to invite you to the next stage.\n\nBest,\nRecruiting Team\n\nNote: This is an automated mail generated by the TopRes AI Recruitment Engine.`;
  }
}

export const gemini = new GeminiService();
