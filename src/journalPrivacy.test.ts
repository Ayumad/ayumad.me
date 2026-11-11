import { describe, expect, it } from "vitest";

/**
 * Publication guard: the journal is public. Anything in this list belongs in the
 * private vault, not in src/content/journal. If this test fails, rewrite the
 * offending line to be generic rather than deleting the article's substance —
 * "the P520 running Proxmox" is fine, "the P520 in the closet" is not.
 */

const modules = import.meta.glob("./content/journal/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const RULES: { name: string; pattern: RegExp }[] = [
  { name: "IPv4 address", pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
  { name: "MAC address", pattern: /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i },
  { name: "email address", pattern: /[\w.+-]+@[\w-]+\.[a-z]{2,}/i },
  { name: "phone number", pattern: /\(?\b\d{3}\)?[-. ]\d{3}[-. ]\d{4}\b/ },
  { name: "API or private key", pattern: /\b(?:sk-|ghp_|gho_|AKIA|xox[bap]-)|-----BEGIN [A-Z ]*PRIVATE KEY/ },
  { name: "tailnet topology", pattern: /\btailnet\b/i },
  { name: "physical location of hardware", pattern: /\bcloset\b|friend'?s (?:house|place)|\bmy (?:apartment|house)\b/i },
  { name: "street address", pattern: /\b\d{1,5}\s+(?:[A-Z][a-z]+\s){1,3}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Court|Ct)\b/ },
  { name: "student or government id", pattern: /\b(?:student\s*id|SSN|social security)\b/i },
];

const SAMPLES: Record<string, string> = {
  "IPv4 address": "the box is at 100.104.19.24",
  "MAC address": "00:1A:2B:3C:4D:5E",
  "email address": "reach me at someone@example.com",
  "phone number": "call 408-555-0134",
  "API or private key": "export OPENAI_API_KEY=sk-abcdef123456",
  "tailnet topology": "it only listens on the tailnet",
  "physical location of hardware": "the P520 sits in the closet",
  "street address": "12 Rosemary Lane",
  "student or government id": "my student id is on the form",
};

describe("journal privacy", () => {
  it("rules actually catch the details they claim to", () => {
    for (const rule of RULES) {
      const sample = SAMPLES[rule.name];
      expect(sample, `no sample for rule "${rule.name}"`).toBeTruthy();
      expect(rule.pattern.test(sample), `rule "${rule.name}" failed to match "${sample}"`).toBe(true);
    }
  });

  it("publishes nothing from the private-detail list", () => {
    const violations: string[] = [];

    for (const [path, source] of Object.entries(modules)) {
      const lines = source.split("\n");
      lines.forEach((line, index) => {
        for (const rule of RULES) {
          const match = line.match(rule.pattern);
          if (match) {
            violations.push(`${path.split("/").pop()}:${index + 1} ${rule.name} — "${match[0]}"`);
          }
        }
      });
    }

    expect(
      violations,
      `Move these details to the private vault (99 System/Journal Publication Rules.md) and generalise the line:\n${violations.join("\n")}`,
    ).toEqual([]);
  });
});
