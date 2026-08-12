# Local TTS selection for Apple Silicon

Research current as of 2026-08-11.

## Decision

This selection is for private, local generation of 20-45 second English educational narration on
Apple Silicon. Source text must not leave the machine, generation must work offline after model
download, and a missing engine must leave the transcript usable rather than silently use a hosted
service.

| Need | Selection | Hard boundary |
| --- | --- | --- |
| Default | NVIDIA MagpieTTS Multilingual 357M `v2602` through pinned `NeMo-Speech.cpp` | This is the best-supported native Apple deployment, not the highest-scoring voice. The published GGUF is still `v2602`; do not mistake the newer `v2607` NeMo checkpoint for a native-runtime upgrade. |
| Quality-heavy alternate | Mistral `Voxtral-4B-TTS-2603` through pinned `mlx-audio` 0.4.8 | Use only for non-commercial evaluation. The model and its 20 reference voices are CC BY-NC 4.0. Budget a 24 GB Mac conservatively; the BF16 weights alone are about 8.0 GB. |
| Low-resource fallback | Kokoro 82M v1.0 through the skill's existing pinned `kokoro==0.9.4` adapter | Keep this path because it is small, Apache-2.0, commercially usable, and already integrated. Prefer `af_heart` or bake off `af_bella`; do not assume all 54 voices have equal quality. |
| No working local engine | Transcript only | Never fall through to a hosted API or browser system voice without an explicit user choice. |

Use Magpie as the implementation target. Keep Voxtral as a listening-test alternate, not a legal or
operational fallback. Keep Kokoro installed even when Magpie is available: it is the recovery path
for low-memory machines, failed native builds, and quick deterministic authoring.

## Why this is not simply the leaderboard order

Artificial Analysis currently ranks the five relevant open-weight entries as Fish Audio S2 Pro
(Elo 1,122), Step Audio EditX (1,108), Voxtral TTS (1,073), Magpie Multilingual 357M February 2026
(1,065), and Kokoro 82M v1.0 (1,058).[1] These are blind naturalness preferences for particular
voices. They do not measure exact-text fidelity, Apple Silicon installation, memory, license fit,
offline behavior, or this skill's narration scripts. Confidence intervals also make small rank gaps
poor evidence of a meaningful difference.

The default therefore optimizes the whole local deployment rather than one preference score:

- Magpie has a first-party native C++ runtime that detects Metal on Apple Silicon, accepts explicit
  local model paths, and serves a loopback OpenAI-style audio endpoint.[2][3]
- Magpie provides five stock voices and deliberately removes zero-shot cloning, avoiding the need to
  source and govern a reference recording for ordinary narration.[4]
- NVIDIA describes the model as ready for commercial use under its Open Model License. The Hugging
  Face access-form metadata has also displayed a contradictory non-commercial checkbox, so archive
  the accepted license text and have counsel resolve that metadata conflict before distribution.[4]

## Candidate matrix

File sizes are repository artifact sizes, not measured peak unified-memory use. Memory guidance
labeled **operator estimate** is deliberately conservative and must be replaced by measurements on
the target Mac.

