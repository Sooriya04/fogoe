import { serverTemplates } from './server_templates.js';

// --- MAIN CLI COMMAND COPIER ---
window.copyCommand = function(cmd) {
  navigator.clipboard.writeText(cmd).then(() => {
    showToast(`Copied "${cmd}" to clipboard`);
  }).catch(err => {
    console.error('Failed to copy', err);
  });
};

window.copyCodeContent = function() {
  const codeText = document.getElementById('code-output').innerText;
  navigator.clipboard.writeText(codeText).then(() => {
    showToast('Code copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy code', err);
  });
};

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  toastText.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

// --- INTERACTIVE STACK CONFIGURATOR ---
const configState = {
  language: 'typescript',
  runtime: 'hono',
  arch: 'mvc',
  type: 'esm',
  database: 'prisma'
};

// Directory Tree generator
function getDirectoryTree(state) {
  const isTS = state.language === 'typescript';
  const ext = isTS ? 'ts' : 'js';
  
  const mvcTree = [
    { name: 'your-project/', type: 'folder', depth: 0 },
    { name: 'node_modules/', type: 'folder', depth: 1 },
    { name: 'src/', type: 'folder', depth: 1 },
    ...(state.database !== 'none' ? [{ name: 'config/', type: 'folder', depth: 2 }] : []),
    ...(state.database === 'prisma' ? [{ name: 'db.ts', type: 'file', depth: 3 }] : []),
    ...(state.database === 'mongodb' ? [{ name: 'db.ts', type: 'file', depth: 3 }] : []),
    ...(state.database === 'postgresql' ? [{ name: 'db.ts', type: 'file', depth: 3 }] : []),
    { name: 'controllers/', type: 'folder', depth: 2 },
    { name: `homecontroller.${ext}`, type: 'file', depth: 3 },
    { name: 'middlewares/', type: 'folder', depth: 2 },
    ...(state.database !== 'none' ? [{ name: 'models/', type: 'folder', depth: 2 }, { name: `model.${ext}`, type: 'file', depth: 3 }] : []),
    { name: 'routes/', type: 'folder', depth: 2 },
    { name: `home.${ext}`, type: 'file', depth: 3 },
    { name: 'utils/', type: 'folder', depth: 2 },
    { name: `hashing.${ext}`, type: 'file', depth: 3 },
    { name: `server.${ext}`, type: 'file', depth: 2 },
    ...(state.database === 'prisma' ? [{ name: 'prisma/', type: 'folder', depth: 1 }, { name: 'schema.prisma', type: 'file', depth: 2 }] : []),
    { name: '.env', type: 'file', depth: 1 },
    { name: '.gitignore', type: 'file', depth: 1 },
    { name: 'fogoe.config.json', type: 'file', depth: 1 },
    { name: 'package.json', type: 'file', depth: 1 },
    ...(isTS ? [{ name: 'tsconfig.json', type: 'file', depth: 1 }] : [])
  ];

  const minimalTree = [
    { name: 'your-project/', type: 'folder', depth: 0 },
    { name: 'node_modules/', type: 'folder', depth: 1 },
    { name: 'src/', type: 'folder', depth: 1 },
    { name: `server.${ext}`, type: 'file', depth: 2 },
    { name: '.env', type: 'file', depth: 1 },
    { name: '.gitignore', type: 'file', depth: 1 },
    { name: 'fogoe.config.json', type: 'file', depth: 1 },
    { name: 'package.json', type: 'file', depth: 1 },
    ...(isTS ? [{ name: 'tsconfig.json', type: 'file', depth: 1 }] : [])
  ];

  return state.arch === 'mvc' ? mvcTree : minimalTree;
}

function updateBuilderUI() {
  // Update tree
  const treeOutput = document.getElementById('tree-output');
  treeOutput.innerHTML = '';
  
  const nodes = getDirectoryTree(configState);
  nodes.forEach(node => {
    const el = document.createElement('div');
    el.className = `tree-node depth-${node.depth} ${node.type}`;
    
    let icon = '📄';
    if (node.type === 'folder') {
      icon = '📁';
    } else if (node.name === '.env') {
      icon = '🔒';
    } else if (node.name.endsWith('.json')) {
      icon = '⚙️';
    }
    
    el.innerHTML = `<i>${icon}</i> <span>${node.name}</span>`;
    treeOutput.appendChild(el);
  });

  // Update code view
  const ext = configState.language === 'typescript' ? 'ts' : 'js';
  document.getElementById('file-title').innerText = `src/server.${ext}`;

  try {
    const code = serverTemplates[configState.runtime][configState.language][configState.type][configState.arch];
    document.getElementById('code-output').innerText = code;
  } catch (e) {
    document.getElementById('code-output').innerText = '// Code template not found.';
  }
}

// Bind button clicks in Configurator
document.querySelectorAll('.config-options').forEach(selector => {
  const group = selector.getAttribute('data-group');
  selector.querySelectorAll('.config-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selector.querySelectorAll('.config-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      configState[group] = btn.getAttribute('data-val');
      updateBuilderUI();
    });
  });
});

// Bind preview tab switching
document.querySelectorAll('.display-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.display-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const targetTab = tab.getAttribute('data-tab');
    if (targetTab === 'tree') {
      document.getElementById('pane-tree').classList.add('active');
      document.getElementById('pane-code').classList.remove('active');
    } else {
      document.getElementById('pane-code').classList.add('active');
      document.getElementById('pane-tree').classList.remove('active');
    }
  });
});

// Initial builder setup
updateBuilderUI();
