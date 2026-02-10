# Inbound-Inventory-List-and-Invoice-Reconciliation-System-supported-by-Volcano-Engine-

A comprehensive Flask-based web application for automated supermarket inventory reconciliation and electronic invoice verification. Powered by Volcengine AI multi-modal models, this system enables intelligent extraction of product information from inventory lists and electronic invoices, converting them into structured Markdown format, and performing automated cross-validation to identify discrepancies in product names, packaging units, amounts, and quantities.

## Features

- **Multi-Image Upload Support**: Batch upload inventory lists and electronic invoices with drag-and-drop interface
- **AI-Powered OCR**: Leverage Volcengine's Doubao multi-modal model for accurate text extraction from images
- **Markdown Conversion**: Automatically convert extracted information into structured Markdown format
- **Intelligent Reconciliation**: Compare inventory data with invoice information to identify mismatches
- **Real-time Progress Tracking**: Visual progress indicators for all processing operations
- **Interactive Chat Interface**: Ask follow-up questions about reconciliation results
- **Custom Prompts**: Configure custom prompts for each analysis stage
- **Editable Results**: Edit and refine extracted information before final comparison
- **Live Markdown Preview**: Preview rendered Markdown documents with split-pane editor
- **API Key Security**: Secure API key management with visibility toggle
- **Automatic Retry**: Built-in retry mechanism for network resilience
- **Cross-Platform**: Support for development and PyInstaller-packaged environments

## Tech Stack

### Backend
- **Flask** (>= 2.3.0): Web framework
- **Requests** (>= 2.31.0): HTTP client with retry logic
- **python-dotenv** (>= 1.0.0): Environment variable management
- **PyInstaller** (>= 6.0.0): Application packaging

### Frontend
- **HTML5/CSS3**: Modern responsive design with iOS-style UI
- **Vanilla JavaScript**: Client-side functionality
- **Marked.js**: Markdown rendering library

### AI Services
- **Volcengine ARK API**: Multi-modal chat completions
- **Model**: doubao-seed-1-8-251228

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager
- Volcengine API Key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/CNZkeven/Inbound-Inventory-List-and-Invoice-Reconciliation-System-supported-by-Volcano-Engine-
cd Inbound-Inventory-List-and-Invoice-Reconciliation-System-supported-by-Volcano-Engine-
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (optional):
Create a `.env` file in the project root:
```
CONNECT_TIMEOUT_SECONDS=30
VISION_READ_TIMEOUT_SECONDS=180
TEXT_READ_TIMEOUT_SECONDS=600
TEXT_MAX_COMPLETION_TOKENS=8192
```

## Usage

### Running the Application

1. Start the Flask server:
```bash
python app.py
```

2. The application will automatically open in your default browser at `http://127.0.0.1:5000`

3. If the browser doesn't open automatically, manually navigate to `http://127.0.0.1:5000`

### Workflow

1. **Configure API Key**: Enter your Volcengine API Key in the API Settings section

2. **Analyze Inventory List**:
   - Upload one or more inventory list images
   - Review or customize the analysis prompt
   - Click "Analyze Inventory List" to process
   - Edit the extracted results if needed
   - Preview the Markdown document

3. **Analyze Electronic Invoice**:
   - Upload one or more electronic invoice images
   - Review or customize the analysis prompt
   - Click "Analyze Electronic Invoice" to process
   - Edit the extracted results if needed
   - Preview the Markdown document

4. **Reconcile Data**:
   - Click "Sync Data" to load both inventory and invoice information
   - Review or customize the comparison prompt
   - Click "Start Reconciliation" to compare the datasets
   - Review the chat-style reconciliation results
   - Ask follow-up questions if needed

## API Endpoints

### `GET /`
Render the main application interface.

### `POST /api/analyze-inventory`
Analyze inventory list images and extract product information.

**Request Body:**
```json
{
  "api_key": "your_api_key",
  "image": "base64_encoded_image",
  "prompt": "custom_prompt (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "result": "extracted_markdown_content"
}
```

### `POST /api/analyze-invoice`
Analyze electronic invoice images and extract product information.

**Request Body:**
```json
{
  "api_key": "your_api_key",
  "image": "base64_encoded_image",
  "prompt": "custom_prompt (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "result": "extracted_markdown_content"
}
```

### `POST /api/compare`
Compare inventory data with invoice data to identify discrepancies.

**Request Body:**
```json
{
  "api_key": "your_api_key",
  "inventory_data": "inventory_markdown_content",
  "invoice_data": "invoice_markdown_content",
  "prompt": "custom_prompt (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "result": "comparison_analysis_result"
}
```

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### `GET /api/prompts`
Retrieve default prompts for all analysis stages.

**Response:**
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

## Building Executable

To package the application into a standalone executable:

```bash
python build.py
```

The executable will be generated in the `dist/` directory.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONNECT_TIMEOUT_SECONDS` | HTTP connection timeout | 30 |
| `VISION_READ_TIMEOUT_SECONDS` | Timeout for vision API requests | 180 |
| `TEXT_READ_TIMEOUT_SECONDS` | Timeout for text API requests | 600 |
| `TEXT_MAX_COMPLETION_TOKENS` | Maximum tokens for text generation | 8192 |

## Project Structure

```
test/
鈹溾攢鈹€ app.py              # Main Flask application
鈹溾攢鈹€ build.py            # PyInstaller build script
鈹溾攢鈹€ requirements.txt    # Python dependencies
鈹溾攢鈹€ .env.example        # Environment variables template
鈹溾攢鈹€ static/
鈹�   鈹溾攢鈹€ app.js          # Frontend JavaScript
鈹�   鈹斺攢鈹€ style.css       # Stylesheet
鈹溾攢鈹€ templates/
鈹�   鈹斺攢鈹€ index.html      # Main HTML template
鈹斺攢鈹€ README.md           # This file
```

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Automatic retry mechanism with exponential backoff
- **Timeout Errors**: Configurable timeouts with user-friendly error messages
- **API Errors**: Detailed error messages returned to the client
- **Input Validation**: Required field checks for API calls

## Security Notes

- API Keys are stored only in browser session storage (never logged or persisted)
- All API communications are encrypted via HTTPS
- No sensitive data is stored on the server

## Troubleshooting

### Application won't start
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Check if port 5000 is already in use
- Verify Python version is 3.8 or higher

### API requests failing
- Verify your Volcengine API Key is valid
- Check your internet connection
- Review the timeout settings in `.env` if processing large images

### Browser not opening automatically
- The application logs the URL to the console
- Manually navigate to `http://127.0.0.1:5000`

## License

This project is proprietary software. All rights reserved.

## Support

For issues and inquiries, please contact the development team or create an issue in the repository.
