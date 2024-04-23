from pathlib import Path
from modules import scripts
import json

base_dir = Path(scripts.basedir())
token_dir = (base_dir / "Token.json")

def load_token():
    try:
        with open(token_dir, "r", encoding="utf-8") as file:
            token_data = json.load(file)
        token1 = token_data.get("huggingface-token-write", "")
        token2 = token_data.get("huggingface-token-read", "")
        token3 = token_data.get("civitai-api-key", "")

        notif = []

        if token1:
            notif.append("Huggingface Token (WRITE) loaded")
        if token2:
            notif.append("Huggingface Token (READ) loaded")
        if token3:
            notif.append("Civitai API Key loaded")

        if not notif:
            return "", "", "", "No tokens found", "No tokens found"

        joined_message = "\n".join(notif)
        return token1, token2, token3, joined_message, joined_message

    except FileNotFoundError:
        return "", "", "", "No Token found", "No Token found"
    
def save_token(token1=None, token2=None, token3=None):
    try:
        with open(token_dir, "r", encoding="utf-8") as file:
            token_data = json.load(file)
    except FileNotFoundError:
        token_data = {
            "huggingface-token-write": "",
            "huggingface-token-read": "",
            "civitai-api-key": ""}

    if token1 is not None:
        token_data["huggingface-token-write"] = token1
    if token2 is not None:
        token_data["huggingface-token-read"] = token2
    if token3 is not None:
        token_data["civitai-api-key"] = token3

    try:
        with open(token_dir, "w", encoding="utf-8") as file:
            json.dump(token_data, file, indent=4)
            return f"Token Saved To: {token_dir}"
    except Exception as e:
        return f"Error: {e}"