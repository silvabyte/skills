# Evidence for context ramps

Research reviewed 2026-08-11. This is design evidence, not medical advice. Direct trials of adult
ADHD learning from dense technical material are rare, so the contract combines ADHD cognition,
general learning science, multimedia research, accessibility guidance, and explicitly labeled
personal experiments.

## Evidence grades

- **Strong:** converging experimental or synthesized evidence, or authoritative safety guidance.
- **Moderate:** credible evidence with indirect population/task fit or meaningful moderators.
- **Preliminary:** small, single-study, child-to-adult, or otherwise uncertain evidence.
- **Unsupported:** no adequate evidence for the intervention claim, or evidence rejects it.

## Design matrix

| Topic | Grade | Design consequence |
| --- | --- | --- |
| Working memory and cognitive load | Strong | Externalize state, preserve orientation, and show one bounded relationship at a time [S1-S3]. |
| Retrieval practice | Strong | End each microbite with answer-before-reveal recall. Passive rereading or listening does not prove learning [S4]. |
| Spacing | Strong | Revisit misses after a delay. Adapt intervals to performance rather than claiming one fixed schedule [S5]. |
| Interleaving | Moderate | Mix nearby, confusable concepts after establishing the basic map; do not shuffle unrelated material [S6]. |
| Visual maps | Moderate | Use small relationship maps with source anchors. Decorative or overloaded diagrams consume attention without teaching [S7-S8]. |
| Narration and text-to-speech | Moderate | Narration can improve access and engagement. Give the user speed, stop, replay, transcript, and silent controls [S3][S10][S22-S25]. |
| Narration redundancy | Strong | Narrate relationships while showing sparse labels. Avoid forcing word-for-word text beside a busy visual [S8]. |
| Learning-style matching | Unsupported | Honor visual/audio preferences for usability, but verify learning with retrieval rather than diagnosing a fixed learning style [S9]. |
| Motivation and immediacy | Moderate | Make the next action small, feedback immediate, progress truthful, and choices meaningful [S11]. |
| Body doubling | Preliminary | Offer quiet co-working as an optional experiment, not a proven treatment or surveillance mechanism [S12][S29]. |
| Acute movement | Preliminary | Walking narration or movement breaks may help some people; keep them optional and safe [S13-S14]. |
| White noise and music | Preliminary | Default to quiet. Let the user test low-volume non-speech sound, never under narration [S15-S16][S25]. |
| Implementation intentions | Strong generally | End with one editable cue-action plan: "If X happens, I will do Y" [S17]. |
| Temptation bundling | Preliminary transfer | A user-chosen pleasure may reduce initiation friction; do not lock access or claim validated learning effects [S18]. |
| Timers | Moderate generally | Offer an adjustable focus sprint and soft stop. No universal ADHD Pomodoro duration is established [S19]. |
| Gamification | Moderate generally | Use optional, fixed, transparent mastery feedback; learning quality remains the measure [S20]. |
| Variable rewards and dopamine hacks | Unsupported; ethical risk | Exclude random prizes, near misses, loss-framed streaks, artificial scarcity, and dopamine promises [S21][S26]. |
| Sleep and medication | Strong safety boundary | Protect sleep and prescribed care. Route medication or health changes to a qualified clinician [S27-S28]. |

## Derived contract

These are product-design requirements derived from the evidence, not clinical rules:

1. Start with a one-screen orientation: destination, 3-7-node map, provenance state, and next action.
2. Preserve facts, decisions, proposals, contradictions, and inference as distinct evidence classes.
3. Keep each visual microbite to one claim or relationship and at most 45 visible words.
4. Make narration optional, complementary to the visual, user-controlled, and available as text.
5. Require one generative recall attempt or explicit skip before revealing the correction.
6. Build the review queue from misses and low confidence, not from material merely displayed.
7. End with a realistic transfer task and one if-then start plan.
8. Offer at most two focus experiments at once and track started, completed, and delayed recall.
9. Preserve user autonomy, privacy-minimal progress, reduced-motion support, and a non-gamified path.
10. Revise any format that feels engaging but fails delayed recall or real-world application.

## Safety language

- Preference is not a learning-style diagnosis.
- Dopamine is not a score, fuel gauge, or justification for manipulative reinforcement.
- Movement, sound, fidgets, body doubling, and temptation bundling are personal experiments.
- Sleep loss, medication manipulation, unprescribed substances, supplements, consumer
  neurostimulation, and similar biohacks are outside this skill.

