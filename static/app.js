/**
 * 超市入库清单核对系统 - 前端交互逻辑
 */

// 全局状态
const state = {
    inventoryImages: [],  // 多图片支持
    invoiceImages: [],    // 多图片支持
    inventoryResult: '',
    invoiceResult: '',
    chatHistory: [],      // 聊天历史
    syncedInventoryData: '',  // 同步的入库清单数据
    syncedInvoiceData: ''     // 同步的电子发票数据
};

// DOM 元素缓存
const elements = {
    apiKey: () => document.getElementById('apiKey'),
    inventoryImageInput: () => document.getElementById('inventoryImageInput'),
    invoiceImageInput: () => document.getElementById('invoiceImageInput'),
    inventoryPreviewList: () => document.getElementById('inventoryPreviewList'),
    invoicePreviewList: () => document.getElementById('invoicePreviewList'),
    inventoryImageCount: () => document.getElementById('inventoryImageCount'),
    invoiceImageCount: () => document.getElementById('invoiceImageCount'),
    inventoryPrompt: () => document.getElementById('inventoryPrompt'),
    invoicePrompt: () => document.getElementById('invoicePrompt'),
    comparePrompt: () => document.getElementById('comparePrompt'),
    inventoryResultArea: () => document.getElementById('inventoryResultArea'),
    invoiceResultArea: () => document.getElementById('invoiceResultArea'),
    inventoryResult: () => document.getElementById('inventoryResult'),
    invoiceResult: () => document.getElementById('invoiceResult'),
    inventoryProgress: () => document.getElementById('inventoryProgress'),
    invoiceProgress: () => document.getElementById('invoiceProgress'),
    compareProgress: () => document.getElementById('compareProgress'),
    inventoryProgressText: () => document.getElementById('inventoryProgressText'),
    invoiceProgressText: () => document.getElementById('invoiceProgressText'),
    compareProgressText: () => document.getElementById('compareProgressText'),
    inventoryProgressPercent: () => document.getElementById('inventoryProgressPercent'),
    invoiceProgressPercent: () => document.getElementById('invoiceProgressPercent'),
    compareProgressPercent: () => document.getElementById('compareProgressPercent'),
    inventoryProgressFill: () => document.getElementById('inventoryProgressFill'),
    invoiceProgressFill: () => document.getElementById('invoiceProgressFill'),
    compareProgressFill: () => document.getElementById('compareProgressFill'),
    inventorySyncStatus: () => document.getElementById('inventorySyncStatus'),
    invoiceSyncStatus: () => document.getElementById('invoiceSyncStatus'),
    inventorySyncPreview: () => document.getElementById('inventorySyncPreview'),
    invoiceSyncPreview: () => document.getElementById('invoiceSyncPreview'),
    chatContainer: () => document.getElementById('chatContainer'),
    chatMessages: () => document.getElementById('chatMessages'),
    chatInput: () => document.getElementById('chatInput'),
    loadingOverlay: () => document.getElementById('loadingOverlay'),
    loadingText: () => document.getElementById('loadingText'),
    toast: () => document.getElementById('toast')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    loadSavedData();
});

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 图片上传事件
    elements.inventoryImageInput().addEventListener('change', (e) => handleImageUpload(e, 'inventory'));
    elements.invoiceImageInput().addEventListener('change', (e) => handleImageUpload(e, 'invoice'));

    // 拖拽上传支持
    setupDragAndDrop('inventoryUploadArea', 'inventory');
    setupDragAndDrop('invoiceUploadArea', 'invoice');

    // 聊天输入框回车发送
    elements.chatInput().addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // 结果编辑时自动同步
    elements.inventoryResult().addEventListener('input', () => {
        state.inventoryResult = elements.inventoryResult().value;
        updateSyncPreview();
    });

    elements.invoiceResult().addEventListener('input', () => {
        state.invoiceResult = elements.invoiceResult().value;
        updateSyncPreview();
    });

    // 提示词修改时自动保存
    elements.inventoryPrompt().addEventListener('input', () => {
        saveData();
    });

    elements.invoicePrompt().addEventListener('input', () => {
        saveData();
    });

    elements.comparePrompt().addEventListener('input', () => {
        saveData();
    });
}

/**
 * 设置拖拽上传
 */
function setupDragAndDrop(areaId, type) {
    const area = document.getElementById(areaId);
    if (!area) return;

    const placeholder = area.querySelector('.upload-placeholder');

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        placeholder.classList.add('drag-over');
    });

    area.addEventListener('dragleave', () => {
        placeholder.classList.remove('drag-over');
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        placeholder.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            processImageFiles(files, type);
        }
    });
}

