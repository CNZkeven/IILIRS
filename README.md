# 基于火山引擎支持的进货清单与发票核对系统 (IILIRS)
# Inbound-Inventory-List-and-Invoice-Reconciliation-System-supported-by-Volcano-Engine-

这是一个基于 Flask 的综合 Web 应用程序，用于自动化的超市库存清单核对与电子发票验证。该系统由火山引擎（Volcengine）AI 多模态模型驱动，能够智能提取库存清单和电子发票中的商品信息，将其转换为结构化的 Markdown 格式，并进行自动交叉验证，以识别商品名称、包装单位、金额和数量上的差异。

## 功能特性

* **多图上传支持**：支持批量上传库存清单和电子发票，具备拖拽上传界面。
* **AI 驱动的 OCR**：利用火山引擎豆包（Doubao）多模态模型，从图像中精确提取文本。
* **Markdown 转换**：自动将提取的信息转换为结构化的 Markdown 格式。
* **智能核对**：对比库存数据与发票信息，精准识别不一致项。
* **实时进度跟踪**：所有处理操作均配备可视化进度指示器。
* **交互式聊天界面**：可针对核对结果进行追问。
* **自定义 Prompt**：支持为每个分析阶段配置自定义提示词（Prompts）。
* **可编辑结果**：在最终比对前，支持手动编辑和优化提取的信息。
* **实时 Markdown 预览**：配备分栏编辑器的渲染预览功能。
* **API 密钥安全**：具备可见性切换的安全 API 密钥管理。
* **自动重试**：内置重试机制，增强网络韧性。
* **跨平台**：支持开发环境和 PyInstaller 打包环境。

## 技术栈

### 后端

* **Flask** (>= 2.3.0): Web 框架
* **Requests** (>= 2.31.0): 带有重试逻辑的 HTTP 客户端
* **python-dotenv** (>= 1.0.0): 环境变量管理
* **PyInstaller** (>= 6.0.0): 应用程序打包

### 前端

* **HTML5/CSS3**: 现代响应式设计，采用 iOS 风格 UI
* **Vanilla JavaScript**: 客户端功能实现
* **Marked.js**: Markdown 渲染库

### AI 服务

* **火山引擎 ARK API**: 多模态对话补全
* **模型**: doubao-seed-1-8-251228

## 安装指南

### 前置条件

* Python 3.8 或更高版本
* pip 包管理器
* 火山引擎 API 密钥（API Key）

### 设置步骤

1. 克隆仓库：

```bash
git clone https://github.com/CNZkeven/IILIRS.git
cd IILIRS

```

2. 安装依赖：

```bash
pip install -r requirements.txt

```

3. 配置环境变量（可选）：
在项目根目录创建 `.env` 文件：

```
CONNECT_TIMEOUT_SECONDS=30
VISION_READ_TIMEOUT_SECONDS=180
TEXT_READ_TIMEOUT_SECONDS=600
TEXT_MAX_COMPLETION_TOKENS=8192

```

## 使用说明

### 运行程序

1. 启动 Flask 服务器：

```bash
python app.py

```

2. 应用程序将在您的默认浏览器中自动打开 `http://127.0.0.1:5000`
3. 如果浏览器未自动打开，请手动访问 `http://127.0.0.1:5000`

### 工作流程

1. **配置 API 密钥**：在 API 设置区块输入您的火山引擎 API Key。
2. **分析库存清单**：
* 上传一张或多张库存清单图片。
* 检查或自定义分析提示词。
* 点击“分析库存清单”进行处理。
* 根据需要编辑提取的结果。
* 预览 Markdown 文档。


3. **分析电子发票**：
* 上传一张或多张电子发票图片。
* 检查或自定义分析提示词。
* 点击“分析电子发票”进行处理。
* 根据需要编辑提取的结果。
* 预览 Markdown 文档。


4. **核对数据**：
* 点击“同步数据”加载库存和发票信息。
* 检查或自定义比对提示词。
* 点击“开始核对”对比数据集。
* 查看对话式核对结果。
* 如有疑问可进行追问。



## API 接口

### `GET /`

渲染主应用界面。

### `POST /api/analyze-inventory`

分析库存清单图片并提取商品信息。

**请求体：**

```json
{
  "api_key": "your_api_key",
  "image": "base64_encoded_image",
  "prompt": "custom_prompt (optional)"
}

```

**响应：**

```json
{
  "success": true,
  "result": "extracted_markdown_content"
}

```

### `POST /api/analyze-invoice`

分析电子发票图片并提取商品信息。

**请求体：**

```json
{
  "api_key": "your_api_key",
  "image": "base64_encoded_image",
  "prompt": "custom_prompt (optional)"
}

```

**响应：**

```json
{
  "success": true,
  "result": "extracted_markdown_content"
}

```

### `POST /api/compare`

对比库存数据与发票数据，识别差异。

**请求体：**

```json
{
  "api_key": "your_api_key",
  "inventory_data": "inventory_markdown_content",
  "invoice_data": "invoice_markdown_content",
  "prompt": "custom_prompt (optional)"
}

```

**响应：**

```json
{
  "success": true,
  "result": "comparison_analysis_result"
}

```

### `GET /api/health`

健康检查接口。

**响应：**

```json
{
  "status": "ok"
}

```

### `GET /api/prompts`

获取所有分析阶段的默认提示词。

**响应：**

```json
{
  "success": true,
  "data": {
    "inventory": "inventory_analysis_prompt",
    "invoice": "invoice_analysis_prompt",
    "compare": "comparison_prompt"
  }
}

```

## 构建可执行文件

如需将应用程序打包成独立的可执行文件：

```bash
python build.py

```

生成的文件将存放于 `dist/` 目录下。

## 环境变量

| 变量名 | 描述 | 默认值 |
| --- | --- | --- |
| `CONNECT_TIMEOUT_SECONDS` | HTTP 连接超时时间 | 30 |
| `VISION_READ_TIMEOUT_SECONDS` | 视觉 API 请求读取超时 | 180 |
| `TEXT_READ_TIMEOUT_SECONDS` | 文本 API 请求读取超时 | 600 |
| `TEXT_MAX_COMPLETION_TOKENS` | 文本生成的最大 Token 数 | 8192 |

## 项目结构

```
test/
app.py              # 主 Flask 应用程序
build.py            # PyInstaller 构建脚本
requirements.txt    # Python 依赖项
.env.example        # 环境变量模板
static/
app.js              # 前端 JavaScript
style.css           # 样式表
templates/
index.html          # 主 HTML 模板
README.md           # 本文件

```

## 错误处理

本程序包含完善的错误处理机制：

* **网络错误**：具有指数退避机制的自动重试。
* **超时错误**：可配置的超时时间，并提供友好的错误提示。
* **API 错误**：向客户端返回详细的错误信息。
* **输入验证**：对 API 调用进行必填字段检查。

## 安全提示

* API 密钥仅存储在浏览器会话（Session Storage）中，绝不记录或持久化。
* 所有 API 通信均通过 HTTPS 加密。
* 服务器端不存储任何敏感数据。

## 故障排除

### 程序无法启动

* 确保已安装所有依赖：`pip install -r requirements.txt`
* 检查 5000 端口是否被占用。
* 确认 Python 版本在 3.8 或以上。

### API 请求失败

* 检查火山引擎 API Key 是否有效。
* 检查网络连接。
* 若处理大图，请检查 `.env` 中的超时设置。

### 浏览器未自动打开

* 程序会在控制台打印访问地址。
* 请手动访问 `http://127.0.0.1:5000`。
