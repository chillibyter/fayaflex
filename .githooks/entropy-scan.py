#!/usr/bin/env python3
"""High-entropy secret detector.

Backstop for the regex-based scanner in `.githooks/pre-commit` and
`.github/workflows/secret-scan.yml`. The regex rules only match credentials
with a recognizable prefix (``ya29.``, ``AIza``, ``sk-``, ``gh*_``, ...).
A 40-char random session token, a webhook signing secret, or a custom-format
API key would slip through. This scanner reads a unified diff on stdin and
flags any *newly added* line that contains a long base64-ish token whose
Shannon entropy exceeds the threshold.

Why diff-only and not full-file:
    Existing repo content has already been audited via the one-shot sweep
    documented in ``replit.md``. Re-scanning every blob on every commit /
    every CI run produces a long tail of unfixable historical noise that
    would pressure contributors into ``--no-verify``. We only care about
    what *this commit* introduces.

Allowlist mechanism:
    A single Python module is the source of truth for both the local hook
    and the CI job - no regex list to mirror by hand. False positives are
    handled three ways:
      * ``PATH_ALLOWLIST`` - skip a file entirely (lockfiles, binary
        formats, generated bundles).
      * ``TOKEN_ALLOWLIST`` - skip individual token shapes that look
        random but are not credentials (UUIDs, git SHAs, sha256/sha512
        hex digests, SRI integrity hashes).
      * ``allow-secret`` pragma - any added line containing the comment
        marker ``allow-secret`` (in either ``//`` or ``#`` form) is
        skipped. Use this for hand-vetted in-source false positives, with
        a comment explaining why.

Exit codes:
    0 - no findings
    1 - one or more findings (printed to stdout, with GitHub Actions
        ``::error`` annotations so CI failures link straight to the line)
    2 - usage error
"""

from __future__ import annotations

import math
import re
import sys

MIN_LEN = 24
MAX_LEN = 200
ENTROPY_THRESHOLD = 4.5

# A "token" is a contiguous run of url-safe-base64 characters. We exclude
# ``/`` so URLs and filesystem paths don't get captured as one giant token
# (they generated ~95% of the noise during initial calibration). We also
# exclude ``.`` so long dotted identifiers (package names, fully qualified
# Java class names) don't trip the threshold. Real credential formats
# overwhelmingly use the url-safe alphabet (``-_``) anyway - JWTs, GitHub
# tokens, OpenAI keys, Stripe keys, Slack tokens all avoid ``/``.
TOKEN_RE = re.compile(rb"[A-Za-z0-9+=_\-]{%d,%d}" % (MIN_LEN, MAX_LEN))
HAS_DIGIT_RE = re.compile(rb"\d")
HAS_ALPHA_RE = re.compile(rb"[A-Za-z]")

# Tokens matching any of these are not credentials. Patterns are anchored
# against the full token so a hex prefix on a longer string is not
# accidentally allowlisted.
TOKEN_ALLOWLIST = [
    # UUID v1-v5 (with or without surrounding braces stripped).
    re.compile(rb"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"),
    # Pure hex digests: git SHA-1 (40), sha256 (64), sha512 (128), and the
    # common "long hex blob" shape used for content hashes. Pure hex tops
    # out at 4.0 bits/char so most of these are below threshold anyway,
    # but the explicit allowlist documents intent.
    re.compile(rb"^[0-9a-fA-F]{32,128}$"),
    # SRI / npm integrity hashes: ``sha256-<base64>`` etc.
    re.compile(rb"^sha(256|384|512)-[A-Za-z0-9+/=_\-]+$"),
    # Vite / esbuild chunk hashes embedded in filenames: ``index-aB12cD34``.
    # Already below MIN_LEN in practice (8-10 chars) but harmless to allow.
    re.compile(rb"^[A-Za-z0-9_\-]+-[A-Za-z0-9]{8,10}$"),
    # Build-artifact identifiers: short alpha prefix + long hex digest.
    # Examples: ``App-0ca3007d900a678c2b4d53418799ee3d`` (Xcode build dir),
    # ``Bundle-3b1c0a4f...`` (CodeSign output). Hex tail rules out base64
    # secrets prefixed with ``Foo-``.
    re.compile(rb"^[A-Za-z]{1,12}-[0-9a-fA-F]{16,}$"),
    # Nix store object names: 32-char lowercase base32 + ``-`` + package
    # name. Show up wherever Nix-built tooling logs absolute paths.
    re.compile(rb"^[a-df-np-sv-z0-9]{32}-[A-Za-z0-9_\-.+]+$"),
    # Swift mangled symbol names from iOS crash logs and stack traces:
    # ``_TtC5UIKitP33_DDE14AA6B49FCAFC5A54255A118E1D8713ButtonWrapper``,
    # ``_TtGC5UIKit22UICorePlatformView...``.
    re.compile(rb"^_[Tt][A-Za-z0-9_]{20,}$"),
]