/**
 * 处理图片上传（支持多图片）
 */
function handleImageUpload(event, type) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
        processImageFiles(files, type);
    }
}

/**
 * 处理多个图片文件
 */
function processImageFiles(files, type) {
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            const dataUrl = e.target.result;

            const imageData = {
                id: Date.now() + index,
                base64: base64,
                dataUrl: dataUrl,
                name: file.name
            };

            if (type === 'inventory') {
                state.inventoryImages.push(imageData);
                renderImagePreviews('inventory');
            } else {
                state.invoiceImages.push(imageData);
                renderImagePreviews('invoice');
            }
        };
        reader.readAsDataURL(file);
    });

    showToast(`已添加 ${files.length} 张图片`);
}

/**
 * 渲染图片预览列表
 */
function renderImagePreviews(type) {
    const images = type === 'inventory' ? state.inventoryImages : state.invoiceImages;
    const container = type === 'inventory' ? elements.inventoryPreviewList() : elements.invoicePreviewList();
    const countElement = type === 'inventory' ? elements.inventoryImageCount() : elements.invoiceImageCount();

    container.innerHTML = images.map((img, index) => `
        <div class="image-preview-item">
            <img src="${img.dataUrl}" alt="图片${index + 1}">
            <button class="ios-btn-icon remove-btn" onclick="removeImage('${type}', ${img.id})">&#10005;</button>
            <span class="image-index">${index + 1}</span>
        </div>
    `).join('');

    countElement.textContent = `${images.length} 张图片`;
}

/**
 * 移除已上传的图片
 */
function removeImage(type, imageId) {
    if (type === 'inventory') {
        state.inventoryImages = state.inventoryImages.filter(img => img.id !== imageId);
        renderImagePreviews('inventory');
    } else {
        state.invoiceImages = state.invoiceImages.filter(img => img.id !== imageId);
        renderImagePreviews('invoice');
    }
    showToast('已移除图片');
}

/**
 * 切换 API Key 可见性
 */
function toggleApiKeyVisibility() {
    const input = elements.apiKey();
    const btn = input.nextElementSibling;
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '隐藏';
    } else {
        input.type = 'password';
        btn.textContent = '显示';
    }
}

/**
 * 显示/更新进度条
 */
function updateProgress(type, percent, text) {
    const progressContainer = type === 'inventory' ? elements.inventoryProgress() :
                              type === 'invoice' ? elements.invoiceProgress() :
                              elements.compareProgress();
    const progressText = type === 'inventory' ? elements.inventoryProgressText() :
                         type === 'invoice' ? elements.invoiceProgressText() :
                         elements.compareProgressText();
    const progressPercent = type === 'inventory' ? elements.inventoryProgressPercent() :
                            type === 'invoice' ? elements.invoiceProgressPercent() :
                            elements.compareProgressPercent();
    const progressFill = type === 'inventory' ? elements.inventoryProgressFill() :
                         type === 'invoice' ? elements.invoiceProgressFill() :
                         elements.compareProgressFill();

    progressContainer.style.display = 'block';
    progressText.textContent = text;
    progressPercent.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
}

/**
 * 隐藏进度条
 */
function hideProgress(type) {
    const progressContainer = type === 'inventory' ? elements.inventoryProgress() :
                              type === 'invoice' ? elements.invoiceProgress() :
                              elements.compareProgress();
    progressContainer.style.display = 'none';
}

/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
    const toast = elements.toast();
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

/**
 * 获取 API Key
 */
function getApiKey() {
    return elements.apiKey().value.trim();
}

/**
 * 分析入库清单（支持多图片）
 */
