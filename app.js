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
  const prompt = document.getElementById('prompt-input').value.trim();
  const statusMsg = document.getElementById('status-msg');
  const imgResult = document.getElementById('image-result');
  const dlBtn = document.getElementById('download-btn');

  if (!prompt) return alert('Please enter a prompt.');

  statusMsg.innerText = 'Sending request to secure backend...';
  imgResult.style.display = 'none';
  dlBtn.style.display = 'none';

  try {
    // Notice we are now fetching from our own Cloudflare Function, NOT Google directly
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.error || 'API request failed');
    }

    // Extract the image from the returned JSON
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
