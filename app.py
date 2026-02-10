"""
超市入库清单统计与电子发票核对系统
Flask后端服务
"""

from flask import Flask, render_template, request, jsonify
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import base64
import os
import sys
import webbrowser
import threading
import subprocess
from dotenv import load_dotenv

# 获取资源路径（支持 PyInstaller 打包）
def get_resource_path(relative_path):
    """获取资源文件的绝对路径（支持开发环境和 PyInstaller 打包环境）"""
    if hasattr(sys, '_MEIPASS'):
        # PyInstaller 打包后的临时目录
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

load_dotenv()


def create_session_with_retry():
    """
    创建带有重试机制的requests会话
    """
    session = requests.Session()

    # 配置重试策略
    retry_strategy = Retry(
        total=3,  # 最多重试3次
        backoff_factor=1,  # 重试间隔：1秒、2秒、4秒
        status_forcelist=[429, 500, 502, 503, 504],  # 这些状态码会触发重试
    )

    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    return session

# 获取模板和静态文件夹路径（支持打包）
template_dir = get_resource_path('templates')
static_dir = get_resource_path('static')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

# 火山引擎API配置
ARK_API_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
MODEL_NAME = "doubao-seed-1-8-251228"

# 超时与生成参数（可通过环境变量覆盖）
CONNECT_TIMEOUT_SECONDS = int(os.getenv("CONNECT_TIMEOUT_SECONDS", "30"))
VISION_READ_TIMEOUT_SECONDS = int(os.getenv("VISION_READ_TIMEOUT_SECONDS", "180"))
TEXT_READ_TIMEOUT_SECONDS = int(os.getenv("TEXT_READ_TIMEOUT_SECONDS", "600"))
TEXT_MAX_COMPLETION_TOKENS = int(os.getenv("TEXT_MAX_COMPLETION_TOKENS", "8192"))

# 提示词配置（留空，由用户填写）
PROMPTS = {
    "inventory": """
    你是一位专业的入库清单商品信息提取与格式转换助手，擅长从图片中精准识别并转化关键商品信息。

## 输入：
- 商品信息图片 

## 任务目标：
分析图片中的商品信息各版块，忽略其他不必要信息，将核心商品信息单独转化为md格式的文本。

## 操作步骤：
1. **图片内容识别**：仔细识别图片中的所有可见文本内容，包括文字、数字、符号等。
2. **商品信息筛选**：从识别出的文本中，筛选出与商品直接相关的核心信息版块
3. **无关信息排除**：严格忽略图片中的其它元素、装饰性图案文字、无关标识、冗余说明等不必要信息。
4. **md格式转换**：将筛选后的商品信息按逻辑分类，转化为结构清晰的md格式文本。可使用标题、列表、加粗等md语法优化信息呈现。

## 输出要求：
仅输出转化后的md格式商品信息文本，不包含任何额外解释或说明。

    """,  # 入库清单分析提示词

    "invoice": """
    你是一位专业的电子发票商品信息提取与格式转换助手，擅长从图片中精准识别并转化关键商品信息。

## 输入：
- 商品信息图片 

## 任务目标：
分析图片中的商品信息各版块，忽略其他不必要信息，将核心商品信息单独转化为md格式的文本。

## 操作步骤：
1. **图片内容识别**：仔细识别图片中的所有可见文本内容，包括文字、数字、符号等。
2. **商品信息筛选**：从识别出的文本中，筛选出与商品直接相关的核心信息版块
3. **无关信息排除**：严格忽略图片中的其它元素、装饰性图案文字、无关标识、冗余说明等不必要信息。
4. **md格式转换**：将筛选后的商品信息按逻辑分类，转化为结构清晰的md格式文本。可使用标题、列表、加粗等md语法优化信息呈现。

## 输出要求：
仅输出转化后的md格式商品信息文本，不包含任何额外解释或说明。

    """,  # 电子发票分析提示词

    "compare": """
    将两个板块信息进行一一核对，尤其注意商品名称，包装单位，金额，数量等元素，然后告诉我哪些商品清单信息和发票信息对不上，要求一一对应，不得有任何差错，不允许任何不同，请以会计身份进行任务
    """  # 核对比较提示词
}