| Candidate | Quality and text behavior | Apple Silicon path | Footprint | License and voices | Decision |
| --- | --- | --- | --- | --- | --- |
| Fish Audio S2 Pro | Highest-ranked open-weight entry in the cited arena. Fish reports 0.99% English WER on Seed-TTS Eval and supports free-form inline prosody tags, but those are vendor results.[1][5] | No maintained first-party Metal or MLX path was found. The official stack emphasizes SGLang/vLLM and reports H200 performance; the repository's new non-CUDA path is ROCm, not Apple.[5][6] | BF16 model shards are about 9.12 GB plus a 1.87 GB codec. **Operator estimate:** at least a 24-32 GB Mac even if a stable port appears. | Fish Audio Research License: free research/non-commercial use; commercial use needs a separate agreement. Voice cloning uses a 10-30 second reference.[5] | Quality benchmark only. Do not select for this Mac stack. |
| Fish Audio S2.1 Pro | Artificial Analysis lists it as a newer hosted Fish API voice and scores it above S2 Pro.[1] | No distinct official S2.1 open-weight repository or checkpoint was found as of the research date. The official open release remains `fishaudio/s2-pro`.[5] | Unknown locally. | Do not transfer the S2 Pro license or runtime assumptions to a hosted product name. | Exclude until Fish publishes weights, license, and local instructions. |
| Step Audio EditX | Second among the cited open-weight entries; unusually strong emotion, style, paralinguistic, pronunciation, and iterative audio-editing controls.[1][7] Its focus is broader than plain narration. | Official requirements say Linux, Python 3.12, PyTorch 2.9.1, CUDA, and an NVIDIA GPU. No first-party MPS/MLX path was found.[7] | Main model about 7.06 GB plus roughly 1.25 GB of tokenizer/vocoder artifacts. Official guidance calls 12 GB VRAM critical and 16 GB safer; AWQ remains CUDA-oriented.[7] | The card explicitly grants Apache-2.0 to repository code but does not clearly grant that license to model weights. Treat weight rights as unresolved. Zero-shot TTS requires a reference clip. | Reject for Apple Silicon and unresolved weight license. |
| Mistral Voxtral 4B TTS 2603 | Third among the cited open-weight entries. Twenty preset voices, nine languages, 24 kHz output, streaming/batch support, and no reference clip required for presets.[1][8] | Official serving is vLLM on a 16 GB NVIDIA GPU. Community `mlx-audio` 0.4.8 has a dedicated Apple implementation, BF16 conversion, CLI, and OpenAI-compatible server.[8][9] | About 8.0 GB BF16 weights plus tokenizer and voice embeddings. **Operator estimate:** 16 GB may memory-pressure the machine; prefer 24 GB or more. | CC BY-NC 4.0 inherited from the reference voices. Five English presets: `casual_male`, `casual_female`, `cheerful_female`, `neutral_male`, `neutral_female`.[8][9] | Quality-heavy non-commercial alternate. |
| NVIDIA Magpie Multilingual 357M | Fourth among the cited open-weight entries. The `v2607` card reports 0.37% English CER versus 0.34% for `v2602`; this is NVIDIA evaluation, not a listening result.[1][4] Standard mode caps an utterance at about 20 seconds, while long-form mode chunks punctuated text. | First-party `NeMo-Speech.cpp` builds native Metal, CLI synthesis, and a loopback HTTP server. The currently published native F16 GGUF is `v2602`, even though `v2607` is the latest NeMo checkpoint.[2][4] | 449 MB Magpie GGUF plus 79 MB NanoCodec. Tokenizer extraction currently also downloads a 1.47 GB `.nemo` archive. **Operator estimate:** 2-4 GB runtime headroom, pending measurement. | NVIDIA Open Model License; model card says commercial-ready. Five English-trained voices used across languages: Aria, Jason, John, Leo, Sofia. No zero-shot cloning.[4] | Default. Best operational fit and safest stock-voice workflow. |
| Kokoro 82M v1.0 | Fifth among the cited open-weight entries. Stable, simple single-speaker output with explicit speed and phoneme input. Its own voice guide warns about weak sub-20-token clips and rushing beyond roughly 400 tokens; 20-45 second microbites normally sit in its preferred middle range.[1][10] | Official Python works on CPU/MPS; the skill already pins `kokoro==0.9.4`. `mlx-audio` also offers BF16 and quantized Apple conversions, but changing the existing adapter adds no necessary capability.[10][11] | Official checkpoint 327 MB; voice embeddings are about 0.5 MB each. The MLX BF16 conversion is also 327 MB. | Apache-2.0. Fifty-four voices across eight language groups; creator grades `af_heart` and `af_bella` highest among American English voices.[10] | Low-resource fallback and acceptance-test control. |
| Chatterbox family | Original Chatterbox is materially lower in the cited arena than the selected five. V3 claims fewer hallucinations than V2; these are creator claims and still require exact-script testing.[1][12] | Official original and multilingual examples accept `mps`; Nano also targets CPU. `mlx-audio` supports multilingual V3 on Apple. Turbo and Nano use a reference voice or bundled conditionals and remain less mature than Kokoro for this workflow.[12][13] | Model labels understate download size: Nano is 110M but its shared decoder makes the repository about 3.0 GB; Turbo is about 4.0 GB. MLX multilingual V3 is about 2.7 GB. | MIT. Original 500M English, Turbo 350M English, Nano 110M English, V3 500M/23 languages. All generated audio includes Resemble's PerTh watermark.[12] | Revisit only for consented voice cloning or native paralinguistic tags. Not the low-resource fallback. |

## Serving stack

### Default: first-party NeMo-Speech.cpp server

Prefer the official native server over a new wrapper:

