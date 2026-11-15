---
date: 2026-11-16
---

# Manual writing

What makes a short install manual for a consumer electrical product clear, and the rules that
follow for the Blade Reader manual. That manual is one web page with one step per screen and per
printed page, in the IKEA manner: big step numbers, line drawings, ✓/✗ panels, short captions and
one-line warnings.

Read 2026-11-16. Each claim cites the page it came from. Where only an abstract, a preview or a
second-hand summary could be read, the line says so. Two standards are paywalled. IEC/IEEE
82079-1 was read from its free preview (contents, scope, definitions) and a consultancy checklist
that paraphrases it. ANSI Z535.6 was read through an article by a member of its subcommittee,
published by NEMA.

## Summary

- Draw every step, not only the finished fit. Step-by-step diagrams beat a final-state picture
  once a procedure has more than a few steps (Novick & Morse).
- One action per screen, verb first, 20 words at most, any condition before the command
  (ASD-STE100; iFixit; Dozuki).
- Words go on the drawing, beside the part they name, and one highlight marks the part being
  handled (Mayer's spatial contiguity and signalling).
- A warning sits on the screen of the step it guards, before the action, and names the hazard,
  the consequence and how to avoid it (ANSI Z535.6; Wogalter; minimalism's "on the spot" error
  information).
- WARNING is for injury. Harm to the board or panel only is NOTICE, without the ⚠ symbol (Z535.6).
- One name per part, used everywhere (STE 1.11; 82079-1 consistency).
- Leave out rationale, history and reassurance. Explanation raises load for little gain during
  use (Karreman; Mayer's coherence; Carroll's minimalism).
- Finish each step with what the reader should now see, and finish the manual with the result
  (82079-1 "completion information"; Victron).

## Exemplars

### IKEA

Read KALLAX 112 × 112, AA-2677652, 16 A4 pages.
<https://www.ikea.com/au/en/assembly_instructions/kallax-shelving-unit-white__AA-2677652-1-2.pdf>

- Words appear only on the front pages. Page 2 holds the one text warning, about tipping over,
  in capitals ("ALWAYS install anti-tip device provided"). After that the only text is numbers.
- Page 3 is wordless preparation. It shows a tool panel and three do/don't pairs: two people
  against one person crossed out, a soft mat against a hard floor crossed out, and a puzzled
  figure next to one phoning the store. Only the "don't" carries a mark, a large ×.
- Page 4 is the fittings inventory, each drawn with a count ("8x") and a part number.
- Steps are large bold numerals. A round zoom callout shows the fitting and the count at the spot.

For us, a wordless tool page and parts page come before step 1. A ✗ panel shows a likely
mistake, drawn as plainly as the right way. Counts go on the drawing ("12x").

### LEGO

Read set 60471, 36 pages.
<https://www.lego.com/cdn/product-assets/product.bi.core.pdf/6581998.pdf>

- One step per page with a large step number.
- Each step opens with a framed box of only the parts added in that step, with counts.
- A sub-assembly sits in its own inset frame and joins the main model by an arrow.

For us, each step shows only the parts and fasteners it uses, in a box at the top of the screen.

### Prusa Research

Read the Original Prusa MK4S kit, chapter 3.
<https://help.prusa3d.com/guide/3-x-axis-x-carriage-assembly_707749>

- Every step has a short title. A chapter opens with the tools it needs.
- Parts lists name hardware by size and count ("M3x10 screw (3x)"). Each line has a colour that
  matches its highlight on the photo.
- Bullets start with the verb and add the check: "insert the M3x10 screw into the
  X-carriage-back. The screw must protrude from the "front" side of the part."
- Cautions are marked by an icon and say what to avoid and why in one line: "Do not put too much
  pressure on the nut to avoid damaging the opposite printed wall."

For us, a fastener is named by size, and its colour in the caption matches its colour in the
drawing. A step states the check the reader can see.

### Apple

Read the AirTag Quick Start and Info leaflet.
<https://cdsassets.apple.com/live/6GJYWVAV/start/locale/en-gb/ma2013_airtag-2021-qsg.pdf>,
<https://cdsassets.apple.com/live/6GJYWVAV/information/locale/en-gb/ma2008_airtag-info.pdf>

- The quick start is two numbered steps and 18 words. It hands everything else to the on-screen
  setup.
- Safety and regulatory text lives in a separate booklet.

For us, the Home Assistant step says only what the reader does. The rest belongs to Home
Assistant's own screens.

### iFixit and Dozuki

Read iFixit's Technical Writing Style Guide (a Google Doc titled as iFixit's official guide; no
link to it from ifixit.com was traced), iFixit's help pages, and chapter 2 of Dozuki's Tech
Writing Handbook.
<https://docs.google.com/document/d/171Gb3CKllLSnkhCdZ_xgWhvZOZkvezcyBiJeK_VMnqU/export?format=pdf>,
<https://www.ifixit.com/Info/Writing_Guides>, <https://www.ifixit.com/Help/Guide_Steps>,
<https://edu.ifixit.com/standard-project/write-guide-text>,
<https://about.ifixit.com/Tech_Writing/chapter/2>