async function analyzeInventory() {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('请先输入 API Key');
        return;
    }

    if (state.inventoryImages.length === 0) {
        showToast('请先上传入库清单图片');
        return;
    }

    const prompt = elements.inventoryPrompt().value.trim();
    if (!prompt) {
        showToast('请填写入库清单分析提示词');
        return;
    }

    const totalImages = state.inventoryImages.length;
    let allResults = [];

    updateProgress('inventory', 0, `准备分析 ${totalImages} 张图片...`);

    try {
        for (let i = 0; i < totalImages; i++) {
            const image = state.inventoryImages[i];
            const percent = Math.round(((i + 0.5) / totalImages) * 100);
            updateProgress('inventory', percent, `正在分析第 ${i + 1}/${totalImages} 张图片...`);

            const response = await fetch('/api/analyze-inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    image: image.base64,
                    prompt: prompt
                })
            });

            const data = await response.json();

            if (data.success) {
                allResults.push(`### 图片 ${i + 1} 分析结果\n${data.result}`);
            } else {
                allResults.push(`### 图片 ${i + 1} 分析失败\n错误: ${data.error}`);
            }

            updateProgress('inventory', Math.round(((i + 1) / totalImages) * 100), `已完成 ${i + 1}/${totalImages} 张图片`);
        }

        const combinedResult = allResults.join('\n\n---\n\n');
        state.inventoryResult = combinedResult;
        elements.inventoryResult().value = combinedResult;
        elements.inventoryResultArea().style.display = 'block';

        updateSyncPreview();
        showPreviewButton('inventory');
        showToast('入库清单分析完成');
        saveData();

    } catch (error) {
        showToast(`请求失败: ${error.message}`);
    } finally {
        hideProgress('inventory');
    }
}

/**
 * 分析电子发票（支持多图片）
 */
async function analyzeInvoice() {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('请先输入 API Key');
        return;
    }

    if (state.invoiceImages.length === 0) {
        showToast('请先上传电子发票图片');
        return;
    }

    const prompt = elements.invoicePrompt().value.trim();
    if (!prompt) {
        showToast('请填写电子发票分析提示词');
        return;
    }

    const totalImages = state.invoiceImages.length;
    let allResults = [];

    updateProgress('invoice', 0, `准备分析 ${totalImages} 张图片...`);

    try {
        for (let i = 0; i < totalImages; i++) {
            const image = state.invoiceImages[i];
            const percent = Math.round(((i + 0.5) / totalImages) * 100);
            updateProgress('invoice', percent, `正在分析第 ${i + 1}/${totalImages} 张图片...`);

            const response = await fetch('/api/analyze-invoice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: apiKey,
                    image: image.base64,
                    prompt: prompt
                })
            });

            const data = await response.json();

            if (data.success) {
                allResults.push(`### 图片 ${i + 1} 分析结果\n${data.result}`);
            } else {
                allResults.push(`### 图片 ${i + 1} 分析失败\n错误: ${data.error}`);
            }

            updateProgress('invoice', Math.round(((i + 1) / totalImages) * 100), `已完成 ${i + 1}/${totalImages} 张图片`);
        }

        const combinedResult = allResults.join('\n\n---\n\n');
        state.invoiceResult = combinedResult;
        elements.invoiceResult().value = combinedResult;
        elements.invoiceResultArea().style.display = 'block';

        updateSyncPreview();
        showPreviewButton('invoice');
        showToast('电子发票分析完成');
        saveData();

    } catch (error) {
        showToast(`请求失败: ${error.message}`);
    } finally {
        hideProgress('invoice');
    }
}

/**
 * 更新同步预览区域
 */
function updateSyncPreview() {
    const inventoryData = elements.inventoryResult().value || state.inventoryResult;
    const invoiceData = elements.invoiceResult().value || state.invoiceResult;

    // 更新入库清单预览
    if (inventoryData) {
        elements.inventorySyncPreview().textContent = inventoryData.substring(0, 200) + (inventoryData.length > 200 ? '...' : '');
        elements.inventorySyncStatus().textContent = '已就绪';
        elements.inventorySyncStatus().classList.add('synced');
        state.syncedInventoryData = inventoryData;
    } else {
        elements.inventorySyncPreview().textContent = '暂无数据，请先分析入库清单';
        elements.inventorySyncStatus().textContent = '未同步';
        elements.inventorySyncStatus().classList.remove('synced');
        state.syncedInventoryData = '';
    }

    // 更新电子发票预览
    if (invoiceData) {
        elements.invoiceSyncPreview().textContent = invoiceData.substring(0, 200) + (invoiceData.length > 200 ? '...' : '');
        elements.invoiceSyncStatus().textContent = '已就绪';
        elements.invoiceSyncStatus().classList.add('synced');
        state.syncedInvoiceData = invoiceData;
    } else {
        elements.invoiceSyncPreview().textContent = '暂无数据，请先分析电子发票';
        elements.invoiceSyncStatus().textContent = '未同步';
        elements.invoiceSyncStatus().classList.remove('synced');
        state.syncedInvoiceData = '';
    }
}

/**
 * 手动同步数据
 */
function syncData() {
    updateSyncPreview();
    showToast('数据已同步');
}