def call_vision_api(api_key: str, image_base64: str, prompt: str) -> dict:
    """
    调用火山引擎多模态模型API

    Args:
        api_key: API密钥
        image_base64: Base64编码的图片
        prompt: 提示词

    Returns:
        API响应结果
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # 构建图片URL（data URI格式）
    image_url = f"data:image/jpeg;base64,{image_base64}"

    payload = {
        "model": MODEL_NAME,
        "max_completion_tokens": 65535,
        "reasoning_effort": "minimal",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    }

    try:
        session = create_session_with_retry()
        # 超时设置：(连接超时, 读取超时) - 图片分析需要更长时间
        response = session.post(
            ARK_API_URL,
            headers=headers,
            json=payload,
            timeout=(CONNECT_TIMEOUT_SECONDS, VISION_READ_TIMEOUT_SECONDS)
        )
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except requests.exceptions.Timeout as e:
        return {"success": False, "error": f"请求超时（读取超时 {VISION_READ_TIMEOUT_SECONDS}s），请稍后重试: {str(e)}"}
    except requests.exceptions.ConnectionError as e:
        return {"success": False, "error": f"网络连接错误: {str(e)}"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e)}


def call_text_api(api_key: str, prompt: str, content: str) -> dict:
    """
    调用火山引擎文本模型API（用于核对比较）

    Args:
        api_key: API密钥
        prompt: 提示词
        content: 要分析的内容

    Returns:
        API响应结果
    """
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    full_prompt = f"{prompt}\n\n{content}"

    payload = {
        "model": MODEL_NAME,
        "max_completion_tokens": TEXT_MAX_COMPLETION_TOKENS,
        "reasoning_effort": "minimal",
        "messages": [
            {
                "role": "user",
                "content": full_prompt
            }
        ]
    }

    try:
        session = create_session_with_retry()
        response = session.post(
            ARK_API_URL,
            headers=headers,
            json=payload,
            timeout=(CONNECT_TIMEOUT_SECONDS, TEXT_READ_TIMEOUT_SECONDS)
        )
        response.raise_for_status()
        return {"success": True, "data": response.json()}
    except requests.exceptions.Timeout as e:
        return {"success": False, "error": f"请求超时（读取超时 {TEXT_READ_TIMEOUT_SECONDS}s），请稍后重试: {str(e)}"}
    except requests.exceptions.ConnectionError as e:
        return {"success": False, "error": f"网络连接错误: {str(e)}"}
    except requests.exceptions.RequestException as e:
        return {"success": False, "error": str(e)}


def extract_response_text(api_response: dict) -> str:
    """
    从API响应中提取文本内容

    Args:
        api_response: API响应

    Returns:
        提取的文本内容
    """
    try:
        # 尝试不同的响应格式
        if "output" in api_response:
            output = api_response["output"]
            if isinstance(output, str):
                return output
            if isinstance(output, dict) and "text" in output:
                return output["text"]
            if isinstance(output, list) and len(output) > 0:
                first_output = output[0]
                if isinstance(first_output, dict) and "text" in first_output:
                    return first_output["text"]

        # 尝试 choices 格式
        if "choices" in api_response:
            choices = api_response["choices"]
            if len(choices) > 0:
                message = choices[0].get("message", {})
                return message.get("content", "")

        # 尝试直接获取 content
        if "content" in api_response:
            return api_response["content"]

        return str(api_response)
    except Exception as e:
        return f"解析响应失败: {str(e)}"


@app.route("/")
def index():
    """渲染主页"""
    return render_template("index.html")


@app.route("/api/analyze-inventory", methods=["POST"])
def analyze_inventory():
    """分析入库清单图片"""
    try:
        data = request.get_json()
        api_key = data.get("api_key")
        image_base64 = data.get("image")
        custom_prompt = data.get("prompt", "").strip()

        if not api_key:
            return jsonify({"success": False, "error": "请提供API Key"})

        if not image_base64:
            return jsonify({"success": False, "error": "请上传图片"})

        # 使用自定义提示词或默认提示词
        prompt = custom_prompt if custom_prompt else PROMPTS["inventory"]

        if not prompt.strip():
            return jsonify({"success": False, "error": "请填写入库清单分析提示词"})

        result = call_vision_api(api_key, image_base64, prompt)

        if result["success"]:
            text = extract_response_text(result["data"])
            return jsonify({"success": True, "result": text})
        else:
            return jsonify({"success": False, "error": result["error"]})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/analyze-invoice", methods=["POST"])
def analyze_invoice():
    """分析电子发票图片"""
    try:
        data = request.get_json()
        api_key = data.get("api_key")
        image_base64 = data.get("image")
        custom_prompt = data.get("prompt", "").strip()

        if not api_key:
            return jsonify({"success": False, "error": "请提供API Key"})

        if not image_base64:
            return jsonify({"success": False, "error": "请上传图片"})

        # 使用自定义提示词或默认提示词
        prompt = custom_prompt if custom_prompt else PROMPTS["invoice"]

        if not prompt.strip():
            return jsonify({"success": False, "error": "请填写电子发票分析提示词"})

        result = call_vision_api(api_key, image_base64, prompt)

        if result["success"]:
            text = extract_response_text(result["data"])
            return jsonify({"success": True, "result": text})
        else:
            return jsonify({"success": False, "error": result["error"]})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/compare", methods=["POST"])
def compare_records():
    """核对入库清单与电子发票"""
    try:
        data = request.get_json()
        api_key = data.get("api_key")
        inventory_data = data.get("inventory_data")
        invoice_data = data.get("invoice_data")
        custom_prompt = data.get("prompt", "").strip()

        if not api_key:
            return jsonify({"success": False, "error": "请提供API Key"})

        if not inventory_data:
            return jsonify({"success": False, "error": "请先分析入库清单"})

        if not invoice_data:
            return jsonify({"success": False, "error": "请先分析电子发票"})

        # 使用自定义提示词或默认提示词
        prompt = custom_prompt if custom_prompt else PROMPTS["compare"]

        if not prompt.strip():
            return jsonify({"success": False, "error": "请填写核对比较提示词"})

        # 构建比较内容
        content = f"""
