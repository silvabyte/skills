#!/usr/bin/env python3

import argparse
import os
import shutil
import sys
from pathlib import Path

KOKORO_REPO = "hexgrad/Kokoro-82M"
KOKORO_REVISION = "f3ff3571791e39611d31c381e3a41a3af07b4987"
LANGUAGE_CODES = {"a", "b", "e", "f", "h", "i", "p", "j", "z"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Render local Context Ramp narration with pinned Kokoro 82M."
    )
    parser.add_argument("--input", required=True, type=Path, help="UTF-8 narration text file")
    parser.add_argument("--output", required=True, type=Path, help="New WAV output path")
    parser.add_argument("--voice", default="af_heart", help="Kokoro voice name")
    parser.add_argument("--lang-code", default="a", help="Kokoro language code")
    parser.add_argument("--speed", type=float, default=0.98, help="Speaking speed from 0.6 to 1.5")
    parser.add_argument(
        "--offline",
        action="store_true",
        help="Require the pinned model and voice to exist in the Hugging Face cache",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.output.suffix.lower() != ".wav":
        raise ValueError("The output path must end in .wav.")
    if args.output.exists():
        raise ValueError("The output already exists. Choose a new content-specific path.")
    if not 0.6 <= args.speed <= 1.5:
        raise ValueError("--speed must be between 0.6 and 1.5.")
    if args.lang_code not in LANGUAGE_CODES:
        raise ValueError(f"Unsupported --lang-code: {args.lang_code}.")
    if not args.voice.replace("_", "").isalnum():
        raise ValueError("--voice must contain only letters, numbers, and underscores.")
    if not args.voice.startswith(args.lang_code):
        raise ValueError("The voice prefix must match --lang-code.")
    if args.lang_code not in {"j", "z"} and shutil.which("espeak-ng") is None:
        raise RuntimeError("espeak-ng is required to prevent skipped out-of-dictionary words.")

    transcript = args.input.read_text(encoding="utf-8").strip()
    if not transcript:
        raise ValueError("The narration text file is empty.")
    if len(transcript) > 5000:
        raise ValueError("Narration exceeds 5000 characters. Split it into microbites.")

    try:
        import numpy as np
        import soundfile as sf
        import torch
        from huggingface_hub import hf_hub_download
        from kokoro import KModel, KPipeline
        from loguru import logger
    except ImportError as error:
        raise RuntimeError(
            "Use Python 3.10-3.12 and install: pip install 'kokoro==0.9.4' soundfile numpy; "
            "Kokoro may also require espeak-ng."
        ) from error

    synthesis_warnings = []
    logger.remove()
    logger.add(lambda message: synthesis_warnings.append(message.record["level"].name), level="WARNING")
    logger.enable("kokoro")
    download_options = {
        "repo_id": KOKORO_REPO,
        "revision": KOKORO_REVISION,
        "local_files_only": args.offline,
    }
    config_path = hf_hub_download(filename="config.json", **download_options)
    model_path = hf_hub_download(filename="kokoro-v1_0.pth", **download_options)
    voice_path = hf_hub_download(filename=f"voices/{args.voice}.pt", **download_options)

    model = KModel(repo_id=KOKORO_REPO, config=config_path, model=model_path).eval()
    pipeline = KPipeline(lang_code=args.lang_code, repo_id=KOKORO_REPO, model=model)
    voice = torch.load(voice_path, weights_only=True)
    chunks = [
        np.asarray(audio)
        for _, _, audio in pipeline(transcript, voice=voice, speed=args.speed, model=model)
        if audio is not None
    ]
    if not chunks:
        raise RuntimeError("Kokoro returned no audio.")
    if synthesis_warnings:
        raise RuntimeError(
            "Kokoro reported a synthesis warning; output was discarded. Verify language dependencies, "
            "voice compatibility, and microbite length."
        )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary_output = args.output.with_name(f"{args.output.name}.tmp-{os.getpid()}.wav")
    try:
        sf.write(temporary_output, np.concatenate(chunks), 24000)
        os.link(temporary_output, args.output)
        temporary_output.unlink()
    finally:
        temporary_output.unlink(missing_ok=True)

    print(args.output.resolve())


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Narration unavailable: {error}", file=sys.stderr)
        raise SystemExit(1)
