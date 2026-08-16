// @koanjan/dsh-plugin-boundary — DSH plugin development boundary skill plugin
//
// Runs inside the DSH process as a cordis bundle (profile layer, mounted via
// dsh.bundle.patch). Provides a single skill (dsh-plugin-boundary):
//   skills.registerProvider — registers a skill provider, shipping SKILL.md + rules/*.md
//
// This skill codifies platform boundary rules for DSH plugin development
// (Client↔Host channels, filesystem capabilities, dynamic vs bundle plugin
// lifecycle, install/effect/debug rules), for trade-off decisions before
// writing a plugin.

import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_ROOT = join(__dirname, "..", "skills");

const PROVIDER_NAME = "dsh-plugin-boundary";
const RANK = 600; // BUNDLED_SKILL_RANK: same precedence as official bundled skills

const SKILLS = [
  {
    dir: "dsh-plugin-boundary",
    name: "dsh-plugin-boundary",
    description:
      "DSH plugin development capability boundaries: officially supported vs undocumented vs impossible Client↔Host channels, official API filesystem limits, dynamic vs bundle plugin lifecycle, and hard install/debug rules.",
    whenToUse:
      "Before designing a DSH plugin (bundle or dynamic), planning Client↔Host communication, planning UI, reading filesystem content, or judging plugin cross-restart behavior.",
  },
];

async function buildSkillParts(skillDir) {
  const base = join(SKILLS_ROOT, skillDir);
  const files = [];
  files.push(["SKILL.md", join(base, "SKILL.md")]);
  const rulesDir = join(base, "rules");
  const entries = await readdir(rulesDir).catch(() => []);
  for (const f of entries.sort()) {
    files.push([f, join(rulesDir, f)]);
  }
  return files;
}

function makeProvider() {
  return {
    name: PROVIDER_NAME,
    list() {
      return Promise.resolve({
        candidates: SKILLS.map((meta) => ({
          name: meta.name,
          description: meta.description,
          whenToUse: meta.whenToUse,
          invocation: { modelInvocable: true, userInvocable: true },
          source: "bundle:" + meta.dir,
          provider: PROVIDER_NAME,
          rank: RANK,
          resourceBase: { kind: "directory", path: join(SKILLS_ROOT, meta.dir) },
          locator: meta.name,
        })),
        complete: true,
      });
    },
    async get(candidate) {
      const meta = SKILLS.find((m) => m.name === candidate.name);
      if (meta === undefined) return undefined;
      const parts = await buildSkillParts(meta.dir);
      const chunks = [];
      for (const [filename, filePath] of parts) {
        const text = (await readFile(filePath, "utf-8")).replace(/\r\n/g, "\n").trim();
        chunks.push(`<resource name="${filename}">\n${text}\n</resource>`);
      }
      return {
        name: meta.name,
        description: meta.description,
        whenToUse: meta.whenToUse,
        invocation: { modelInvocable: true, userInvocable: true },
        source: "bundle:" + meta.dir,
        provider: PROVIDER_NAME,
        content: chunks.join("\n\n"),
        path: join(SKILLS_ROOT, meta.dir),
      };
    },
  };
}

export default {
  name: "plugin-boundary",
  inject: ["skills"],
  apply(ctx) {
    ctx.effect(() => ctx.skills.registerProvider(() => makeProvider()));
  },
};
