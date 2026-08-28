"""
ai_tutor/translator.py
----------------------
Single public function the rest of the app depends on:

    translate(text, target_language, source_language="en")

Provider:
    Sarvam AI Translation API

Technical terms from ai_tutor/glossary.py are protected from
translation using placeholder tokens and restored afterwards.
"""

import re

from sarvamai import SarvamAI

from ai_tutor import config
from ai_tutor.glossary import TECHNICAL_TERMS

# ---------------------------------------------------------------
# Sarvam client
# ---------------------------------------------------------------

if not config.SARVAM_API_KEY:
    raise RuntimeError(
        "SARVAM_API_KEY is not configured. "
        "Add SARVAM_API_KEY to your .env file."
    )

client = SarvamAI(
    api_subscription_key=config.SARVAM_API_KEY
)


LANGUAGE_CODES = {
    "en": "en-IN",
    "english": "en-IN",

    "hi": "hi-IN",
    "hindi": "hi-IN",

    "te": "te-IN",
    "telugu": "te-IN",

    "ta": "ta-IN",
    "tamil": "ta-IN",

    "bn": "bn-IN",
    "bengali": "bn-IN",

    "mr": "mr-IN",
    "marathi": "mr-IN",

    "gu": "gu-IN",
    "gujarati": "gu-IN",

    "kn": "kn-IN",
    "kannada": "kn-IN",

    "ml": "ml-IN",
    "malayalam": "ml-IN",

    "pa": "pa-IN",
    "punjabi": "pa-IN",

    "or": "od-IN",
    "od": "od-IN",
    "odia": "od-IN",

    "as": "as-IN",
    "assamese": "as-IN",
}

# ---------------------------------------------------------------
# Technical term protection
# ---------------------------------------------------------------

def _protect_terms(text: str):
    """
    Replace technical terms with placeholder tokens so that
    the translation model does not translate them.
    """

    placeholder_map = {}
    protected_text = text

    for i, term in enumerate(
        sorted(TECHNICAL_TERMS, key=len, reverse=True)
    ):
        pattern = re.compile(
            rf"\b{re.escape(term)}\b",
            flags=re.IGNORECASE
        )

        if pattern.search(protected_text):
            token = f"__TERM{i}__"

            placeholder_map[token] = term

            protected_text = pattern.sub(
                token,
                protected_text
            )

    return protected_text, placeholder_map

def _restore_terms(text: str, placeholder_map: dict) -> str:
    """
    Restore original technical terms after translation.
    """

    for token, term in placeholder_map.items():
        text = text.replace(token, term)

    return text

# ---------------------------------------------------------------
# Sarvam Translation
# ---------------------------------------------------------------

def _translate_with_sarvam(
    text: str,
    source_language: str,
    target_language: str
) -> str:

    source_code = LANGUAGE_CODES.get(
        source_language.lower().strip(),
        source_language
    )

    target_code = LANGUAGE_CODES.get(
        target_language.lower().strip(),
        target_language
    )

    # Sarvam Mayura has a 1000-character input limit.
    # Keep a safety margin below the limit.
    MAX_CHARS = 900

    if len(text) <= MAX_CHARS:
        response = client.text.translate(
            input=text,
            source_language_code=source_code,
            target_language_code=target_code,
        )

        return response.translated_text.strip()

    # Split long text into chunks
    chunks = []
    remaining = text

    while len(remaining) > MAX_CHARS:

        # Prefer splitting at a sentence boundary
        split_at = remaining.rfind(". ", 0, MAX_CHARS)

        if split_at == -1:
            split_at = remaining.rfind("\n", 0, MAX_CHARS)

        if split_at == -1:
            split_at = remaining.rfind(" ", 0, MAX_CHARS)

        if split_at == -1:
            split_at = MAX_CHARS
        else:
            split_at += 1

        chunks.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()

    if remaining:
        chunks.append(remaining)

    translated_chunks = []

    for chunk in chunks:
        response = client.text.translate(
            input=chunk,
            source_language_code=source_code,
            target_language_code=target_code,
        )

        translated_chunks.append(
            response.translated_text.strip()
        )

    return "\n\n".join(translated_chunks)

# ---------------------------------------------------------------
# Public API
# ---------------------------------------------------------------

def translate(
    text: str,
    target_language: str,
    source_language: str = "en"
) -> str:
    """
    Translate text from source_language to target_language.

    Examples:

        translate(
            "A transistor is a semiconductor device.",
            "hindi"
        )

        translate(
            "A transistor is a semiconductor device.",
            "te"
        )

    Technical terms defined in glossary.py are preserved.
    """

    if not text:
        return text

    source_normalized = source_language.lower().strip()
    target_normalized = target_language.lower().strip()

    # No translation required
    if source_normalized == target_normalized:
        return text

    # Normalize language codes before comparison
    source_code = LANGUAGE_CODES.get(
        source_normalized,
        source_normalized
    )

    target_code = LANGUAGE_CODES.get(
        target_normalized,
        target_normalized
    )

    if source_code == target_code:
        return text

    # Protect technical terminology
    protected_text, placeholder_map = _protect_terms(text)

    # Translate using Sarvam
    translated = _translate_with_sarvam(
        protected_text,
        source_code,
        target_code
    )

    # Restore technical terms
    return _restore_terms(
        translated,
        placeholder_map
    )


