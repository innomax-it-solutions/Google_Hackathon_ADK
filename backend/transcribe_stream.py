"""Streaming speech-to-text bridge: browser PCM -> Google Cloud STT v2 (Chirp).

Used by the /ws/transcribe WebSocket in main.py. The browser streams raw 16 kHz
mono LINEAR16 PCM; we proxy it to STT v2 streaming_recognize, which detects the
spoken language (Chirp) and returns interim + final transcripts in real time. We
map STT's BCP-47 language tag back to the app's ISO 639-1 UI code so the composer
can switch the agent's reply language to whatever was spoken.

Auth: Application Default Credentials — NOT the Gemini API key. Cloud
Speech-to-Text needs a service account / ADC. The project is resolved from
GOOGLE_CLOUD_PROJECT or ADC, and the Speech-to-Text API must be enabled on it.

Tunables (env, no code change needed):
  GOOGLE_CLOUD_LOCATION  region for the regional Chirp endpoint (default us-central1)
  STT_MODEL              recognition model (default chirp_2)
  STT_LANGUAGES          comma-separated BCP-47 tags, or "auto" for auto-detect
"""

from __future__ import annotations

import asyncio
import os
from typing import AsyncIterator

import google.auth
from google.api_core.client_options import ClientOptions
from google.cloud import speech_v2
from google.cloud.speech_v2.types import cloud_speech as cs

_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
_STT_MODEL = os.environ.get("STT_MODEL", "chirp_2")
# "auto" lets Chirp pick the language; or pass a candidate list like
# "en-US,hi-IN,es-ES" to constrain detection (more reliable in some regions).
_STT_LANGUAGES = [
    code.strip()
    for code in os.environ.get("STT_LANGUAGES", "auto").split(",")
    if code.strip()
]
_SAMPLE_RATE = 16000

# STT returns BCP-47 (e.g. "en-US", "cmn-Hans-CN"); map the primary subtag back
# to the 10 app UI codes (LanguageContext). Anything else -> English.
_PRIMARY_TO_APP = {
    "en": "en", "es": "es", "fr": "fr", "hi": "hi", "ar": "ar",
    "bn": "bn", "pt": "pt", "ru": "ru", "ur": "ur", "zh": "zh", "cmn": "zh",
}


def _app_language(bcp47: str | None) -> str:
    if not bcp47:
        return "en"
    return _PRIMARY_TO_APP.get(bcp47.split("-")[0].lower(), "en")


_client: speech_v2.SpeechAsyncClient | None = None
_project: str | None = None


def _ensure_client() -> tuple[speech_v2.SpeechAsyncClient, str]:
    """Build the regional async Speech client once, resolving the GCP project."""
    global _client, _project
    if _client is None:
        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        if not project:
            # ADC carries the quota/default project; reuse it.
            _, project = google.auth.default()
        if not project:
            raise RuntimeError(
                "No GCP project for Speech-to-Text. Set GOOGLE_CLOUD_PROJECT or "
                "configure Application Default Credentials."
            )
        # Chirp models are served from a regional endpoint, not the global one.
        endpoint = None if _LOCATION == "global" else f"{_LOCATION}-speech.googleapis.com"
        opts = ClientOptions(api_endpoint=endpoint) if endpoint else None
        _client = speech_v2.SpeechAsyncClient(client_options=opts)
        _project = project
    return _client, _project


def _streaming_config() -> cs.StreamingRecognitionConfig:
    config = cs.RecognitionConfig(
        explicit_decoding_config=cs.ExplicitDecodingConfig(
            encoding=cs.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=_SAMPLE_RATE,
            audio_channel_count=1,
        ),
        language_codes=_STT_LANGUAGES,
        model=_STT_MODEL,
    )
    features = cs.StreamingRecognitionFeatures(interim_results=True)
    return cs.StreamingRecognitionConfig(config=config, streaming_features=features)


async def stream_transcribe(audio_queue: "asyncio.Queue") -> AsyncIterator[dict]:
    """Bridge an audio-chunk queue to STT, yielding transcript events.

    Pull `bytes` chunks off `audio_queue`; push `None` to signal end-of-audio.
    Yields dicts: {"type": "interim"|"final", "text": str, "language": <iso>}.
    """
    client, project = _ensure_client()
    recognizer = f"projects/{project}/locations/{_LOCATION}/recognizers/_"
    streaming_config = _streaming_config()

    async def requests() -> AsyncIterator[cs.StreamingRecognizeRequest]:
        # First request carries recognizer + config; the rest carry audio.
        yield cs.StreamingRecognizeRequest(
            recognizer=recognizer, streaming_config=streaming_config
        )
        while True:
            chunk = await audio_queue.get()
            if chunk is None:
                return
            yield cs.StreamingRecognizeRequest(audio=chunk)

    responses = await client.streaming_recognize(requests=requests())
    async for response in responses:
        for result in response.results:
            if not result.alternatives:
                continue
            transcript = result.alternatives[0].transcript
            if not transcript:
                continue
            yield {
                "type": "final" if result.is_final else "interim",
                "text": transcript,
                "language": _app_language(result.language_code),
            }
