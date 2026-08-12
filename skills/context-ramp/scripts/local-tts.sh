#!/usr/bin/env bash

set -euo pipefail

RUNTIME_REF="1118951337094db3b362fbf1b27e871696f10590"
MAGPIE_REF="452ef560f972c38d5fc16476259aac9456453547"
CODEC_REF="fc00890b604aa2de298d2641ffc6c5f6caf8c4d7"
TTS_HOME="${CONTEXT_RAMP_TTS_HOME:-$HOME/.local/share/context-ramp/tts}"
RUNTIME_DIR="$TTS_HOME/NeMo-Speech.cpp"
RUNTIME_PREFIX="$TTS_HOME/runtime"
MAGPIE_DIR="$TTS_HOME/models/magpie-tts"
CODEC_DIR="$TTS_HOME/models/nano-codec"
MAGPIE_MODEL="$MAGPIE_DIR/magpie_tts_multilingual_357m.v2602.f16.gguf"
MAGPIE_ARCHIVE="$MAGPIE_DIR/magpie_tts_multilingual_357m.nemo"
TOKENIZER_DIR="$MAGPIE_DIR/extracted"
CODEC_MODEL="$CODEC_DIR/nemo_nano_codec_22khz_1.89kbps_21.5fps.decoder.f16.gguf"
NEMO_SPEECH="${NEMO_SPEECH_BIN:-$RUNTIME_PREFIX/bin/nemo-speech}"
if [[ "$(uname -s)" == "Darwin" && "$(uname -m)" == "arm64" ]]; then
  BUILD_PRESET="metal-server"
else
  BUILD_PRESET="cpu-server"
fi
if command -v hf >/dev/null 2>&1; then
  HF_BIN="$(command -v hf)"
else
  PYTHON_USER_BIN="$(python3 -c 'import site; print(site.USER_BASE + "/bin")')"
  HF_BIN="${HF_BIN:-$PYTHON_USER_BIN/hf}"
fi

usage() {
  cat <<'EOF'
Usage: local-tts.sh <command>

Commands:
  doctor   Check build tools, runtime, and model artifacts.
  install  Build pinned NeMo-Speech.cpp and download pinned Magpie/NanoCodec files.
  serve    Start the TTS service on http://127.0.0.1:8080.

Environment:
  CONTEXT_RAMP_TTS_HOME  Runtime/model directory.
  NEMO_SPEECH_BIN        Override the nemo-speech executable.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$1" >&2
    return 1
  fi
}

doctor() {
  local failed=0
  for command_name in git cmake ninja python3 tar; do
    if command -v "$command_name" >/dev/null 2>&1; then
      printf 'ok      %s\n' "$command_name"
    else
      printf 'missing %s\n' "$command_name"
      failed=1
    fi
  done
  if [[ -x "$HF_BIN" ]]; then
    printf 'ok      %s\n' "$HF_BIN"
  else
    printf 'missing hf (install with: python3 -m pip install --user huggingface_hub)\n'
    failed=1
  fi
  for path in "$NEMO_SPEECH" "$MAGPIE_MODEL" "$MAGPIE_ARCHIVE" "$TOKENIZER_DIR" "$CODEC_MODEL"; do
    if [[ -e "$path" ]]; then
      printf 'ok      %s\n' "$path"
    else
      printf 'missing %s\n' "$path"
      failed=1
    fi
  done
  return "$failed"
}

install_runtime() {
  require_command git
  require_command cmake
  require_command ninja

  mkdir -p "$TTS_HOME"
  if [[ ! -d "$RUNTIME_DIR/.git" ]]; then
    git clone https://github.com/NVIDIA/NeMo-Speech.cpp.git "$RUNTIME_DIR"
  fi

  local current_ref
  current_ref="$(git -C "$RUNTIME_DIR" rev-parse HEAD)"
  if [[ "$current_ref" != "$RUNTIME_REF" ]]; then
    git -C "$RUNTIME_DIR" fetch origin "$RUNTIME_REF"
    git -C "$RUNTIME_DIR" checkout --detach "$RUNTIME_REF"
  fi
  git -C "$RUNTIME_DIR" submodule update --init ggml third_party/cpp-httplib
  (
    cd "$RUNTIME_DIR"
    scripts/configure.sh "$BUILD_PRESET" \
      -DNEMO_SPEECH_BUILD_ASR=OFF \
      -DNEMO_SPEECH_BUILD_DIAR=OFF
    cmake --build --preset "$BUILD_PRESET"
    cmake --install "build/$BUILD_PRESET" --prefix "$RUNTIME_PREFIX"
  )
}

download_models() {
  require_command tar
  if [[ ! -x "$HF_BIN" ]]; then
    printf 'Missing Hugging Face CLI. Install with: python3 -m pip install --user huggingface_hub\n' >&2
    exit 1
  fi

  mkdir -p "$MAGPIE_DIR" "$CODEC_DIR" "$TOKENIZER_DIR"
  "$HF_BIN" download nvidia/magpie_tts_multilingual_357m \
    --revision "$MAGPIE_REF" \
    --include magpie_tts_multilingual_357m.v2602.f16.gguf \
    --include magpie_tts_multilingual_357m.nemo \
    --local-dir "$MAGPIE_DIR"
  tar -xf "$MAGPIE_ARCHIVE" -C "$TOKENIZER_DIR"
  "$HF_BIN" download nvidia/nemo-nano-codec-22khz-1.89kbps-21.5fps \
    --revision "$CODEC_REF" \
    nemo_nano_codec_22khz_1.89kbps_21.5fps.decoder.f16.gguf \
    --local-dir "$CODEC_DIR"
}

install_all() {
  install_runtime
  download_models
  printf 'Local TTS installed at %s\n' "$TTS_HOME"
  doctor
}

serve() {
  if [[ ! -x "$NEMO_SPEECH" ]]; then
    printf 'nemo-speech is not installed. Run: %s install\n' "$0" >&2
    exit 1
  fi
  for path in "$MAGPIE_MODEL" "$TOKENIZER_DIR" "$CODEC_MODEL"; do
    if [[ ! -e "$path" ]]; then
      printf 'Missing model artifact: %s\nRun: %s install\n' "$path" "$0" >&2
      exit 1
    fi
  done

  exec "$NEMO_SPEECH" serve \
    --tts.magpie-model "$MAGPIE_MODEL" \
    --tts.codec-model "$CODEC_MODEL" \
    --tts.tokenizer-model-dir "$TOKENIZER_DIR" \
    --tts.language-code en-US \
    --tts.voice-name Sofia \
    --tts.seed 1 \
    --host 127.0.0.1 \
    --port 8080 \
    --no-ui
}

case "${1:-}" in
  doctor) doctor ;;
  install) install_all ;;
  serve) serve ;;
  *) usage; exit 1 ;;
esac
