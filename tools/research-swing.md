# Swing & Micro-timing Research for Step-Sequencer

Scope: MPC-style swing convention and formula; "negative"/anticipated swing; cumbia rhythm-section micro-timing; a recommended bipolar swing-knob mapping per genre. Web research only (WebSearch + WebFetch), September 2026. Confidence ratings are mine, based on source quality and agreement across sources.

---

## 1. MPC-style swing: convention and formula

**Convention confirmed.** MPC/Akai-style swing is defined on pairs of adjacent steps (classically: the even-numbered 16th note within each 8th-note pair is delayed; the odd/on-beat 16th stays put). Roger Linn's own description: "I merely delay the second 16th note within each 8th note" — swing is expressed as the percentage of the pair's duration given to the first (on-beat) note, with the remainder going to the second (off-beat) note. 50% = equal split = straight. 66% (2/3–1/3 split) approximates a triplet feel. 75% (3/4–1/4 split) pushes the off-beat note further, toward what's conventionally called a "dotted" feel (the label is a rough production-culture term, not a rigorous notated dotted-16th).

**Exact formula (derived from the convention above, and cross-checked against a published worked example, see CMUSE below).** Let `S` = swing percentage on the 50–75(-100) scale, `Sfrac = S/100`, and `step` = the duration of one straight (unswung) step (a 16th note at the current tempo: `step_ms = 60000 / (BPM × 4)`). The off-beat step's timing delay, as a fraction of one straight step, is:

```
delay_fraction_of_step = 2 × Sfrac − 1        (equivalently: (S − 50) / 50)
delay_ms               = step_ms × (2 × Sfrac − 1)
```

Sanity checks:
- S = 50% → delay = 0 (straight).
- S = 66.67% → delay = 0.333 step, i.e. the off-beat note lands 1/3 of a step late, splitting the 8th-note pair 2:1 — the classic swung-eighth/triplet approximation.
- S = 75% → delay = 0.5 step, i.e. the off-beat note lands a half-step late (roughly a "dotted" feel).

This matches the worked numeric table from CMUSE's swing-ratio calculator (at 120 BPM, treating the pair as one full "beat" of 500 ms): 50% → 0 ms delay; 66.7% → 83.5 ms delay (~1/3 of the 250 ms half-pair); 75% → 125 ms delay (exactly half the 250 ms half-pair). Scaled to a 16th-step sequencer, the same ratios apply to the 16th-note pair duration.

**Typical "real-world" swing settings by genre**, per production-blog consensus (converged across several independent sources; treat as informal industry lore, not measured data):

| Genre / feel | Typical swing % | Source |
|---|---|---|
| Subtle "un-quantize," barely audible | 54–57% | electronicproduction.co.uk |
| Boom-bap / modern hip-hop, "groovy but tight" | 54–62% | electronicproduction.co.uk, gearspace |
| House ("bounce") | ~54–58% (creeping in), 58–62% (obvious) | electronicproduction.co.uk |
| UK garage / 2-step | 63–67%, with 64% cited as a reliable default; some producers use Ableton's "SP1200 16 Swing-71" groove (~60%) | evosounds.com, studiobrootle.com |
| Neo-soul, heavy MPC groove | 58–62% | electronicproduction.co.uk |
| Perfect triplet / "swung 8ths" | 66% | Roger Linn (Attack Magazine), Padwolf |

Confidence: **High** for the formula/convention (directly stated by Roger Linn, the person who designed the original MPC swing algorithm, corroborated by two independent explainer sites and a swing-ratio calculator). **Medium** for the specific genre percentage ranges — these come from production-education blogs and forums, not measured studies, and different sources give overlapping but not identical ranges. No source gave a specific number for UK funky (see §4).

---

## 2. "Negative" / reverse / anticipated swing

**Confirmed as a real, named concept**, used by at least two DAW-education sources:

- Attack Magazine, "Going Off Grid: What Is Swing And How To Add It": *"Moving notes to a less than 50% swing value is referred to as a 'negative' swing and creates an anticipatory, more rushed feel."* This is the clearest, most explicit statement found of the >50/<50 bipolar framing this project wants to use — same source also states the ordinary (positive) convention: "swing shifts the weak beat in every pair away from the grid," demonstrated at 52/64/73%.
- A second summarized source (via search snippet, exact origin among liveaspects.com / KAN Samples blog / similar production-education sites) echoes the same "negative swing = anticipatory, rushed feel" framing, suggesting this is a somewhat established informal term in the production-tutorial world, not a one-off coinage.

**DAW/hardware support for negative or arbitrary-direction micro-timing:**
- **Elektron Digitakt/Octatrack**: the manual's Micro Timing menu explicitly lets you "add micro timing to a note trig, moving it ahead or behind the beat," per-step, on both audio and MIDI tracks — i.e., genuinely bidirectional micro-timing distinct from (and stackable with) the track-level Swing parameter. (Elektron Digitakt User Manual, ManualsLib Octatrack manual pages.)
- **Ableton Live Groove Pool**: documented Timing/Quantize/Global Amount controls scale how strongly a groove's timing template is applied, but the official manual text I could fetch does not explicitly say the underlying Timing offsets can be negative (earlier than grid) — this is asserted by third-party tutorials, not by Ableton's own manual, in the material I could access. **Confidence: Low-Medium** on the Ableton-specific claim; the general Groove Pool architecture (per-note timing deltas from a template) is consistent with supporting negative offsets, and third-party sources say it does, but I could not confirm this from Ableton's own docs directly.
- I found **no source** explicitly describing Roland or Korg groove-box swing implementations as supporting negative/anticipated swing values (searches did not surface Roland/Korg manual text on this). Treat as unconfirmed — **no source found**.

**Genres/traditions associated with anticipated (early) off-beat timing:**

- **Brazilian samba** — the strongest, best-documented case, but note it is a different phenomenon from MPC-style swing (see caveat below). Multiple micro-timing studies (see references) found that in samba's underlying 16th-note pulse, the 3rd and (in some analyses) 4th sixteenth notes are played measurably **ahead of** their quantized grid position, not delayed — i.e., an anticipated/pushed feel on parts of the beat, not a uniform "long-short" swing of alternating pairs. Cristina Gerischer's fieldwork-based study of Bahian samba percussion ("O Suingue Baiano," 2006) is the seminal ethnographic/acoustic source; Fabien Gouyon (2007) and Naveda et al. (2009/2011, "Multidimensional microtiming in Samba music") quantified the anticipation of the 3rd/4th sixteenth across corpora of recordings; Danielsen's body of work (2006 book on funk/James Brown microrhythm, and the edited 2018 volume "Time and Timing in the Performance of Music") and Haugen & Danielsen's ICMPC papers on samba rhythm-and-body-movement extend this into cross-genre "microrhythm" theory. Sources agree the pattern is uneven and non-isochronous at the sixteenth-note level; they use somewhat different duration-pattern labels (I saw both "medium-medium-medium-long" and "ML-S-MS-L" described across summaries of the literature — see caveat under §3), but they consistently agree the deviation is systematic, tempo-dependent, and includes anticipation (earliness), not just delay.
  - **Important caveat, directly answering the "not the jazz/MPC kind" framing in the prompt**: none of the samba sources describe this as a simple "off-beat pulled early" story analogous to a bipolar swing knob. It's a whole-pattern uneven-16th phenomenon (all four 16ths in a beat have distinct characteristic durations, and the deviation direction/magnitude is tempo-dependent), closer to "notes inégales" than to a single swing parameter. Treat any mapping of samba onto a single-knob swing value as a simplification.
- **Afro-Cuban clave / rumba**: one visualization-tools paper (on Afro-Cuban percussion timing, via ResearchGate) documents a specific tapper "rushing" the second note of rumba clave — i.e. individual/idiosyncratic anticipation is documented in the clave-performance literature, but I did not find a systematic, corpus-level claim that Afro-Cuban music as a genre uses a consistent "anticipated off-beat" convention comparable to MPC swing. **Confidence: Low** for a generalizable Afro-Cuban "negative swing" claim; the evidence found is about individual performer timing deviation in an academic timing-visualization study, not a genre convention.
- **Cumbia**: see §3 — I found **no dedicated micro-timing/acoustic study** of cumbia scraper or ensemble timing. General descriptions call cumbia's feel "syncopated" and give it a "chu-chucu-chu" character, but none of the sources found make an explicit ahead/behind claim backed by measurement. **Confidence: Low** on any specific directional claim for cumbia (see §3 for full discussion).
- **General "Latin ahead-of-the-beat" claim**: this is common informal wisdom in producer/musician discourse (e.g., bassists and percussionists described as playing "on top of" or "ahead of" the beat in Latin styles), but I did not find a rigorous, citable acoustic-measurement source specifically proving genre-wide anticipation for reggaeton, dembow, or generic "Latin" playing beyond the samba literature above. Treat as folk wisdom, not measured fact, outside of samba.