## Sources

- **S1.** Alderson RM, et al. "ADHD and working memory in adults: A meta-analytic review."
  https://doi.org/10.1037/a0032371
- **S2.** Sweller J. "Cognitive Load During Problem Solving: Effects on Learning."
  https://doi.org/10.1207/s15516709cog1202_4
- **S3.** Mayer RE, Chandler P. "When learning is just a click away."
  https://doi.org/10.1037/0022-0663.93.2.390
- **S4.** Roediger HL III, Karpicke JD. "Test-Enhanced Learning."
  https://doi.org/10.1111/j.1467-9280.2006.01693.x
- **S5.** Cepeda NJ, et al. "Distributed practice in verbal recall tasks."
  https://doi.org/10.1037/0033-2909.132.3.354
- **S6.** Brunmair M, Richter T. "Similarity matters: interleaved learning and its moderators."
  https://doi.org/10.1037/bul0000209
- **S7.** Nesbit JC, Adesope OO. "Learning With Concept and Knowledge Maps."
  https://doi.org/10.3102/00346543076003413
- **S8.** Mayer RE, Heiser J, Lonn S. "Cognitive constraints on multimedia learning."
  https://doi.org/10.1037/0022-0663.93.1.187
- **S9.** Pashler H, et al. "Learning Styles: Concepts and Evidence."
  https://doi.org/10.1111/j.1539-6053.2009.01038.x
- **S10.** Wood SG, et al. "Does Use of Text-to-Speech Improve Reading Comprehension?"
  https://doi.org/10.1177/0022219416688170
- **S11.** Luman M, et al. "The impact of reinforcement contingencies on AD/HD."
  https://doi.org/10.1016/j.cpr.2004.11.001
- **S12.** Eagle T, et al. "Proposing Body Doubling as a Continuum."
  https://doi.org/10.1145/3597638.3614486
- **S13.** Mehren A, et al. "Acute Effects of Aerobic Exercise on Adult ADHD."
  https://doi.org/10.3389/fpsyt.2019.00132
- **S14.** Sarver DE, et al. "Hyperactivity in ADHD: Deficit or Compensatory Behavior?"
  https://doi.org/10.1007/s10802-015-0011-1
- **S15.** Baijot S, et al. "Benefits from white noise in children with and without ADHD."
  https://doi.org/10.1186/s12993-016-0095-y
- **S16.** Kampfe J, et al. "The impact of background music on adult listeners."
  https://doi.org/10.1177/0305735610376261
- **S17.** Gollwitzer PM, Sheeran P. "Implementation Intentions and Goal Achievement."
  https://doi.org/10.1016/S0065-2601(06)38002-1
- **S18.** Milkman KL, et al. "Holding the Hunger Games Hostage at the Gym."
  https://doi.org/10.1287/mnsc.2013.1784
- **S19.** Ariely D, Wertenbroch K. "Procrastination, Deadlines, and Performance."
  https://doi.org/10.1111/1467-9280.00441
- **S20.** Sailer M, Homner L. "The Gamification of Learning."
  https://doi.org/10.1007/s10648-019-09498-w
- **S21.** Schultz W, et al. "A Neural Substrate of Prediction and Reward."
  https://doi.org/10.1126/science.275.5306.1593
- **S22.** W3C, "Making Content Usable for People with Cognitive and Learning Disabilities."
  https://www.w3.org/TR/coga-usable/
- **S23.** W3C WCAG 2.2, "Audio Control."
  https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
- **S24.** W3C WCAG 2.2, "Captions (Prerecorded)."
  https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html
- **S25.** W3C WCAG 2.2, "Low or No Background Audio."
  https://www.w3.org/WAI/WCAG22/Understanding/low-or-no-background-audio.html
- **S26.** U.S. FTC, "Bringing Dark Patterns to Light."
  https://www.ftc.gov/reports/bringing-dark-patterns-light
- **S27.** U.S. FDA, "Warnings to improve safe use of prescription stimulants."
  https://www.fda.gov/drugs/drug-safety-and-availability/fda-updating-warnings-improve-safe-use-prescription-stimulants-used-treat-adhd-and-other-conditions
- **S28.** Watson NF, et al. "Recommended Amount of Sleep for a Healthy Adult."
  https://doi.org/10.5665/sleep.4716
- **S29.** Schuenke R, et al. "Exploring Body Doubling in ADHD Using EEG."
  https://doi.org/10.1145/3663547.3759743