/**
 * 核对比较
 */
async function compareRecords() {
    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('请先输入 API Key');
        return;
    }

    // 获取最新的编辑后数据
    const inventoryData = elements.inventoryResult().value || state.inventoryResult;
    const invoiceData = elements.invoiceResult().value || state.invoiceResult;

    if (!inventoryData) {
        showToast('请先分析入库清单');
        return;
    }

    if (!invoiceData) {
        showToast('请先分析电子发票');
        return;
    }

    const prompt = elements.comparePrompt().value.trim();
    if (!prompt) {
        showToast('请填写核对比较提示词');
        return;
    }

    // 更新同步数据
    state.syncedInventoryData = inventoryData;
    state.syncedInvoiceData = invoiceData;
    updateSyncPreview();

    updateProgress('compare', 30, '正在准备数据...');

    try {
        updateProgress('compare', 60, '正在进行核对分析...');

        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                inventory_data: inventoryData,
                invoice_data: invoiceData,
                prompt: prompt
            })
        });

        updateProgress('compare', 90, '正在处理结果...');

        const data = await response.json();

        if (data.success) {
            // 显示聊天框并添加消息
            elements.chatContainer().style.display = 'block';

            // 添加系统消息
            addChatMessage('assistant', data.result);

            // 保存到聊天历史
            state.chatHistory.push({
                role: 'assistant',
                content: data.result,
                timestamp: new Date().toISOString()
            });

            showPreviewButton('compare');
            showToast('核对完成');
            saveData();
        } else {
            showToast(`核对失败: ${data.error}`);
        }
    } catch (error) {
        showToast(`请求失败: ${error.message}`);
    } finally {
        hideProgress('compare');
    }
}

/**
 * 添加聊天消息到界面
 */
function addChatMessage(role, content) {
    const messagesContainer = elements.chatMessages();
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    // 使用统一的 Markdown 渲染函数，确保聊天区与预览区行为一致
    const renderedContent = markdownToHtml(content);

    const messageHtml = `
        <div class="chat-message ${role}">
            <div class="message-content">${renderedContent}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * 添加打字指示器
 */
function addTypingIndicator() {
    const messagesContainer = elements.chatMessages();
    const indicatorHtml = `
        <div class="chat-message assistant" id="typingIndicator">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    messagesContainer.insertAdjacentHTML('beforeend', indicatorHtml);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * 移除打字指示器
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * 发送聊天消息（追问）
 */
async function sendChatMessage() {
    const input = elements.chatInput();
    const message = input.value.trim();

    if (!message) return;

    const apiKey = getApiKey();
    if (!apiKey) {
        showToast('请先输入 API Key');
        return;
    }

    // 添加用户消息
    addChatMessage('user', message);
    state.chatHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
    });

    input.value = '';

    // 显示打字指示器
    addTypingIndicator();

    try {
        // 构建上下文
        const context = `
【入库清单信息】
${state.syncedInventoryData}

【电子发票信息】
${state.syncedInvoiceData}

【之前的对话】
${state.chatHistory.slice(-6).map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n')}

【用户追问】
${message}
`;

        const response = await fetch('/api/compare', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: apiKey,
                inventory_data: state.syncedInventoryData,
                invoice_data: state.syncedInvoiceData,
                prompt: `基于以下信息回答用户的问题:\n${context}`
            })
        });

        const data = await response.json();

        removeTypingIndicator();

        if (data.success) {
            addChatMessage('assistant', data.result);
            state.chatHistory.push({
                role: 'assistant',
                content: data.result,
                timestamp: new Date().toISOString()
            });
            saveData();
        } else {
            addChatMessage('assistant', `抱歉，处理失败: ${data.error}`);
        }
    } catch (error) {
        removeTypingIndicator();
        addChatMessage('assistant', `请求失败: ${error.message}`);
    }
}

/**
 * 清空聊天记录
 */
function clearChat() {
    state.chatHistory = [];
    elements.chatMessages().innerHTML = '';
    showToast('聊天记录已清空');
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
}

/**
 * 文本转义并保留换行
 */
function escapeHtmlWithBreaks(text) {
    return escapeHtml(text).replace(/\n/g, '<br>');
}

/**
 * 统一 Markdown 渲染
 */
