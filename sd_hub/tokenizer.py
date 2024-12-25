from modules.scripts import basedir
from pathlib import Path
import json

token_dir = Path(basedir()) / ".sd-hub-token.json"

def load_token():
    try:
        with open(token_dir, "r", encoding="utf-8") as file:
            value = json.load(file)

        token1 = value.get("huggingface-token-write", "")
        token2 = value.get("huggingface-token-read", "")
        token3 = value.get("civitai-api-key", "")

        msg = []
        title = 'SD-Hub :'
        if token1:
            msg1 = "Huggingface Token (WRITE) loaded"
            msg.append(msg1)
            print(f"{title} {msg1}")

        if token2:
            msg2 = "Huggingface Token (READ) loaded"
            msg.append(msg2)
            print(f"{title} {msg2}")

        if token3:
            msg3 = "Civitai API Key loaded"
            msg.append(msg3)
            print(f"{title} {msg3}")

        if not msg:
            return "", "", "", "No Token Found", "No Token Found"

        joined = "\n".join(msg)
        return token1, token2, token3, joined, joined

    except FileNotFoundError:
        return "", "", "", f"{token_dir.name} Not Found", f"{token_dir.name} Not Found"


def save_token(token1=None, token2=None, token3=None):
    try:
        with open(token_dir, "r", encoding="utf-8") as file:
            value = json.load(file)

    except FileNotFoundError:
        value = {
            "huggingface-token-write": "",
            "huggingface-token-read": "",
            "civitai-api-key": ""
        }

    if token1 is not None:
        value["huggingface-token-write"] = token1
    if token2 is not None:
        value["huggingface-token-read"] = token2
    if token3 is not None:
        value["civitai-api-key"] = token3

    try:
        with open(token_dir, "w", encoding="utf-8") as file:
            json.dump(value, file, indent=4)
        return f"Token Saved To: {token_dir}"

    except Exception as e:
        return f"Error: {e}"
