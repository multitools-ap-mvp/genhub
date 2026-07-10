// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW registration failed:', err));
}

// Tab Navigation
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  if (tabId === 'workflows') loadWorkflows();
}

// Settings Logic
document.getElementById('api-key').value = localStorage.getItem('gemini_api_key') || '';
function saveSettings() {
  const key = document.getElementById('api-key').value.trim();
  localStorage.setItem('gemini_api_key', key);
  alert('Environment saved!');
}

// Workflow Logic
function saveWorkflow() {
  const title = document.getElementById('wf-title').value.trim();
  const prompt = document.getElementById('wf-prompt').value.trim();
  if (!title || !prompt) return alert('Title and prompt required.');

  let workflows = JSON.parse(localStorage.getItem('gemini_workflows') || '[]');
  workflows.push({ title, prompt });
  localStorage.setItem('gemini_workflows', JSON.stringify(workflows));
  
  document.getElementById('wf-title').value = '';
  document.getElementById('wf-prompt').value = '';
  loadWorkflows();
}

function loadWorkflows() {
  const list = document.getElementById('workflow-list');
  list.innerHTML = '';
  const workflows = JSON.parse(localStorage.getItem('gemini_workflows') || '[]');
  
  workflows.forEach((wf, index) => {
    const div = document.createElement('div');
    div.className = 'workflow-item';
    div.innerHTML = `
      <strong>${wf.title}</strong>
      <div>
        <button onclick="loadToGenerator(${index})">Load</button>
        <button onclick="deleteWorkflow(${index})" style="color: #ff5555; border-color: #ff5555;">Delete</button>
      </div>
    `;
    list.appendChild(div);
  });
}

function loadToGenerator(index) {
  const workflows = JSON.parse(localStorage.getItem('gemini_workflows') || '[]');
  document.getElementById('prompt-input').value = workflows[index].prompt;
  showTab('generate');
}

function deleteWorkflow(index) {
  let workflows = JSON.parse(localStorage.getItem('gemini_workflows') || '[]');
  workflows.splice(index, 1);
  localStorage.setItem('gemini_workflows', JSON.stringify(workflows));
  loadWorkflows();
}

// API Generation Logic
let currentImageDataUrl = '';

async function generateImage() {
  const apiKey = localStorage.getItem('gemini_api_key');
  const prompt = document.getElementById('prompt-input').value.trim();
  const statusMsg = document.getElementById('status-msg');
  const imgResult = document.getElementById('image-result');
  const dlBtn = document.getElementById('download-btn');

  if (!apiKey) return alert('Please set your API key in the Environment tab first.');
  if (!prompt) return alert('Please enter a prompt.');

  statusMsg.innerText = 'Sending request to Gemini...';
  imgResult.style.display = 'none';
  dlBtn.style.display = 'none';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
  const payload = {
    instances: [{ prompt: prompt }],
    parameters: { sampleCount: 1, outputOptions: { mimeType: "image/png" } }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const b64Data = data.predictions[0].bytesBase64Encoded;
    
    currentImageDataUrl = `data:image/png;base64,${b64Data}`;
    imgResult.src = currentImageDataUrl;
    imgResult.style.display = 'block';
    dlBtn.style.display = 'inline-block';
    statusMsg.innerText = 'Generation complete!';
    
  } catch (err) {
    statusMsg.innerText = `Error: ${err.message}`;
    console.error(err);
  }
}

function downloadImage() {
  if (!currentImageDataUrl) return;
  const a = document.createElement('a');
  a.href = currentImageDataUrl;
  a.download = `gemini-workflow-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
