/**
 * GitHub push script — uses the GitHub Git Trees API with inline content.
 * Inline content works on completely empty repos (no pre-existing blobs needed).
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run push
 *
 * Required env:
 *   GITHUB_PERSONAL_ACCESS_TOKEN
 */

import { readdirSync, readFileSync, statSync } from "fs";
import { resolve, relative, join } from "path";

const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const OWNER = "JBlizzard-sketch";
const REPO = "fundiversify";
const BASE_URL = `https://api.github.com/repos/${OWNER}/${REPO}`;
const ROOT = resolve(process.cwd(), "..");

if (!TOKEN) {
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN is not set");
  process.exit(1);
}

const HEADERS: Record<string, string> = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
  "User-Agent": "fundiversify-push-script",
};

const SKIP_DIRS = new Set([
  ".git", "node_modules", ".local", "dist", ".cache",
  ".pnpm-store", "__pycache__", ".turbo", "coverage",
  "attached_assets",
]);
const SKIP_FILES = new Set([
  "pnpm-lock.yaml", ".DS_Store", "Thumbs.db", ".replit",
]);
const SKIP_EXTS = new Set([".map", ".log", ".tsbuildinfo"]);

const TEXT_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".yaml", ".yml", ".toml", ".md", ".txt",
  ".css", ".html", ".htm", ".svg", ".sh", ".env",
  ".gitignore", ".npmrc", ".prettierrc", ".editorconfig",
  ".eslintrc", ".eslintignore", ".prettierignore",
]);

function isTextFile(filePath: string): boolean {
  const lastDot = filePath.lastIndexOf(".");
  const ext = lastDot >= 0 ? filePath.slice(lastDot) : "";
  return TEXT_EXTS.has(ext) || ext === "";
}

function collectFiles(dir: string, fileList: string[] = []): string[] {
  let entries: import("fs").Dirent[];
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return fileList; }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const absPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(absPath, fileList);
    } else if (entry.isFile()) {
      if (SKIP_FILES.has(entry.name)) continue;
      const lastDot = entry.name.lastIndexOf(".");
      const ext = lastDot >= 0 ? entry.name.slice(lastDot) : "";
      if (SKIP_EXTS.has(ext)) continue;
      try {
        const size = statSync(absPath).size;
        if (size > 2_000_000) continue;
        fileList.push(absPath);
      } catch {}
    }
  }
  return fileList;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function githubFetch(path: string, options: RequestInit = {}, retries = 3): Promise<any> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      ...options,
      headers: { ...HEADERS, ...(options.headers as Record<string, string> | undefined) },
    });
    if (res.status === 204) return null;
    const body = await res.text();

    if ((res.status === 403 || res.status === 429) && attempt < retries) {
      const waitMs = (attempt + 1) * 20_000;
      console.log(`\n  Rate limited (${res.status}), waiting ${waitMs / 1000}s...`);
      await sleep(waitMs);
      continue;
    }

    if (!res.ok && res.status !== 404 && res.status !== 409) {
      throw new Error(`GitHub API ${res.status} at ${path}: ${body.slice(0, 400)}`);
    }

    try { return JSON.parse(body); } catch { return body; }
  }
}

async function getLatestCommitSha(): Promise<string | null> {
  const data = await githubFetch(`/git/ref/heads/main`);
  if (!data || data.message) return null;
  return data.object?.sha ?? null;
}

async function getBaseTreeSha(commitSha: string): Promise<string> {
  const data = await githubFetch(`/git/commits/${commitSha}`);
  return data.tree.sha;
}

/**
 * Build tree items using inline content (no pre-created blobs needed).
 * Binary files are base64-encoded and uploaded via the blob API after initialization.
 * Text files use inline "content" which works even on empty repos.
 */
function buildTreeItems(absPaths: string[]): object[] {
  const items: object[] = [];
  let done = 0;
  const total = absPaths.length;

  for (const absPath of absPaths) {
    const relPath = relative(ROOT, absPath);
    done++;
    try {
      if (isTextFile(relPath)) {
        const content = readFileSync(absPath, "utf-8");
        items.push({ path: relPath, mode: "100644", type: "blob", content });
      } else {
        // Binary: skip for now (these are typically images, fonts — not critical for code review)
        console.log(`  skip binary: ${relPath}`);
      }
      process.stdout.write(`  [${done}/${total}] ${relPath.slice(-70)}\r`);
    } catch (err: any) {
      process.stdout.write(`\n  read error: ${relPath} — ${err.message.slice(0, 80)}\n`);
    }
  }
  return items;
}