- it is the runtime that owns the Magpie GGUF conversion and NanoCodec integration;
- it auto-selects Metal on Apple Silicon and can be forced to CPU for diagnosis;
- it loads explicit local files and does not download models at server start;
- `POST /v1/audio/speech`, `/ready`, `/health`, and `/v1/models` are already documented;
- loopback is the default, CORS is off, and an API key/TLS can be added if the service is exposed.[2][3]

The compatibility surface is intentionally small. The speech endpoint accepts WAV or PCM and the
`speed` field currently accepts only `1.0`; perform any approved playback-speed adjustment in the
deck rather than pretending the server can direct model pacing.[14]

Pin the runtime source until it has tagged, checksum-published macOS releases:

```bash
git clone https://github.com/NVIDIA/NeMo-Speech.cpp.git
git -C NeMo-Speech.cpp checkout 1118951337094db3b362fbf1b27e871696f10590
NeMo-Speech.cpp/scripts/install.sh --source
export PATH="$HOME/.local/bin:$PATH"
nemo-speech doctor
```

Download all artifacts while network access is permitted. The pinned Magpie repository snapshot is
the current first-party combination containing the `v2602` GGUF and tokenizer-bearing `.nemo`
archive. The archive itself contains the newer `v2607` checkpoint, but the native runtime uses it
for tokenizer assets; synthesis still uses the explicitly named `v2602` GGUF.[4][15]

```bash
python -m pip install --upgrade huggingface_hub

hf download nvidia/magpie_tts_multilingual_357m \
  --revision 452ef560f972c38d5fc16476259aac9456453547 \
  --include magpie_tts_multilingual_357m.v2602.f16.gguf \
  --include magpie_tts_multilingual_357m.nemo \
  --local-dir models/magpie-tts

mkdir -p models/magpie-tts/extracted
tar -xf models/magpie-tts/magpie_tts_multilingual_357m.nemo \
  -C models/magpie-tts/extracted

hf download nvidia/nemo-nano-codec-22khz-1.89kbps-21.5fps \
  --revision fc00890b604aa2de298d2641ffc6c5f6caf8c4d7 \
  nemo_nano_codec_22khz_1.89kbps_21.5fps.decoder.f16.gguf \
  --local-dir models/nano-codec
```

Verify CLI synthesis before adding the server:

```bash
nemo-speech synthesize \
  "A draw result is committed before the reveal begins." \
  --magpie-model models/magpie-tts/magpie_tts_multilingual_357m.v2602.f16.gguf \
  --codec-model models/nano-codec/nemo_nano_codec_22khz_1.89kbps_21.5fps.decoder.f16.gguf \
  --tokenizer-dir models/magpie-tts/extracted \
  --language en-US \
  --speaker 4 \
  --output magpie-smoke.wav
```

Then start the loopback service with one pinned stock voice:

```bash
nemo-speech serve \
  --tts.magpie-model models/magpie-tts/magpie_tts_multilingual_357m.v2602.f16.gguf \
  --tts.codec-model models/nano-codec/nemo_nano_codec_22khz_1.89kbps_21.5fps.decoder.f16.gguf \
  --tts.tokenizer-model-dir models/magpie-tts/extracted \
  --tts.language-code en-US \
  --tts.voice-name Sofia \
  --tts.seed 1 \
  --host 127.0.0.1 \
  --port 8080 \
  --no-ui
```

```bash
curl --fail --silent --show-error \
  -H 'Content-Type: application/json' \
  -d '{"input":"A draw result is committed before the reveal begins.","voice":"Sofia","language":"en-US","response_format":"wav"}' \
  http://127.0.0.1:8080/v1/audio/speech \
  --output magpie-server-smoke.wav
```

The server uses only those local paths after startup. Keep it bound to `127.0.0.1`. If another
device must connect, require an API key, TLS or a trusted TLS proxy, and one explicit CORS origin;
never use an unauthenticated `0.0.0.0` listener.[3]

### Quality alternate: pinned MLX-Audio server

Use MLX-Audio only when intentionally selecting Voxtral. It gives the community Apple port an
OpenAI-compatible endpoint without writing another server, but it introduces a second runtime and
community-converted weights. Pin both package source and model revision, prefetch once, and set Hub
offline mode for generation.[9]

```bash
uv tool install --force \
  'git+https://github.com/Blaizzy/mlx-audio.git@49596ac8b69b9ed377db311a73df838795f38a3d'

hf download mlx-community/Voxtral-4B-TTS-2603-mlx-bf16 \
  --revision dd85c02adbae551f5bb29ded35ee60ccdfb90927 \
  --local-dir models/voxtral-mlx

HF_HUB_OFFLINE=1 mlx_audio.tts.generate \
  --model models/voxtral-mlx \
  --text "A draw result is committed before the reveal begins." \
  --voice neutral_female \
  --output_path ./voxtral-smoke-output
```

