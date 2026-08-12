#!/usr/bin/env node

import { access, link, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";

function usage() {
  return `Usage:
  node render-narration-local.mjs --input <script.txt> --output <clip.wav> [options]

Options:
  --voice <name>       Loaded Magpie stock voice. Default: Sofia.
  --language <code>    BCP-47 language code. Default: en-US.
  --server <url>       Loopback NeMo-Speech.cpp server. Default: http://127.0.0.1:8080.
  --timeout-ms <ms>    Request timeout. Default: 180000.
  --help               Show this help.

Environment:
  CONTEXT_RAMP_LOCAL_TTS_URL can supply --server.
  CONTEXT_RAMP_LOCAL_TTS_API_KEY supplies an optional loopback service key.
`;
}

function parseArgs(argv) {
  const options = {};
  const valueFlags = new Set(["input", "output", "voice", "language", "server", "timeout-ms"]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") {
      options.help = true;
      continue;
    }
    if (!argument.startsWith("--")) throw new Error(`Unexpected argument: ${argument}`);
    const name = argument.slice(2);
    if (!valueFlags.has(name)) throw new Error(`Unknown option: ${argument}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    options[name] = value;
    index += 1;
  }

  return options;
}

function requireOption(value, message) {
  if (!value) throw new Error(message);
  return value;
}

function loopbackServer(value) {
  const server = new URL(value);
  const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]"]);
  if (server.protocol !== "http:" && server.protocol !== "https:") {
    throw new Error("The local TTS server must use HTTP or HTTPS.");
  }
  if (!loopbackHosts.has(server.hostname) || server.username || server.password) {
    throw new Error("The local TTS server must be a credential-free loopback URL.");
  }
  return server;
}

function headers() {
  const result = { "Content-Type": "application/json" };
  const apiKey = process.env.CONTEXT_RAMP_LOCAL_TTS_API_KEY;
  if (apiKey) result.Authorization = `Bearer ${apiKey}`;
  return result;
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`The local TTS service timed out after ${timeoutMs} ms.`);
    }
    if (error instanceof TypeError) {
      throw new Error("The local TTS service is unavailable. Run local-tts.sh serve first.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(usage());
    return;
  }

  const input = resolve(requireOption(options.input, "Missing --input narration text file."));
  const output = resolve(requireOption(options.output, "Missing --output WAV path."));
  if (extname(output).toLowerCase() !== ".wav") throw new Error("The output path must end in .wav.");
  if (input === output) throw new Error("Input and output paths must differ.");
  try {
    await access(output);
    throw new Error("The output already exists. Choose a new content-specific path.");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const timeoutMs = Number(options["timeout-ms"] ?? 180000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 600000) {
    throw new Error("--timeout-ms must be an integer from 1000 to 600000.");
  }

  const transcript = (await readFile(input, "utf8")).trim();
  if (!transcript) throw new Error("The narration text file is empty.");
  if (transcript.length > 5000) {
    throw new Error("Narration exceeds 5000 characters. Split it into 20-45 second microbites.");
  }

  const server = loopbackServer(
    options.server ?? process.env.CONTEXT_RAMP_LOCAL_TTS_URL ?? "http://127.0.0.1:8080",
  );
  const readyUrl = new URL("/ready", server);
  const ready = await fetchWithTimeout(readyUrl, { headers: headers() }, Math.min(timeoutMs, 10000));
  if (!ready.ok) throw new Error(`The local TTS service is not ready (${ready.status}).`);
  const readyState = await ready.json();
  if (readyState.ready !== true) throw new Error("The local TTS service has not finished loading.");

  const speechUrl = new URL("/v1/audio/speech", server);
  const response = await fetchWithTimeout(
    speechUrl,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        input: transcript,
        voice: options.voice ?? "Sofia",
        language: options.language ?? "en-US",
        speed: 1.0,
        response_format: "wav",
      }),
    },
    timeoutMs,
  );
  if (!response.ok) throw new Error(`Local narration failed (${response.status}).`);
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("audio/")) throw new Error("The local service returned non-audio data.");

  const audio = Buffer.from(await response.arrayBuffer());
  const isWav = audio.length > 44
    && audio.subarray(0, 4).toString("ascii") === "RIFF"
    && audio.subarray(8, 12).toString("ascii") === "WAVE";
  if (!isWav) throw new Error("The local service returned invalid WAV audio.");

  await mkdir(dirname(output), { recursive: true });
  const temporaryOutput = `${output}.tmp-${process.pid}`;
  let finalized = false;
  try {
    await writeFile(temporaryOutput, audio);
    await link(temporaryOutput, output);
    await unlink(temporaryOutput);
    finalized = true;
  } finally {
    if (!finalized) await unlink(temporaryOutput).catch(() => {});
  }
  process.stdout.write(`${output}\n`);
}

main().catch((error) => {
  process.stderr.write(`Narration unavailable: ${error.message}\n`);
  process.exitCode = 1;
});
