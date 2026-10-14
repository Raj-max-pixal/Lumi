export const DEVELOPER_TOPICS = [
  "Internet of Things",
  "Artificial Intelligence",
  "Web Development",
  "Mobile Development",
  "Cybersecurity",
  "Game Development",
  "Cloud Computing",
  "Open Source",
  "Robotics",
  "Data Science",
  "UI/UX Design",
  "Career and Hackathons"
] as const;

const topicTerms: Record<string, string[]> = {
  "Internet of Things": ["iot", "internet of things", "embedded", "arduino", "esp32", "sensor", "raspberry pi"],
  "Artificial Intelligence": ["ai", "ml", "machine learning", "artificial intelligence", "generative ai", "llm"],
  "Web Development": ["web", "frontend", "backend", "react", "nextjs", "javascript", "typescript"],
  "Mobile Development": ["mobile", "android", "ios", "flutter", "react native"],
  Cybersecurity: ["cybersecurity", "security", "ethical hacking", "infosec"],
  "Game Development": ["game development", "gamedev", "unity", "unreal"],
  "Cloud Computing": ["cloud", "aws", "azure", "devops", "kubernetes"],
  "Open Source": ["open source", "opensource", "github", "foss"],
  Robotics: ["robotics", "robot", "automation"],
  "Data Science": ["data science", "data analysis", "python", "pandas"],
  "UI/UX Design": ["ui", "ux", "design", "figma", "accessibility"],
  "Career and Hackathons": ["career", "internship", "hackathon", "portfolio", "interview"]
};

function normalizedWords(value: string) {
  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
}

export function topicForInterest(interest: string) {
  const words = normalizedWords(interest);
  return DEVELOPER_TOPICS.find((topic) => topicTerms[topic].some((term) => words.includes(normalizedWords(term)))) ?? null;
}

export function reelInterestScore(reel: { tags: string[]; description: string }, interests: string[]) {
  const preferred = new Set(interests.map(topicForInterest).filter((topic): topic is typeof DEVELOPER_TOPICS[number] => Boolean(topic)));
  const tagTopics = new Set(reel.tags.map(topicForInterest).filter(Boolean));
  const description = normalizedWords(reel.description);
  let score = 0;
  for (const topic of preferred) {
    if (tagTopics.has(topic)) score += 4;
    else if (topicTerms[topic].some((term) => description.includes(normalizedWords(term)))) score += 1;
  }
  return score;
}