- Say how, not only what. "Use a spudger to pry the battery connector straight up out of its
  socket", not "Disconnect the battery connector".
- Plain words. "Turn off the engine", not "Disengage".
- Start with a verb. Keep sentences under about 24 words. "Dump any empty words."
- Give each screw's size and head ("four 5.5 mm Phillips #00 screws").
- Keep the object in the same orientation throughout, and say so when it turns.
- More than four or five markups on one picture means the step should be split.
- Caution is for minor injury or damage. WARNING is for death or serious injury.
- Leave out obvious steps such as "Locate component X".

For us, the direction of a movement goes in the caption ("Lower the yoke straight down"). The
panel is drawn from the same viewpoint on every screen unless a step says it has changed.

### Electrical install sheets

Victron's SmartShunt manual, read in its HTML form.
<https://www.victronenergy.com/media/pg/SmartShunt/en/installation.html>

- Safety is grouped in chapter 1, with a battery explosion warning.
- Installation runs from what is in the box, to mounting, to a table of connections, to an
  ordered list of one-sentence commands with the torque inline ("maximum torque of 21Nm").
- It ends with what the user will see: the monitor powers up and the Bluetooth LED blinks.

Blue Sea's own ST Blade 12-circuit sheet (5026/5031) is a one-page wiring diagram. It gives the
#10-32 feed stud at 24 in-lb (2.71 N·m), the #8-32 screw terminals at 18 in-lb (2.03 N·m) and
125 A maximum feed protection. It has no numbered steps, no signal words and no instruction to
disconnect the battery.
<https://d2pyqm2yd3fw2i.cloudfront.net/files/resources/instructions/Wiring-Diagram-5026_5031.pdf>

For us, torques go in the step that needs them, in N·m with in-lb after. The manual cannot assume
the reader learnt anything from Blue Sea's sheet.

## Standards

### IEC/IEEE 82079-1:2019, information for use

Paywalled. Read the free preview and the Instrktiv quick-scan checklist, which paraphrases it.
<https://assets.vde-verlag.de/iec-normen/preview-pdf/info_iecieee82079-1%7Bed2.0%7Db.pdf>,
<https://instrktiv.com/media/82079/82079QUICKSCAN2023.pdf>

- The scope covers consumer and DIY products. The stated purpose of the information is safe use.
- Clause 5.3 lists the qualities required: completeness, minimalism, correctness, conciseness,
  consistency, comprehensibility and accessibility. Clause 5.2.3 asks for orientation to the
  target audience.
- The checklist's paraphrases: "The principles of minimalism in technical communication shall be
  applied." "Consistent terminology is used." Safety notes go in a section at the start.
  Step-by-step instructions have "preliminary information, instructional steps, and completion
  information".
- Not verified: whether the text requires one action per step or a result after each step.

For us, the manual opens with what to have ready (preliminary), then the steps, then a finish
screen with the result and what to do if a way reads wrong (completion).

### ANSI Z535.6, safety information in manuals

Paywalled. Read Kundinger's article in NEMA's Communicator (2008), which describes the 2006
edition. The 2023 edition is current and was not checked.
<https://www.nema.org/Standards/z535/Documents/Communicator_article_p14-16.pdf>

- DANGER "will result in death or serious injury". WARNING "could". CAUTION, with the safety
  alert symbol, could result in minor or moderate injury.
- "NOTICE is used to address practices not related to personal injury." For property damage
  alone "the safety alert symbol shall never be used".
- Every safety message identifies the hazard, says how to avoid it and states the likely
  consequence.
- Messages may be grouped, in a section, or embedded in a step. The standard means to replace
  the large boxed sign style in manuals. Black and white is allowed.

For us, the battery step carries WARNING. A step where the lug or a bent board could only damage
equipment carries NOTICE. A short circuit across a battery can burn and start a fire, so where a
mistake could short the feed it is a WARNING, not a NOTICE.

