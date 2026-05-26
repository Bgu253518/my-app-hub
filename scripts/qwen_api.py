"""
千问 Qwen3.5-VL API 调用模块
德勤内部部署，兼容 OpenAI SDK 格式

环境变量:
  QWEN_API_KEY / QWEN_BASE_URL / QWEN_MODEL
"""

import json
import os
import sys

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

API_KEY = os.environ.get("QWEN_API_KEY", "ak-FDST94LCXZKfFPl7L5gG9N1a9zgF24LD0GuLSjxTVCfz1BHw")
BASE_URL = os.environ.get("QWEN_BASE_URL", "https://nova.deloitte.com.cn/del/v1")
MODEL = os.environ.get("QWEN_MODEL", "Qwen3.5-VL")


def chat(messages: list, **kwargs) -> str:
    """调用千问对话，返回回复文本"""
    if HAS_OPENAI:
        return _chat_openai(messages, **kwargs)
    return _chat_httpx(messages, **kwargs)


def _chat_openai(messages: list, **kwargs) -> str:
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    resp = client.chat.completions.create(
        model=kwargs.get("model", MODEL),
        messages=messages,
        temperature=kwargs.get("temperature", 0.7),
        max_tokens=kwargs.get("max_tokens", 4096),
    )
    return resp.choices[0].message.content


def _chat_httpx(messages: list, **kwargs) -> str:
    import httpx
    resp = httpx.post(
        f"{BASE_URL.rstrip('/')}/chat/completions",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        json={
            "model": kwargs.get("model", MODEL),
            "messages": messages,
            "temperature": kwargs.get("temperature", 0.7),
            "max_tokens": kwargs.get("max_tokens", 4096),
        },
        verify=False,
        timeout=kwargs.get("timeout", 60),
    )
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def main():
    """命令行入口：python qwen_api.py "你的问题" """
    if len(sys.argv) < 2:
        prompt = sys.stdin.read().strip()
    else:
        prompt = " ".join(sys.argv[1:])

    if not prompt:
        print("用法: python qwen_api.py <你的问题>", file=sys.stderr)
        sys.exit(1)

    result = chat([{"role": "user", "content": prompt}])
    print(result)


if __name__ == "__main__":
    main()