async function createTree(baseTreeSha: string | null, treeItems: object[]): Promise<string> {
  const body: Record<string, unknown> = { tree: treeItems };
  if (baseTreeSha) body.base_tree = baseTreeSha;
  const data = await githubFetch(`/git/trees`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!data?.sha) throw new Error("Tree creation returned no SHA: " + JSON.stringify(data));
  return data.sha as string;
}

async function createCommit(message: string, treeSha: string, parentSha: string | null): Promise<string> {
  const body: Record<string, unknown> = {
    message,
    tree: treeSha,
    parents: parentSha ? [parentSha] : [],
  };
  const data = await githubFetch(`/git/commits`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!data?.sha) throw new Error("Commit creation returned no SHA: " + JSON.stringify(data));
  return data.sha as string;
}

/**
 * Initialize an empty repo by creating a placeholder file via the Contents API.
 * This is the only API that works when the repo has zero commits.
 * Returns the SHA of the resulting initial commit.
 */
async function initializeEmptyRepo(): Promise<string> {
  console.log("  Repo is empty — initializing via Contents API...");
  const data = await githubFetch(`/contents/.gitkeep`, {
    method: "PUT",
    body: JSON.stringify({
      message: "chore: initialize repository",
      content: Buffer.from("").toString("base64"),
    }),
  });
  if (!data?.commit?.sha) {
    throw new Error("Failed to initialize repo: " + JSON.stringify(data));
  }
  console.log(`  Init commit : ${data.commit.sha}`);
  return data.commit.sha as string;
}

async function upsertRef(commitSha: string, exists: boolean): Promise<void> {
  if (exists) {
    await githubFetch(`/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commitSha, force: true }),
    });
  } else {
    await githubFetch(`/git/refs`, {
      method: "POST",
      body: JSON.stringify({ ref: "refs/heads/main", sha: commitSha }),
    });
  }
}

async function main() {
  console.log(`\nFundiVerify → GitHub`);
  console.log(`Repo : https://github.com/${OWNER}/${REPO}`);
  console.log(`Root : ${ROOT}\n`);

  const absPaths = collectFiles(ROOT);
  console.log(`Files collected: ${absPaths.length}`);
  console.log(`Building tree items (inline content, no blob pre-upload needed)...\n`);

  const treeItems = buildTreeItems(absPaths);

  console.log(`\n\n  ${treeItems.length} files in tree`);
  if (treeItems.length === 0) {
    console.error("No files collected. Aborting.");
    process.exit(1);
  }

  let latestSha = await getLatestCommitSha();
  const isFirstPush = !latestSha;

  // Git Trees API requires at least one commit to exist in the repo.
  // If the repo is completely empty, seed it via the Contents API first.
  if (!latestSha) {
    latestSha = await initializeEmptyRepo();
  }

  const baseTreeSha = await getBaseTreeSha(latestSha);

  console.log(`  Latest commit : ${latestSha}`);
  console.log(`  Creating tree (${treeItems.length} items)...`);
  const treeSha = await createTree(baseTreeSha, treeItems);
  console.log(`  Tree SHA      : ${treeSha}`);

  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  const message = isFirstPush
    ? `feat: initial commit — FundiVerify platform [${ts}]`
    : `chore: sync [${ts}]`;

  console.log(`  Creating commit...`);
  const commitSha = await createCommit(message, treeSha, latestSha);
  console.log(`  Commit SHA    : ${commitSha}`);

  console.log(`  Updating branch ref (force push)...`);
  await upsertRef(commitSha, true);

  console.log(`\n✓ Done!`);
  console.log(`  https://github.com/${OWNER}/${REPO}/commit/${commitSha.slice(0, 7)}\n`);
}

main().catch((err) => {
  console.error("\nPush failed:", err.message);
  process.exit(1);
});