# Files whose entire contents are skipped. Mirrors the SKIP / allowlist
# logic of the regex scanner, plus extra coverage for generated assets
# that legitimately contain high-entropy strings (source maps, base64
# inline images in SVGs, minified bundles, etc).
PATH_ALLOWLIST = re.compile(
    rb"(?x)"
    rb"(^|/)package-lock\.json$"
    rb"|(^|/)pnpm-lock\.yaml$"
    rb"|(^|/)yarn\.lock$"
    rb"|(^|/)\.githooks/(pre-commit|entropy-scan\.py)$"
    rb"|(^|/)\.github/workflows/secret-scan\.yml$"
    rb"|GoogleService-Info.*\.plist$"
    rb"|\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|tgz|mp4|mov|woff2?|ttf|otf"
    rb"|svg|map|min\.js|min\.css|lock|wasm)$"
)

# Per-line escape hatch for documented in-source false positives.
PRAGMA_RE = re.compile(rb"(#|//)\s*allow-secret\b")

# Diff header parsers.
FILE_HEADER_RE = re.compile(rb"^\+\+\+ b/(.*)$")
HUNK_HEADER_RE = re.compile(rb"^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@")


def shannon(data: bytes) -> float:
    """Shannon entropy in bits/char of a byte string."""
    if not data:
        return 0.0
    freq: dict[int, int] = {}
    for b in data:
        freq[b] = freq.get(b, 0) + 1
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in freq.values())


def is_allowlisted_token(tok: bytes) -> bool:
    return any(rx.match(tok) for rx in TOKEN_ALLOWLIST)


def scan_added_line(path: str, lineno: int, line: bytes) -> list[tuple[int, float, str]]:
    """Return findings for a single added line."""
    if PRAGMA_RE.search(line):
        return []
    findings: list[tuple[int, float, str]] = []
    for m in TOKEN_RE.finditer(line):
        tok = m.group(0)
        # Need at least one letter AND one digit. Pure-alpha runs are
        # almost always identifiers; pure-digit runs are timestamps or
        # IDs. Real secrets mix character classes.
        if not (HAS_DIGIT_RE.search(tok) and HAS_ALPHA_RE.search(tok)):
            continue
        if is_allowlisted_token(tok):
            continue
        ent = shannon(tok)
        if ent >= ENTROPY_THRESHOLD:
            preview = tok.decode("ascii", "replace")
            if len(preview) > 60:
                preview = preview[:57] + "..."
            findings.append((lineno, ent, preview))
    return findings


def scan_diff(stream) -> list[tuple[str, int, float, str]]:
    """Walk a unified diff and return ``(path, lineno, entropy, preview)``."""
    current_path: str | None = None
    current_path_skip = False
    new_lineno = 0
    findings: list[tuple[str, int, float, str]] = []

    for raw in stream:
        # Diff is bytes. Strip trailing newline only.
        if raw.endswith(b"\n"):
            raw = raw[:-1]

        # File headers are exactly "+++ <path>" / "--- <path>" (note the
        # required space). Match those *before* checking for added content
        # so a real added line whose content happens to start with "+"
        # (yielding a "++foo" diff line) isn't misclassified as a header.
        if raw.startswith(b"+++ "):
            m = FILE_HEADER_RE.match(raw)
            if m:
                path_b = m.group(1)
                current_path = path_b.decode("utf-8", "replace")
                current_path_skip = bool(PATH_ALLOWLIST.search(path_b))
            else:
                # e.g. "+++ /dev/null" for a pure deletion - no added
                # content will follow in this hunk.
                current_path = None
                current_path_skip = True
            new_lineno = 0
            continue

        if raw.startswith(b"--- "):
            continue

        m = HUNK_HEADER_RE.match(raw)
        if m:
            new_lineno = int(m.group(1)) - 1
            continue

        if current_path is None or current_path_skip:
            continue

        if raw.startswith(b"+"):
            new_lineno += 1
            payload = raw[1:]
            for lineno, ent, preview in scan_added_line(current_path, new_lineno, payload):
                findings.append((current_path, lineno, ent, preview))
        elif raw.startswith(b" "):
            new_lineno += 1
        # Lines starting with '-' don't advance the new-file line counter.

    return findings


def main(argv: list[str]) -> int:
    annotate = "--github" in argv[1:]
    findings = scan_diff(sys.stdin.buffer)
    if not findings:
        return 0

    print("High-entropy secret scan blocked this change.")
    print()
    print(
        "The regex scanner only catches credentials with a known prefix. "
        "These tokens have Shannon entropy >= "
        f"{ENTROPY_THRESHOLD} bits/char and look like random secrets:"
    )
    print()
    for path, lineno, ent, preview in findings:
        print(f"  {path}:{lineno}  entropy={ent:.2f}  {preview}")
        if annotate:
            print(
                f"::error file={path},line={lineno}::"
                f"High-entropy string ({ent:.2f} bits/char): {preview}"
            )
    print()
    print(
        "If this is a real credential: remove it, rotate the underlying secret, "
        "and use Replit Secrets / env vars instead.\n"
        "If this is a documented false positive: add an `allow-secret` comment "
        "on the line (with a justification), or extend TOKEN_ALLOWLIST / "
        "PATH_ALLOWLIST in .githooks/entropy-scan.py."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