### ASD-STE100 Simplified Technical English, issue 9

Free. Read the official PDF. <https://zenodo.org/records/23666006>

- 5.1: "Use a maximum of 20 words in each sentence" in procedures. 6.3: 25 in descriptions.
- 5.2: "Write only one instruction in each sentence unless two or more actions occur at the same
  time."
- 5.3: imperative. 3.6: active voice.
- 5.4: when the reader must know a condition first, put it first, then a comma, then the command.
- 5.5: "Write notes only to give information, not instructions."
- 1.11: "Do not use different technical nouns for the same item."
- 7.1–7.3: a safety instruction names the level of risk, starts with a clear command or
  condition, and gives the risk or result.
- 1.14 asks for American spelling. The project writes British English, which overrides it.

## Research

### Minimalism (Carroll; van der Meij & Carroll)

Carroll, *The Nurnberg Funnel*, MIT Press, 1990, was not read. The principles below are van der
Meij & Carroll (1995), "Principles and heuristics for designing minimalist instruction",
*Technical Communication* 42(2), 243–261, read through the table in Graham's review because no
open copy was found. Check against the paper before quoting it.
<https://static.aminer.org/pdf/PDF/000/591/907/reconstructing_minimalism.pdf>

1. Choose an action-oriented approach. Let the reader act at once.
2. Anchor the tool in the task domain. The structure of the instruction follows the real task.
3. Support error recognition and recovery. Give error information where mistakes are likely or
   hard to undo, at the spot, so the reader can detect, diagnose and correct.
4. Support reading to do, study and locate. Be brief. Leave out what can be inferred.

For us, every ✗ panel shows how the mistake looks, and its caption says how to put it right.
Step 1 is an action, not an introduction.

### Nielsen Norman Group

- Morkes & Nielsen (1997) rewrote one site to be concise, scannable and objective. Usability rose
  58 %, 47 % and 27 % for each alone, and 124 % for all three.
  <https://www.nngroup.com/articles/concise-scannable-and-objective-how-to-write-for-the-web/>
- Readers scan in an F shape. Front-load headings so the first two words carry the meaning.
  <https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/>
- Help should be "focused on the user's task" and "list concrete steps".
  <https://www.nngroup.com/articles/ten-usability-heuristics/>
- Wizards should show the whole path and the current step, and keep each step self-contained.
  <https://www.nngroup.com/articles/wizards/>

For us, each screen shows "Step 5 of 11" and makes sense if the reader returns to it after a
break, with the phone propped by the panel.

### Pictures and text

- Novick & Morse (2000), "Folding a fish, making a mushroom", *Memory & Cognition* 28(7),
  1242–1256, doi:10.3758/BF03211824 (abstract read). With 180 participants, step-by-step diagrams
  helped most. A final-state diagram matched them only when there were few steps, and fell to
  the text-only level when there were many. The diagrams added to the text rather than replacing
  it. <https://doi.org/10.3758/BF03211824>
- Mayer, "Research-based principles for designing multimedia instruction" (read in full). Median
  effect sizes: multimedia (words and pictures beat words alone) d = 1.35, coherence (cut
  extraneous material) d = 0.86, spatial contiguity (words beside the part they describe)
  d = 0.82, signalling (cue the essential part) about 0.70, segmenting (reader-paced pieces)
  d = 0.67.
  <https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-research-based-principles-for-designing-multimedia-instruction-mayer.pdf>
- Ganier (2004), *InfoDesign* 1(1), 16–28, doi:10.51358/id.v1i1.1 (abstract read). Pair pictures
  with text, put steps in the order of use, and number them to ease switching between page and
  task. <https://infodesign.emnuvens.com.br/infodesign/article/view/1/693>
- Gellevij & van der Meij (2002), on screen captures (abstract read). Full captures beat partial
  ones for learning. For us, the drawing shows enough of the panel for the reader to find where
  they are, with a zoom for the detail.
  <https://research.utwente.nl/en/publications/the-effects-of-screen-captures-in-manuals-a-textual-and-two-visua/>
- Karreman & Steehouder (2003) and Karreman, Ummelen & Steehouder (2005), on explanatory
  information (abstracts and summaries only). Added "why" text raised load and gave only modest
  gains while doing the task.

### Warnings

Wogalter and colleagues, "Behavioral compliance with warnings: effects of stress and placement"
(abstract only; year and journal not confirmed). More people complied when the warning sat in
the task instructions than on a separate sign.
<https://scilit.com/publications/a7169a26c443bffe4aff78394d429a49>

