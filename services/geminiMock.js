// Lightweight mock parser used for local dev and stress testing
export async function parseRecruiterCommandMock(userMessage) {
  const msg = (userMessage || "").trim();
  const lower = msg.toLowerCase();

  let extractedName = null;
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
