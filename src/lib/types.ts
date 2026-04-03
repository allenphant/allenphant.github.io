export interface GitHubRepo {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
  createdAt: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  languages: {
    name: string;
    color: string;
    size: number;
  }[];
  topics: string[];
  isArchived: boolean;
  isFork: boolean;
}

export interface LanguageStats {
  name: string;
  color: string;
  size: number;
  percentage: number;
}

export interface UserProfile {
  name: string | null;
  login: string;
  bio: string | null;
  avatarUrl: string;
  location: string | null;
  company: string | null;
  followers: number;
  publicRepos: number;
  url: string;
}

export interface FeaturedProject {
  repoName: string;
  customDescription?: string;
  order?: number;
}

export interface ProjectsConfig {
  featured: FeaturedProject[];
  hidden: string[];
}