For us, the battery warning is repeated on the step where it applies, even though the opening
screen also gives it.

## Rules for the Blade Reader manual

### Wording

- One action per screen. Two only when they happen together ("Hold the yoke level and lower
  it").
- Start with the verb. Imperative, active, "you" implied.
- 20 words a sentence at most. Most captions should be under ten.
- A condition goes first, then the command. "If the lug touches the yoke, bend the cable back."
- Say how, not only what, when the how is not obvious: direction, tool, which hand.
- Plain verbs. Fit, lower, tighten, undo, lift, push. Not "install", "secure", "ensure",
  "utilise", "engage".
- No hedges ("simply", "just", "carefully", "gently", "make sure to"). They add words and no
  information. Where care matters, state the limit instead ("Tighten to 2 N·m").
- Numbers as figures, units with a space: 2.03 N·m, 8 mm, 12 V.

### Step size and order

- A step is as large as one picture can show without passing four or five callouts. More than
  that, split it.
- Order follows the job at the panel: flash, isolate, unscrew, lower, screw down, feed lug,
  output rings, ground, Home Assistant.
- Before step 1, two wordless screens: tools, and parts with counts.
- Each step shows only the parts and fasteners it uses, in a box, with counts.
- End each step with the check the reader can see ("All 12 fingers sit flat in their pockets").
- The last screen gives the result in Home Assistant and what to do if a way reads wrong.
- Progress on every screen ("Step 5 of 11"). The next button names the next action.

### Safety warnings

- Use one only where a mistake could hurt someone or damage the boat, the panel or the board. A
  warning on every screen stops being read.
- WARNING with ⚠ where a short circuit, burn or fire is possible: working live, a lug or tool
  bridging the feed to ground.
- NOTICE without ⚠ where only equipment is at risk: a bent yoke, a cracked finger, over-torque.
- No DANGER. Nothing in this job "will" kill. No CAUTION unless a minor-injury hazard turns up.
- A warning is one line in the order hazard, consequence, avoidance, or as a command with its
  reason. "WARNING ⚠ A live feed can arc and burn. Turn the battery isolator off first."
- Put it on the step it guards, above the action. Repeat the isolate warning there, even though
  the opening screen also gives it.
- Black and white is enough. A border and the signal word carry it.

### Pictures and words

- Every step has a drawing. The drawing carries the action. The caption names the action and
  any figure the drawing cannot show (torque, size).
- Same viewpoint on every screen. If the view turns, the drawing shows it and the caption says
  so.
- One highlight colour for what moves in this step. Everything else in grey line.
- Labels sit on the drawing next to their part, with a short leader line. No separate key.
- Zoom circles for small detail, linked to where they sit on the whole panel.
- ✓/✗ panels side by side, the same view, differing in one thing only. Use them where a mistake
  is likely or hard to spot: the feed lug clear of the yoke, a finger seated in its pocket, a
  ring under its nut. The ✗ caption says what is wrong and how to fix it.
- No decoration, shading or background that carries no step.

### Naming parts

- One name per part, the same in every caption, drawing label and warning. No synonyms.
- Name parts the reader can see. Introduce each name once on the parts screen, with its picture.
  After that the label is enough.
- Keep the set small. The reader needs the panel, the way screw, the feed and its lug, the yoke,
  the nuts for each cable ring, the ground wire, and the USB socket. Internal terms such as arm,
  chin and finger earn a place only if a step points at that part, and then they appear on the
  parts screen. The glossary's words to avoid stay out.
- Fasteners by size and drive ("M4 nut, 7 mm spanner"), not by function.
- Say "the battery isolator" or "the battery switch", which is what owners call it, not
  "isolate".

### Platform neutrality

- Flashing and Home Assistant steps work on Windows, macOS, Linux and a phone where possible.
  Name the browser requirement, not the operating system.
- Write "USB-C cable", not "Lightning" or "your Mac's port". Do not name keyboard shortcuts.
- Do not picture one operating system's dialog. If a screen is shown, crop it to the button that
  matters.
- Units in metric first. Imperial follows in brackets where the panel's own sheet uses it.

### What to leave out

- Why the design is as it is, history, rev letters and the strip.
- Reassurance ("Don't worry", "This is easy"), praise and marketing.
- Things the reader can infer or will do anyway ("Locate the panel").
- Notes that are really instructions. If the reader must do it, it is a step.
- Explanations of how the board measures current. A short "How it works" page can sit outside
  the steps for readers who want it.
- Troubleshooting inside a step, beyond the ✗ fix. It goes on the finish screen.