For repeated requests, `mlx_audio.server --host 127.0.0.1 --port 8000` exposes
`POST /v1/audio/speech`. Do not expose it beyond loopback without placing an authenticated local
proxy in front of it. Do not ship Voxtral output commercially under the current CC BY-NC license.

### Fallback: keep the bundled Kokoro adapter

Do not replace the existing fallback with the MLX conversion merely for framework uniformity. The
skill already pins the official Python package and model snapshot, supports cache-only execution,
and has the correct transcript-preserving failure behavior:

```bash
python -m pip install 'kokoro==0.9.4' soundfile numpy

python <path-to-skill>/scripts/render-narration-kokoro.py \
  --offline \
  --input narration.txt \
  --output narration.wav
```

If a common HTTP interface later becomes necessary, put a thin adapter around this script's existing
synthesis function. Do not make MLX-Audio a required dependency solely to serve a 327 MB fallback.

## Reproducibility and offline contract

Record these identities with every acceptance run:

| Artifact | Pin |
| --- | --- |
| `NVIDIA/NeMo-Speech.cpp` | `1118951337094db3b362fbf1b27e871696f10590` |
| Magpie repository snapshot used by native setup | `452ef560f972c38d5fc16476259aac9456453547` |
| Magpie `v2607` release tag | `5023df68bd3f5b5ce6d666a50979bc501af145cc` |
| Magpie `v2602` release tag | `34d7e40da85cabc97f92198889b65cea27bc7fd1` |
| NanoCodec repository | `fc00890b604aa2de298d2641ffc6c5f6caf8c4d7` |
| `Blaizzy/mlx-audio` 0.4.8 | `49596ac8b69b9ed377db311a73df838795f38a3d` |
| MLX Voxtral conversion | `dd85c02adbae551f5bb29ded35ee60ccdfb90927` |
| Fish S2 Pro weights | `1de9996b6be38b745688de084d87a5633f714e4e` |
| Fish Speech runtime | `e5e292632cb11e7a27b2b7487f58f612bc101e13` |
| Step Audio EditX weights | `5fe2f8a05c2353301ad47d3c1747b262115da138` |
| Chatterbox runtime | `5de7a54aa4e5e2baadb0182dde554908b48b85c2` |
| Kokoro 82M v1.0 | `f3ff3571791e39611d31c381e3a41a3af07b4987` |

Download and hash artifacts before an offline session. Then disable network access or run with
`HF_HUB_OFFLINE=1` where a Hugging Face-aware Python process remains involved. A successful online
smoke test is not proof of offline operation: repeat synthesis after disconnecting networking and
clearing any process-level credentials.

Do not commit model files, reference recordings, Hugging Face caches, or generated narration to the
reusable skill repository. A destination project may retain approved generated clips as its own
assets; keep private source material and unapproved output in a local data directory instead.

## Narration defaults

Start Magpie evaluation with:

- voice `Sofia` and seed `1`, with `Aria` and `John` in the voice bake-off;
- one complete, punctuated narration script per request and long-form mode left at `auto`;
- 22.05 kHz mono WAV from the runtime, converting to MP3 only after successful synthesis;
- expanded dates, numbers, units, paths, symbols, and abbreviations in the approved narration text.

Magpie's native endpoint does not offer general prosody instructions or a real model speed control.
Write the intended pace into sentence length and punctuation. Do not insert expressive tags that the
model may speak literally. For unusual names or domain terms, use the documented IPA customization
only after the visible transcript remains understandable and acceptance tests prove the spoken form.

Always label output as AI-generated speech. Use stock voices. A model's cloning capability is not
consent: a cloned voice requires documented, scope-specific permission for the speaker, the exact
use, retention, and distribution. No candidate with a reference clip should become the default by
quietly bundling a person's recording.

## Acceptance bake-off

No Apple Silicon latency or memory number in this document is a measured result. Before changing the
skill's default, run the same release build and scripts on the minimum supported Mac and record:

1. Twelve scripts split evenly across intended 20, 30, and 45 second durations. Include dates,
   money, percentages, acronyms, proper names, repository paths, code symbols, quotations, and source
   anchors.