【入库清单信息】
{inventory_data}

【电子发票信息】
{invoice_data}
"""

        result = call_text_api(api_key, prompt, content)

        if result["success"]:
            text = extract_response_text(result["data"])
            return jsonify({"success": True, "result": text})
        else:
            return jsonify({"success": False, "error": result["error"]})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/api/health", methods=["GET"])
def health_check():
    """健康检查接口"""
    return jsonify({"status": "ok"})


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    """获取默认提示词"""
    return jsonify({
        "success": True,
        "data": {
            "inventory": PROMPTS["inventory"].strip(),
            "invoice": PROMPTS["invoice"].strip(),
            "compare": PROMPTS["compare"].strip()
        }
    })


def open_browser():
    """自动打开浏览器访问应用"""
    try:
        url = "http://127.0.0.1:5000"
        if sys.platform == 'win32':
            # Windows 系统使用 subprocess
            os.startfile(url)
        else:
            # 其他系统使用 webbrowser
            webbrowser.open(url)
        print(f"✓ 浏览器已打开: {url}")
    except Exception as e:
        print(f"✗ 打开浏览器失败: {e}")
        print(f"  请手动访问: http://127.0.0.1:5000")


if __name__ == "__main__":
    # 只在主进程中打开浏览器（避免debug模式重启时多次打开）
    import os
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true":
        threading.Timer(2.5, open_browser).start()

    print("\n" + "="*50)
    print("应用已启动！")
    print("="*50)
    print("访问地址: http://127.0.0.1:5000")
    print("="*50 + "\n")

    app.run(debug=True, host="0.0.0.0", port=5000)