function markdownToHtml(content) {
    const source = typeof content === 'string' ? content : String(content ?? '');

    if (typeof marked === 'undefined') {
        return escapeHtmlWithBreaks(source);
    }

    const markedOptions = {
        breaks: true,
        gfm: true
    };

    try {
        if (marked.parse) {
            return marked.parse(source, markedOptions);
        }
        if (marked.setOptions) {
            marked.setOptions(markedOptions);
            return marked(source);
        }
        return marked(source);
    } catch (error) {
        console.error('Markdown 渲染出错:', error);
        return escapeHtmlWithBreaks(source);
    }
}

/**
 * 复制结果
 */
function copyResult(type) {
    let content = '';
    if (type === 'inventory') {
        content = elements.inventoryResult().value;
    } else if (type === 'invoice') {
        content = elements.invoiceResult().value;
    }

    if (content) {
        navigator.clipboard.writeText(content).then(() => {
            showToast('已复制到剪贴板');
        }).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            showToast('已复制到剪贴板');
        });
    }
}

/**
 * 保存修改后的结果
 */
function saveResult(type) {
    if (type === 'inventory') {
        state.inventoryResult = elements.inventoryResult().value;
    } else if (type === 'invoice') {
        state.invoiceResult = elements.invoiceResult().value;
    }
    updateSyncPreview();
    saveData();
    showToast('修改已保存');
}

/**
 * 保存数据到本地存储
 */
function saveData() {
    const data = {
        inventoryResult: state.inventoryResult,
        invoiceResult: state.invoiceResult,
        inventoryPrompt: elements.inventoryPrompt().value,
        invoicePrompt: elements.invoicePrompt().value,
        comparePrompt: elements.comparePrompt().value,
        chatHistory: state.chatHistory.slice(-20)  // 只保存最近20条
    };
    localStorage.setItem('invoiceCheckData', JSON.stringify(data));
}

/**
 * 从本地存储加载数据
 */
async function loadSavedData() {
    // 先从后端获取默认提示词
    await loadDefaultPrompts();

    try {
        const saved = localStorage.getItem('invoiceCheckData');
        if (saved) {
            const data = JSON.parse(saved);

            // 优先使用本地存储的提示词（如果用户修改过）
            if (data.inventoryPrompt) {
                elements.inventoryPrompt().value = data.inventoryPrompt;
            }
            if (data.invoicePrompt) {
                elements.invoicePrompt().value = data.invoicePrompt;
            }
            if (data.comparePrompt) {
                elements.comparePrompt().value = data.comparePrompt;
            }

            // 恢复分析结果
            if (data.inventoryResult) {
                state.inventoryResult = data.inventoryResult;
                elements.inventoryResult().value = data.inventoryResult;
                elements.inventoryResultArea().style.display = 'block';
                showPreviewButton('inventory');
            }
            if (data.invoiceResult) {
                state.invoiceResult = data.invoiceResult;
                elements.invoiceResult().value = data.invoiceResult;
                elements.invoiceResultArea().style.display = 'block';
                showPreviewButton('invoice');
            }

            // 恢复聊天历史
            if (data.chatHistory && data.chatHistory.length > 0) {
                state.chatHistory = data.chatHistory;
                elements.chatContainer().style.display = 'block';
                data.chatHistory.forEach(msg => {
                    addChatMessage(msg.role, msg.content);
                });
                showPreviewButton('compare');
            }

            // 更新同步预览
            updateSyncPreview();
        }
    } catch (error) {
        console.error('加载保存数据失败:', error);
    }
}

/**
 * 从后端加载默认提示词
 */
async function loadDefaultPrompts() {
    try {
        const response = await fetch('/api/prompts');
        const data = await response.json();

        if (data.success && data.data) {
            // 只在输入框为空时填充默认值（避免覆盖用户输入）
            if (!elements.inventoryPrompt().value.trim()) {
                elements.inventoryPrompt().value = data.data.inventory || '';
            }
            if (!elements.invoicePrompt().value.trim()) {
                elements.invoicePrompt().value = data.data.invoice || '';
            }
            if (!elements.comparePrompt().value.trim()) {
                elements.comparePrompt().value = data.data.compare || '';
            }
        }
    } catch (error) {
        console.error('加载默认提示词失败:', error);
    }
}

// ===================== MD 预览模态框功能 =====================

// 当前预览的板块类型
let currentPreviewType = '';

/**
 * 打开预览模态框
 */
