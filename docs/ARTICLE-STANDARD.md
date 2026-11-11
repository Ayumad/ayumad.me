# Article Standard (ayumad.me)

The reference piece is **`src/content/journal/my-headphone-collection.md` — "My Audio Journey: How I Got Here and What I've Learned Along the Way"** (2026-11-11, ~5,500 words). Every article on the site is measured against it. When in doubt, open it and match it.

## What the reference piece does

- **It has a spine.** Chronology: where he started (Superlux + a $20 interface), what replaced it (DT 770 from Marketplace, JDS stack), the thing that hooked him (an audio-store Utopia session), then the current inventory, then what each piece is for, then what he's borrowing, then the chain, then where he's going. It is a story, not a catalogue.
- **Every claim is specific.** Model names, prices, dollar amounts, measured numbers (24.5 mW measured vs 300 mW advertised), track names and timestamps (0:20 in "Angel"). No generic adjectives doing the work of facts.
- **It says what each thing is *for*.** "The LCD-X is for the bass. The 660S2 and the tube are for guitars. The Edition XS is the yardstick." A part that has no job gets sold, and the article says so.
- **It admits the trade every time.** Losing treble detail for midrange texture, a $200 amp that measures badly but sounds right, a headphone he likes but won't buy because the drivers are exposed. The trade is the opinion.
- **It doesn't oversell.** Praise vocabulary is "pleasant", "natural", "hard to find any actual faults", "good but not special". Understatement is the register; nothing is "game-changing" except in a sentence that then says it wasn't.
- **It ends flat.** "Thank you for reading, and feel free to reach out…" No moral, no summary of lessons, no call to action.

## Voice rules (non-negotiable)

- First person, past and present, plain verbs. Contractions throughout: "I'd", "it's", "doesn't".
- Long sentences that run and splice, carrying the thinking: "…and I almost always use them with the Fosi GR70, which is the only reason that pair exists in my house." Short sentences are the exception, used for a beat.
- Concrete numbers early and often. Price-first reasoning is native to him.
- Dry humour, understated, at most a dry aside. Never a joke that announces itself.
- Hedging is real: "not necessarily", "somewhat", "I'd personally" — used where he genuinely isn't certain, not as padding on every second sentence.

### Banned

- Rhythmic parallel constructions ("five machines, five jobs", "not X but Y").
- Meta-framing openers that announce the article's structure ("In this piece, I'll…").
- Self-aware editorialising ("the part nobody writes", "that's the point").
- Thesaurus upgrades: "genuinely good", "steal of the century", "earning their keep", "left on the table".
- Balanced moral closers, summary paragraphs, "Final Thoughts" headings.
- AI signal phrases: "Let's dive in", "it's worth noting", "when it comes to", "delve", "elevate".
- Emoji. Zero.
- Invented facts, invented opinions, or invented numbers. If a claim is not in the source article, the vault, or the session log, it does not go in the piece.

## Structure and format

- **Title:** `Main title: explanatory clause`, title case on both halves. Descriptive, not a hook. No questions. Unquoted in frontmatter (the parser splits on the first colon).
- **Frontmatter:** `title`, `slug` (unchanged from the existing article), `date` (unchanged), `summary` (rewrite to match the new piece, one sentence, no hype), `tags`, `kind: article`, `status: published`.
- **Body:** no `#` heading — the H1 comes from the title. Sections are `##`, sub-items `###`. Six to twelve `##` sections is normal for a long piece; a short build write-up may have four.
- **Visuals:** exactly one where it is honest. A `text` code block for a signal chain or topology is the house format. Never invent a chart, and never chart numbers that don't exist — a table only where a table is genuinely clearest.
- **Paragraphs:** two to five sentences. One idea each.
- **Length:** as long as the material is and no longer. A single build write-up is 900–1,500 words. Fleet surveys and collection pieces can run 2,000–5,000. Padding to hit a length is a failure.

## Special case, do not rewrite

**`retiring-the-jailbreak.md`** is adapted from his own Reddit post and is treated as final draft: only spelling, capitalisation and site formatting may change. It is not to be re-voiced or restructured.

## The check before anything ships

1. Does every paragraph contain a specific fact, number, name or observation?
2. Is there a trade-off stated for each piece of gear, or is it all praise?
3. Read the first sentence out loud — does it start with the plain fact, or with throat-clearing?
4. Search for: "not necessarily", "genuinely", "incredibly", "—" used more than twice a paragraph. Count the hits and cut the worst.
5. Does it end flat, or with a moral?
6. Is anything in it not true? Check against the source article and the vault.
