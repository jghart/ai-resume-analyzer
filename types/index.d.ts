type KanbanStage = "applied" | "interview" | "offer" | "rejected";

interface Job {
  title: string;
  description: string;
  location: string;
  requiredSkills: string[];
}

interface Resume {
  id: string;
  companyName?: string;
  jobTitle?: string;
  imagePath: string;
  resumePath: string;
  feedback: Feedback;
  status?: string;
  stage?: KanbanStage;
  createdAt?: string;
  analyzedAt?: string;
  jobDescription?: string;
}

interface Feedback {
  overallScore: number;
  ATS: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
    }[];
  };
  toneAndStyle: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  content: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  structure: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
  skills: {
    score: number;
    tips: {
      type: "good" | "improve";
      tip: string;
      explanation: string;
    }[];
  };
}

interface KVItem {
  key: string;
  value: string;
}

interface FSItem {
  path: string;
  name: string;
  is_dir?: boolean;
}

interface PuterUser {
  username: string;
  email?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface ContentBlock {
  type: string;
  text?: string;
  puter_path?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

interface PuterChatOptions {
  model?: string;
}

interface AIResponse {
  message?: {
    content: string | ContentBlock[];
  };
  content?: string | ContentBlock[];
}