2. Magpie `v2602` through NeMo-Speech.cpp, Voxtral through MLX-Audio where non-commercial use is
   acceptable, and Kokoro 82M through the bundled adapter. Generate each script with three fixed
   seeds where the runtime exposes a seed.
3. Cold start, warm start, time to first playable audio, total generation time, real-time factor,
   peak process memory, peak system memory pressure, output duration, and output file size.
4. Human-blind naturalness and instructional clarity, plus an ASR transcript diff that flags every
   skipped, repeated, substituted, hallucinated, or reordered word. Manually inspect source anchors
   even when aggregate WER looks acceptable.
5. A true offline rerun, malformed input, unsupported voice, unavailable model, full disk, process
   interruption, and concurrent-request behavior. The transcript must survive every failure.

Reject a candidate or setting that adds words, drops a negation or source anchor, speaks markup,
changes materially between fixed-seed runs, exceeds the target Mac's memory without recovery, or
requires routine manual audio repair. Naturalness cannot compensate for altered educational content.

Re-run the bake-off before changing any pin and at least every six months. In particular, reassess
when NVIDIA publishes a `v2607` GGUF, Fish publishes a maintained Apple runtime or separately licensed
commercial weights, Mistral changes Voxtral's license, or Resemble publishes independent Nano/V3
exact-text evidence.

## Sources

1. Artificial Analysis, [Speech Arena provider-voice leaderboard and open-weight filter](https://artificialanalysis.ai/text-to-speech/leaderboard/provider-voice). Preference evidence only.
2. NVIDIA, [`NeMo-Speech.cpp` installation and Metal selection](https://github.com/NVIDIA/NeMo-Speech.cpp/blob/1118951337094db3b362fbf1b27e871696f10590/docs/install.md) and [CLI guide](https://github.com/NVIDIA/NeMo-Speech.cpp/blob/1118951337094db3b362fbf1b27e871696f10590/docs/cli.md).
3. NVIDIA, [`NeMo-Speech.cpp` server guide](https://github.com/NVIDIA/NeMo-Speech.cpp/blob/1118951337094db3b362fbf1b27e871696f10590/docs/server.md).
4. NVIDIA, [MagpieTTS Multilingual 357M model card](https://huggingface.co/nvidia/magpie_tts_multilingual_357m) and [NVIDIA Open Model License](https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license).
5. Fish Audio, [S2 Pro model card, architecture, languages, performance, and license](https://huggingface.co/fishaudio/s2-pro).
6. Fish Audio, [Fish Speech repository and supported deployment paths](https://github.com/fishaudio/fish-speech/tree/e5e292632cb11e7a27b2b7487f58f612bc101e13).
7. StepFun, [Step Audio EditX model card, requirements, memory guidance, and license statement](https://huggingface.co/stepfun-ai/Step-Audio-EditX).
8. Mistral AI, [Voxtral 4B TTS 2603 model card, voices, serving, memory, and license](https://huggingface.co/mistralai/Voxtral-4B-TTS-2603).
9. MLX-Audio, [Apple Silicon runtime, model support, and server](https://github.com/Blaizzy/mlx-audio/tree/49596ac8b69b9ed377db311a73df838795f38a3d) and [Voxtral implementation guide](https://github.com/Blaizzy/mlx-audio/blob/49596ac8b69b9ed377db311a73df838795f38a3d/mlx_audio/tts/models/voxtral_tts/README.md).
10. Hexgrad, [Kokoro 82M model card](https://huggingface.co/hexgrad/Kokoro-82M) and [voice inventory and limitations](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).
11. MLX Community, [Kokoro 82M BF16 conversion and artifact](https://huggingface.co/mlx-community/Kokoro-82M-bf16).
12. Resemble AI, [Chatterbox repository, model zoo, MPS example, watermark, and MIT license](https://github.com/resemble-ai/chatterbox/tree/5de7a54aa4e5e2baadb0182dde554908b48b85c2).
13. MLX Community, [Chatterbox Multilingual V3 Apple conversion](https://huggingface.co/mlx-community/chatterbox-multilingual-v3).
14. NVIDIA, [`POST /v1/audio/speech` request contract](https://github.com/NVIDIA/NeMo-Speech.cpp/blob/1118951337094db3b362fbf1b27e871696f10590/docs/api.md#post-v1audiospeech).
15. NVIDIA, [`NeMo-Speech.cpp` TTS model download and tokenizer instructions](https://github.com/NVIDIA/NeMo-Speech.cpp/blob/1118951337094db3b362fbf1b27e871696f10590/docs/tts/models.md).