Related theoretical framing worth carrying into the design: Sioros et al., "Polymetric Rhythmic Feel for a Cognitive Drum Computer" (arXiv:1606.06197), distinguish **binary swing** (offbeat pulses in a 2-pulse cycle are "inflected," i.e., shifted, while downbeats stay on-grid — directly analogous to MPC-style swing) from **ternary swing with "offbeat retardation"** (a 3-pulse/triplet-adjacent cycle where an offbeat can be played *earlier*, producing an SML — short/medium/long — duration pattern, or delayed, producing SLL/SLM patterns). This is a useful formal vocabulary: MPC swing is "binary swing, delayed"; a bipolar knob's negative side is "binary swing, advanced"; and genres like samba/some West African timelines live in the "ternary swing with offbeat retardation" family, which a single bipolar percentage can only crudely approximate.

---

## 3. Cumbia rhythm section and micro-timing

**Canonical instrumentation and roles** (from general descriptive sources — Wikipedia, production-genre guides; none of these are acoustic-measurement studies):

- **Güira / guacharaca (scraper)**: described as playing a steady, galloping "chu-chucu-chu" figure. One source (Dance Papi, on güiro patterns broadly) describes a "characteristic galloping figure" that is "brushed... steadily on the downbeat with a preceding 'and-a.'" Multiple genre-guide sources describe the guacharaca as "steady 8th-note scraping" — i.e., in cumbia's 2/4 feel, the scraper is often characterized at the 8th-note level (a continuous back-and-forth scrape pattern) rather than as a simple accented-16th pattern; when notated at 16th-note resolution this typically appears as a repeating long-short (or accent-on-the-beat, softer-on-the-off-beat) figure rather than a strict even 16ths pattern.
- **Tambora / conga / llamador**: cumbia traditionally uses a trio of drums — tambora (deep two-headed bass drum), tambor alegre, and llamador — with the tambora carrying the low-end pulse. In more "band" arrangements (cumbia sonidera, cumbia villera, etc.) this is often replaced or supplemented by congas and timbales playing tumbao-family patterns (open/slap/heel-toe conga vocabulary shared with Afro-Cuban tumbao, per Rhythm Notes' conga-pattern references), locked with the bass and kit.
- **Bass ("tumbao")**: sources describe cumbia bass as typically walking a repetitive low-register figure analogous to (but not identical to) the Afro-Cuban tumbao concept — a repeating anticipated-bass-note idea rather than a strict on-the-beat root. No source gave a specific cumbia-only bass rhythmic notation with confirmed timing numbers.

**On the micro-timing question specifically (ahead / behind / long-short) — I found no dedicated acoustic micro-timing study of cumbia, the guacharaca, or Colombian/Mexican cumbia sub-styles** (cumbia sonidera, cumbia rebajada, tecnocumbia, cumbia villera). Multiple targeted searches (for ethnomusicology/acoustic studies with percent or millisecond data on guacharaca/güira timing) returned only general descriptive genre writing (Wikipedia, production blogs) plus samba/candombe/West-African micro-timing papers that do not analyze cumbia. **This is a real gap in the available literature, not a disagreement between sources** — the sources simply don't address it quantitatively. So: **no source found** for whether the cumbia scraper's off-beat is measurably ahead, behind, or long-short in the notes-inégales sense. What generic descriptions do agree on is that cumbia is "syncopated" with "unexpected accents and off-beats" giving it "swing and groove" (Wikipedia-level description) — consistent with *some* kind of systematic deviation existing, but not quantified.

What I found on the related sub-styles was historical/tempo context rather than micro-timing data:
- **Cumbia rebajada**: whole tracks pitched/slowed down (originating from a DJ's turntable malfunction in Monterrey in the late 1970s), landing around 75–90 BPM (sometimes cited as ~76 BPM) versus the original Colombian cumbia tempo — a large-scale tempo effect, not a beat-level micro-timing phenomenon.
- **Cumbia sonidera**: described as targeting roughly 90–105 BPM in 2/4 or straight-feel 4/4 "with a cumbia swing," using güiro, timbales/congas, and heavy sound-system effects — the phrase "cumbia swing" is used descriptively but not defined numerically in the source.
- **Cumbia villera / tecnocumbia**: described in terms of stylistic/cultural lineage and instrumentation blending, not micro-timing.

**Conclusion for Q3**: Directional claim (ahead vs. behind vs. long-short) — **no source found**, confidence **very low / unknown**. If forced to design a default, the closest analogy in the literature is the samba findings (§2), which lean toward *anticipation* of certain 16th-note positions in Afro-descended Latin American 16th-note grooves generally, but this is an inference by analogy, not a cumbia-specific finding, and should be labeled speculative in any downstream design doc.

---

## 4. Recommended bipolar swing-knob values

Scale: 50 = straight; 100 = maximum MPC-style delay (off-beat pushed toward "dotted," ~75%+ in classic terms); 0 = maximum anticipation (off-beat pulled equally far early). One-line reasoning and confidence per genre — confidence reflects how directly the number is supported by a source vs. inferred from adjacent evidence.

| Genre | Suggested value (50=straight) | Reasoning | Confidence |
|---|---|---|---|
| **House** | 54–58 (mild positive) | Matches the "54–58% creeping bounce" convergence across production sources; house grooves want a felt-not-heard delay. | Medium |
| **UK garage** | 63–67, default ~64 | Directly cited range (63–67%, 64% as a reliable default) in UKG-specific production guides; garage is defined by audible, obvious swing vs. house. | Medium-High |
| **UK funky** | ~56–60 (mild-moderate positive) | No genre-specific swing % source found; UK funky sits stylistically between house/soca-influenced percussion and garage, with syncopated hats but less extreme swing than 2-step UKG — this is an interpolated estimate, not sourced. | Low |
| **Cumbia** | 44–48 (mild negative) | No cumbia micro-timing study found (§3); this value encodes the general "Latin/anticipated" folk-wisdom lean toward pushing rather than dragging, applied cautiously and mildly since no quantified source supports a specific magnitude or even direction with confidence. | Low |
| **Reggaeton / dembow** | 52–56 (mild positive) | One production source explicitly recommends "moderate swing quantize on 16ths" for reggaeton; dembow's tresillo-derived (3+3+2) skeleton is naturally syncopated without needing strong swing on top, so keep it mild and positive rather than pushing further into either extreme. | Low-Medium |
| **Dancehall** | 50–54 (near-straight to mild positive) | Sources describe dancehall's groove as coming from its dotted-rhythm drum pattern itself (one-drop, dotted-eighth figures) and heavy dub-style processing/delay rather than a swung 16th grid — so the swing knob itself should stay conservative; the pattern does the syncopation work. | Low |
| **Baile funk** | 50–54, or slightly negative (48–50) for "rasteirinha"-adjacent feels | No direct baile funk swing-percentage source; one source connects a baile-funk-adjacent substyle ("rasteirinha") to dembow-plus-samba/pagode blending, and the samba literature leans toward anticipation — suggesting a mild-negative option is plausible for samba-influenced baile funk variants, but this is an inference chain, not a direct source. | Low |
| **Dembow** (Dominican) | 50–54 | Treated similarly to reggaeton dembow above (shared "dembow beat" rhythmic skeleton per Wikipedia's "Dembow beat" article); keep mild, let the underlying pattern carry syncopation. | Low-Medium |
| **Hyphy** | 50–52 (near-straight) | Sources describe hyphy as a "driving, straightforward groove" built for group chanting/movement with simple 8th/16th hat patterns — nothing in the sources suggests hyphy relies on swing feel; it is about weight (808s) and directness, not micro-timing nuance. | Low-Medium |
| **UK drill** | 50–54 straight-leaning on the underlying 16th grid, but understand the "swing" feel here comes mostly from triplet hi-hat rolls layered against a straight/half-time kick-snare grid, which a single swing knob doesn't really model | UK drill sources emphasize triplet hi-hat bursts against a half-time-perceived groove and pitch-slid 808s as the source of feel, not swing-percentage micro-timing — a bipolar 16th-swing knob is the wrong tool for drill's characteristic "push-pull," so keep it near-straight and rely on a separate triplet/roll mechanism if the sequencer has one. | Low-Medium |

**Overall confidence note**: Only house, UK garage, and (partially) reggaeton have values traceable to an explicit source-stated percentage or explicit qualitative recommendation. Cumbia, UK funky, dancehall, baile funk, dembow, hyphy, and UK drill values above are best-effort interpolations from adjacent genre knowledge and general descriptions, not sourced measurements — they should be treated as reasonable starting defaults for a sequencer UI, not as claims backed by the literature.

---

## Sources

**MPC swing / formula / genre percentages**
- Roger Linn interview, ["Roger Linn On Swing, Groove & The Magic Of The MPC's Timing"](https://www.attackmagazine.com/features/interview/roger-linn-swing-groove-magic-mpc-timing/) — Attack Magazine
- [MPC Swing Explained — How the MPC Swing Algorithm Works](https://padwolf.app/learn/mpc-swing-explained/) — Padwolf
- [Swing Ratio Calculator | Swing % to Long/Short ms](https://www.cmuse.org/swing-ratio-calculator/) — CMUSE
- [Microtiming: Tuplet-Based Rhythms IRL & DAWs](https://www.mslinn.com/av_studio/microtiming.html)
- [What Is Swing in Drum Programming? The Secret Behind Groove](https://www.electronicproduction.co.uk/post/what-is-swing-the-secret-behind-groove-in-electronic-music)
- [Typical quantize setting to use swing? MPC users](https://gearspace.com/board/rap-hip-hop-engineering-and-production/495713-typical-quantize-setting-use-swing-mpc-users.html) — Gearspace
- [Why Your UKG Drums Don't Groove (And How to Fix It)](https://www.evosounds.com/post/why-ukg-drums-dont-groove)
- [UK Garage Drum Pattern (with presets and bassline)](https://www.studiobrootle.com/uk-garage-drum-pattern-with-presets-and-bassline/) — Studio Brootle

**Negative / reverse / anticipated swing**
- ["Going Off Grid: What Is Swing And How To Add It"](https://www.attackmagazine.com/technique/tutorials/going-off-grid-what-is-swing-and-how-to-add-it/) — Attack Magazine (explicit "negative swing" definition)
- [Using Grooves — Ableton Reference Manual](https://www.ableton.com/en/manual/using-grooves/)
- [Digitakt User Manual](https://www.elektron.se/wp-content/uploads/2024/09/Digitakt_User_Manual_ENG_OS1.51_231108.pdf) — Elektron (per-step micro-timing "ahead or behind the beat")
- Elektron Octatrack manual pages, via [ManualsLib](https://www.manualslib.com/manual/924760/Elektron-Octatrack-Dps-1.html?page=64)
- Sioros et al., ["Polymetric Rhythmic Feel for a Cognitive Drum Computer"](https://arxiv.org/abs/1606.06197), arXiv:1606.06197 (binary vs. ternary swing / offbeat retardation framework)
- ["Visualization tools for musical timing applied to afro-cuban percussion"](https://www.researchgate.net/publication/238620955_Visualization_tools_for_musical_timing_applied_to_afro-cuban_percussion) — ResearchGate (rumba clave rushing example)

**Samba / Latin American micro-timing literature**
- ["Multidimensional microtiming in Samba music"](https://www.academia.edu/731077/Multidimensional_microtiming_in_Samba_music) — Naveda et al., via Academia.edu
- ["Microtiming patterns and interactions with musical properties in samba music"](https://www.academia.edu/7927778/Microtiming_patterns_and_interactions_with_musical_properties_in_samba_music) — Academia.edu
- ["Effect of tempo on relative note durations in a performed samba groove"](https://www.tandfonline.com/doi/full/10.1080/09298215.2020.1767655) — Taylor & Francis (uneven 16th-note duration pattern across tempi)
- ["Rhythmical structures in music and body movement in samba performance"](https://www.researchgate.net/publication/268219833_Rhythmical_structures_in_music_and_body_movement_in_samba_performance) — Haugen & Danielsen, ICMPC13-APSCOM5, via ResearchGate
- ["Microtiming in the rhythmic structure of Candombe drumming patterns"](https://www.academia.edu/37241919/Microtiming_in_the_rhythmic_structure_of_Candombe_drumming_patterns) — Academia.edu
- ["The Effect of Microtiming Deviations on the Perception of Groove in Short Rhythms"](https://www.academia.edu/21176015/The_Effect_of_Microtiming_Deviations_on_the_Perception_of_Groove_in_Short_Rhythms) — Academia.edu

**Cumbia and instrumentation**
- [Cumbia](https://en.wikipedia.org/wiki/Cumbia) — Wikipedia
- [Cumbia (Colombia)](https://en.wikipedia.org/wiki/Cumbia_(Colombia)) — Wikipedia
- [Güira](https://en.wikipedia.org/wiki/G%C3%BCira) — Wikipedia
- [Beginner Guiro Patterns | Hand Percussion](https://dancepapi.com/videos/beginner-guiro-patterns-hand-percussion/) — Dance Papi
- [How to Make Cumbia Music - Complete Production Guide](https://beatkey.app/how-to-make-cumbia-music) — BeatKey
- [How to Make Cumbia Sonidera Music](https://beatkey.app/how-to-make-cumbia-sonidera-music) — BeatKey
- [Cumbia rebajada](https://en.wikipedia.org/wiki/Cumbia_rebajada) — Wikipedia
- [Saturno 2000: La Rebajada de Los Sonideros 1962-1983](https://en.wikipedia.org/wiki/Saturno_2000:_La_Rebajada_de_Los_Sonideros_1962-1983) — Wikipedia
- [Cumbia villera](https://en.wikipedia.org/wiki/Cumbia_villera) — Wikipedia
- ["The Roots of Digital Cumbia in Sound System Culture"](https://journal.equinoxpub.com/JWPM/article/view/20783) — Journal of World Popular Music
- [10 Conga Patterns Every Percussionist Should Know](https://rhythmnotes.net/conga-patterns/) — Rhythm Notes
- [Tumbao](https://en.wikipedia.org/wiki/Tumbao) — Wikipedia

**Reggaeton / dembow / dancehall / baile funk / hyphy / UK drill**
- [Dembow beat](https://en.wikipedia.org/wiki/Dembow_beat) — Wikipedia
- [Beat Building: how to make a reggaeton beat](https://www.musicradar.com/news/beat-building-how-to-produce-a-reggaeton-beat) — MusicRadar
- [Dembow Rhythm Explained: The Pattern Behind Reggaeton](https://orphiq.com/resources/what-is-dembow) — Orphiq
- [How to program dancehall drum patterns](https://www.musicradar.com/how-to/how-to-program-dancehall-drum-patterns) — MusicRadar
- [Riddim](https://en.wikipedia.org/wiki/Riddim) — Wikipedia
- [Hyphy](https://www.melodigging.com/genre/hyphy) — Melodigging
- [How to Make Drill Beats in FL Studio: UK & NY Drill Guide](https://www.audeobox.com/learn/fl-studio/how-to-make-drill-beats-in-fl-studio/) — Audeobox
- [How To Make Hard UK Drill Beats: A Producer's POV](https://navidhamidi.com/how-to-make-hard-uk-drill-beats-a-producers-pov/)

**Not found / explicitly unconfirmed**
- No source found giving a specific numeric swing percentage or measured micro-timing value for UK funky.
- No source found describing Roland or Korg drum-machine swing implementations as supporting negative/anticipated swing values.
- No acoustic/ethnomusicological micro-timing study found for cumbia, guacharaca/güira, cumbia sonidera, cumbia rebajada, tecnocumbia, or cumbia villera — general genre descriptions only.