function openPreviewModal(type) {
    currentPreviewType = type;
    const modal = document.getElementById('previewModalOverlay');
    const editor = document.getElementById('previewEditor');
    const title = document.getElementById('previewModalTitle');

    // 设置标题
    const titles = {
        'inventory': '入库清单 - MD 文档预览',
        'invoice': '电子发票 - MD 文档预览',
        'compare': '核对结果 - MD 文档预览'
    };
    title.textContent = titles[type] || 'MD 文档预览';

    // 获取对应板块的内容
    let content = '';
    if (type === 'inventory') {
        content = elements.inventoryResult().value || state.inventoryResult;
    } else if (type === 'invoice') {
        content = elements.invoiceResult().value || state.invoiceResult;
    } else if (type === 'compare') {
        // 从聊天历史中获取最新的助手消息
        content = getCompareResultContent();
    }

    editor.value = content;

    // 渲染预览
    renderMarkdownPreview(content);

    // 显示模态框
    modal.style.display = 'flex';

    // 绑定实时预览事件 - 使用相同的函数引用以便后续移除
    editor._previewHandler = handlePreviewEditorInput;
    editor.addEventListener('input', editor._previewHandler);

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭预览模态框
 */
function closePreviewModal() {
    const modal = document.getElementById('previewModalOverlay');
    const editor = document.getElementById('previewEditor');

    // 移除事件监听器 - 使用相同的函数引用
    if (editor._previewHandler) {
        editor.removeEventListener('input', editor._previewHandler);
        delete editor._previewHandler;
    }

    // 隐藏模态框
    modal.style.display = 'none';

    // 恢复背景滚动
    document.body.style.overflow = '';

    currentPreviewType = '';
}

/**
 * 处理预览编辑器输入事件（实时预览）
 */
function handlePreviewEditorInput(e) {
    const content = e.target.value;
    renderMarkdownPreview(content);
}

/**
 * 渲染 Markdown 预览
 */
function renderMarkdownPreview(content) {
    const renderPane = document.getElementById('previewRender');

    if (!content || content.trim() === '') {
        renderPane.innerHTML = '<p style="color: var(--ios-gray); text-align: center; padding: 40px;">暂无内容，请在左侧编辑区输入 Markdown 文本</p>';
        return;
    }

    try {
        renderPane.innerHTML = markdownToHtml(content);
    } catch (error) {
        console.error('Markdown 渲染出错:', error);
        renderPane.innerHTML = `<p style="color: var(--ios-red);">渲染出错: ${escapeHtml(error.message)}</p><pre style="white-space: pre-wrap; word-break: break-word; margin-top: 10px;">${escapeHtml(content)}</pre>`;
    }
}

/**
 * 保存预览内容到对应板块
 */
function savePreviewContent() {
    const editor = document.getElementById('previewEditor');
    const content = editor.value;

    if (currentPreviewType === 'inventory') {
        elements.inventoryResult().value = content;
        state.inventoryResult = content;
        updateSyncPreview();
        saveData();
        showToast('入库清单内容已保存');
    } else if (currentPreviewType === 'invoice') {
        elements.invoiceResult().value = content;
        state.invoiceResult = content;
        updateSyncPreview();
        saveData();
        showToast('电子发票内容已保存');
    } else if (currentPreviewType === 'compare') {
        // 核对结果保存到聊天历史（更新最后一条助手消息）
        updateCompareResultContent(content);
        showToast('核对结果已保存');
    }
}

/**
 * 获取核对结果内容（从聊天历史）
 */
function getCompareResultContent() {
    // 找到最后一条助手消息
    for (let i = state.chatHistory.length - 1; i >= 0; i--) {
        if (state.chatHistory[i].role === 'assistant') {
            return state.chatHistory[i].content;
        }
    }
    return '';
}

/**
 * 更新核对结果内容
 */
function updateCompareResultContent(content) {
    // 更新最后一条助手消息
    for (let i = state.chatHistory.length - 1; i >= 0; i--) {
        if (state.chatHistory[i].role === 'assistant') {
            state.chatHistory[i].content = content;
            break;
        }
    }

    // 重新渲染聊天消息
    const messagesContainer = elements.chatMessages();
    const messages = messagesContainer.querySelectorAll('.chat-message.assistant .message-content');
    if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        lastMessage.innerHTML = markdownToHtml(content);
    }

    saveData();
}

/**
 * 显示预览按钮
 */
function showPreviewButton(type) {
    const btnId = type + 'PreviewBtn';
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.style.display = 'flex';
    }
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    const modal = document.getElementById('previewModalOverlay');
    if (e.target === modal) {
        closePreviewModal();
    }
});

// ESC 键关闭模态框
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('previewModalOverlay');
        if (modal && modal.style.display === 'flex') {
            closePreviewModal();
        }
    }
});
