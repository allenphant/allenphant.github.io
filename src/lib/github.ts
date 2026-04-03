import { graphql } from "@octokit/graphql";
import type { GitHubRepo, LanguageStats, UserProfile } from "./types";

const USERNAME = import.meta.env.GH_USERNAME || "allenphant";
const TOKEN = import.meta.env.GH_PAT;

const graphqlWithAuth = graphql.defaults({
  headers: {
    ...(TOKEN && TOKEN !== "your_github_pat_here"
      ? { authorization: `token ${TOKEN}` }
      : {}),
  },
});

// In-memory cache: survives the entire build process so each API
// call is made at most once across all pages.
let _profileCache: Promise<UserProfile> | null = null;
let _reposCache: Promise<GitHubRepo[]> | null = null;

export function fetchUserProfile(): Promise<UserProfile> {
  if (!_profileCache) {
    _profileCache = _fetchUserProfile();
  }
  return _profileCache;
}

export function fetchUserRepos(): Promise<GitHubRepo[]> {
  if (!_reposCache) {
    _reposCache = _fetchUserRepos();
  }
  return _reposCache;
}

async function _fetchUserProfile(): Promise<UserProfile> {
  const { user } = await graphqlWithAuth<{ user: any }>(`
    query ($login: String!) {
      user(login: $login) {
        name
        login
        bio
        avatarUrl
        location
        company
        followers { totalCount }
        repositories(privacy: PUBLIC) { totalCount }
        url
      }
    }
  `, { login: USERNAME });

  return {
    name: user.name,
    login: user.login,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    location: user.location,
    company: user.company,
    followers: user.followers.totalCount,
    publicRepos: user.repositories.totalCount,
    url: user.url,
  };
}

async function _fetchUserRepos(): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const { user } = await graphqlWithAuth<{ user: any }>(`
      query ($login: String!, $cursor: String) {
        user(login: $login) {
          repositories(
            first: 100
            after: $cursor
            privacy: PUBLIC
            orderBy: { field: UPDATED_AT, direction: DESC }
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              name
              description
              url
              homepageUrl
              stargazerCount
              forkCount
              updatedAt
              createdAt
              isArchived
              isFork
              primaryLanguage {
                name
                color
              }
              languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
                edges {
                  size
                  node {
                    name
                    color
                  }
                }
              }
              repositoryTopics(first: 10) {
                nodes {
                  topic { name }
                }
              }
            }
          }
        }
      }
    `, { login: USERNAME, cursor });

    const { nodes, pageInfo } = user.repositories;

    for (const repo of nodes) {
      repos.push({
        name: repo.name,
        description: repo.description,
        url: repo.url,
        homepageUrl: repo.homepageUrl,
        stargazerCount: repo.stargazerCount,
        forkCount: repo.forkCount,
        updatedAt: repo.updatedAt,
        createdAt: repo.createdAt,
        isArchived: repo.isArchived,
        isFork: repo.isFork,
        primaryLanguage: repo.primaryLanguage,
        languages: repo.languages.edges.map((edge: any) => ({
          name: edge.node.name,
          color: edge.node.color,
          size: edge.size,
        })),
        topics: repo.repositoryTopics.nodes.map(
          (node: any) => node.topic.name
        ),
      });
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return repos;
}

export function computeLanguageStats(repos: GitHubRepo[]): LanguageStats[] {
  const langMap = new Map<string, { color: string; size: number }>();

  for (const repo of repos) {
    for (const lang of repo.languages) {
      const existing = langMap.get(lang.name);
      if (existing) {
        existing.size += lang.size;
      } else {
        langMap.set(lang.name, { color: lang.color, size: lang.size });
      }
    }
  }

  const totalSize = Array.from(langMap.values()).reduce(
    (sum, l) => sum + l.size,
    0
  );

  return Array.from(langMap.entries())
    .map(([name, { color, size }]) => ({
      name,
      color,
      size,
      percentage: totalSize > 0 ? Math.round((size / totalSize) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.size - a.size);
}
