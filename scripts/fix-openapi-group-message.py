import re
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
current_path = root / "backend_docs" / "current" / "OPENAPI.yaml"
current = current_path.read_text(encoding="utf-8")
head = subprocess.check_output(
    ["git", "show", "HEAD:backend_docs/current/OPENAPI.yaml"],
    text=True,
    encoding="utf-8",
)


def extract_schema(text: str, name: str) -> str | None:
    pat = rf"(    {re.escape(name)}:\n(?:      .*\n|       .*\n)*)"
    match = re.search(pat, text)
    return match.group(1) if match else None


fixed, n = re.subn(
    r"(    GroupMessage:\n(?:      .*\n)*?        attachments:\n)          type: string\n          readOnly: true\n",
    r"""\1          type: array
          items:
            $ref: '#/components/schemas/MessageAttachment'
          readOnly: true
""",
    current,
    count=1,
)
print("attachments fix", n)

fixed, n2 = re.subn(
    r"(        forwarded_from:\n)          type: object\n          additionalProperties: \{\}\n          nullable: true\n          readOnly: true\n",
    r"""\1          allOf:
          - $ref: '#/components/schemas/ForwardedFrom'
          nullable: true
          readOnly: true
""",
    fixed,
    count=1,
)
print("forwarded_from fix", n2)

if "ForwardedFrom:" not in fixed:
    forwarded = extract_schema(head, "ForwardedFrom")
    if not forwarded:
        raise SystemExit("no ForwardedFrom in HEAD")
    fixed = fixed.replace("    GroupMessage:\n", forwarded + "    GroupMessage:\n", 1)
    print("inserted ForwardedFrom")
else:
    print("ForwardedFrom already present")

current_path.write_text(fixed, encoding="utf-8")
print("wrote", current_path)
