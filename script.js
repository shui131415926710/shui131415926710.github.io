let currentTab = '';
let bgIndex = 0;
let bgImages = [];
const BG_SWITCH_TIME = 5000; // 背景切换间隔：5秒
let allTimelineItems = []; // 新增：存储所有时间线数据，用于搜索

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  renderAllItems();
  initBackgroundSlider();
  startBackgroundSlider();
  bindAllEvents(); // 绑定所有点击事件
});

// ========== 动态背景核心功能 ==========
function initBackgroundSlider() {
  const userImages = JSON.parse(localStorage.getItem('starry_image') || '[]');
  bgImages = userImages.map(item => item.src);
}

function startBackgroundSlider() {
  if (bgImages.length === 0) return;
  const bgElement = document.getElementById('user-img-bg');
  
  setInterval(() => {
    bgIndex = (bgIndex + 1) % bgImages.length;
    bgElement.style.opacity = 0;
    setTimeout(() => {
      bgElement.style.backgroundImage = `url(${bgImages[bgIndex]})`;
      bgElement.style.opacity = 0.3;
    }, 1500);
  }, BG_SWITCH_TIME);
}

// ========== 事件绑定核心 ==========
function bindAllEvents() {
  // 标签栏点击事件
  document.getElementById('tab-bar').addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn) return;

    // 移除所有激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    const tabType = tabBtn.getAttribute('data-tab');
    if (tabType === 'timeline-tab') {
      openTimeline();
    } else {
      openTab(tabType);
    }
  });

  // 返回按钮点击
  document.getElementById('back-btn').addEventListener('click', closeTimeline);

  // 关闭弹窗按钮
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal');
      closeModal(modalId);
    });
  });

  // 保存按钮点击
  document.getElementById('save-image-btn').addEventListener('click', saveImage);
  document.getElementById('save-note-btn').addEventListener('click', saveNote);
  document.getElementById('save-video-btn').addEventListener('click', saveVideo);
  document.getElementById('save-music-btn').addEventListener('click', saveMusic);

  // 文件上传预览
  document.getElementById('image-upload').addEventListener('change', handleImageUpload);
  document.getElementById('video-upload').addEventListener('change', handleVideoUpload);
  document.getElementById('music-upload').addEventListener('change', handleMusicUpload);

  // 新增：时间线搜索事件
  document.getElementById('search-date-btn').addEventListener('click', searchTimelineByDate);
  document.getElementById('reset-search-btn').addEventListener('click', resetTimelineSearch);
  
  // 支持回车触发搜索
  document.getElementById('timeline-search-date').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchTimelineByDate();
    }
  });
}

// ========== 标签切换功能（核心修复） ==========
function openTab(tabId) {
  // 类型名称映射（解决英文占位符）
  const typeMap = {
    'image': '图片',
    'note': '笔记',
    'video': '视频',
    'music': '音乐'
  };
  // 弹窗ID映射（解决空元素报错）
  const modalIdMap = {
    'image-tab': 'image-modal',
    'note-tab': 'note-modal',
    'video-tab': 'video-modal',
    'music-tab': 'music-modal'
  };

  currentTab = tabId;
  document.getElementById('timeline-view').style.display = 'none';
  const container = document.getElementById('main-container');
  container.style.display = 'grid';

  const items = getStoredItems(tabId);
  const typeName = tabId.split('-')[0];
  const chineseTypeName = typeMap[typeName] || typeName;
  if (items.length === 0) {
    container.innerHTML = `<p class="empty-tip">暂无${chineseTypeName}记录，点击弹窗添加吧 ✨</p>`;
  } else {
    renderItems(tabId);
  }

  // 安全打开弹窗（避免空元素）
  const targetModalId = modalIdMap[tabId];
  if (targetModalId) {
    const modal = document.getElementById(targetModalId);
    if (modal) modal.style.display = 'flex';
  }
}

function openTimeline() {
  document.getElementById('main-container').style.display = 'none';
  document.getElementById('timeline-view').style.display = 'flex';
  renderTimeline();
}

function closeTimeline() {
  document.getElementById('timeline-view').style.display = 'none';
  document.getElementById('main-container').style.display = 'grid';
  renderAllItems();

  // 移除时间轴标签激活状态
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === 'timeline-tab') {
      btn.classList.remove('active');
    }
  });
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  // 清空预览和输入框
  const previewBox = document.getElementById(`${modalId.split('-')[0]}-preview`);
  const inputs = document.querySelectorAll(`#${modalId} .ue5-input`);
  if (previewBox) previewBox.innerHTML = '';
  inputs.forEach(input => input.value = '');
}

// ========== 本地存储功能 ==========
function getStoredItems(tabId) {
  const key = `starry_${tabId.split('-')[0]}`;
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function saveItem(tabId, itemData) {
  const key = `starry_${tabId.split('-')[0]}`;
  const items = getStoredItems(tabId);
  items.push({ id: Date.now(), ...itemData });
  localStorage.setItem(key, JSON.stringify(items));
  renderItems(tabId);
  closeModal(tabId);
  renderTimeline();

  // 同步更新背景图片列表
  if (tabId === 'image-modal') {
    initBackgroundSlider();
    if (bgImages.length === 1) startBackgroundSlider();
  }
}

// ========== 内容渲染功能 ==========
function renderAllItems() {
  if (currentTab) return;
  const container = document.getElementById('main-container');
  container.innerHTML = `<p class="empty-tip">点击顶部标签，开始记录你的美好时光 ✨</p>`;
}

function renderItems(tabId) {
  const container = document.getElementById('main-container');
  const items = getStoredItems(tabId);
  const type = tabId.split('-')[0];
  let html = '';

  items.forEach(item => {
    switch (type) {
      case 'image':
        html += `
          <div class="item-card ue5-panel">
            <span class="item-date">${item.date}</span>
            <p class="item-desc">${item.desc}</p>
            <img src="${item.src}" class="item-media" alt="${item.desc}">
            <button class="item-delete" data-type="${type}" data-id="${item.id}">删除</button>
          </div>
        `;
        break;
      case 'note':
        html += `
          <div class="item-card ue5-panel">
            <span class="item-date">${item.date}</span>
            <h3 class="item-title">${item.title}</h3>
            <p class="item-desc">${item.content}</p>
            <button class="item-delete" data-type="${type}" data-id="${item.id}">删除</button>
          </div>
        `;
        break;
      case 'video':
        html += `
          <div class="item-card ue5-panel">
            <span class="item-date">${item.date}</span>
            <p class="item-desc">${item.desc}</p>
            <video src="${item.src}" class="item-media" controls></video>
            <button class="item-delete" data-type="${type}" data-id="${item.id}">删除</button>
          </div>
        `;
        break;
      case 'music':
        html += `
          <div class="item-card ue5-panel">
            <span class="item-date">${item.date}</span>
            <h3 class="item-title">${item.name}</h3>
            <audio src="${item.src}" class="item-media" controls></audio>
            <button class="item-delete" data-type="${type}" data-id="${item.id}">删除</button>
          </div>
        `;
        break;
    }
  });

  container.innerHTML = html;
  // 绑定删除按钮事件
  bindDeleteEvents();
}

function renderTimeline(filterDate = null) {
  const timelineItems = [];
  const types = [
    { name: '图片', key: 'starry_image', color: '#7b61ff' },
    { name: '笔记', key: 'starry_note', color: '#4a90e2' },
    { name: '视频', key: 'starry_video', color: '#ff6b6b' },
    { name: '音乐', key: 'starry_music', color: '#9b8aff' }
  ];

  types.forEach(type => {
    const items = JSON.parse(localStorage.getItem(type.key) || '[]');
    items.forEach(item => {
      timelineItems.push({ ...item, type: type.name, typeKey: type.key, color: type.color });
    });
  });

  // 保存所有时间线数据到全局变量
  allTimelineItems = [...timelineItems];
  
  // 按日期倒序排序
  timelineItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 如果有筛选日期，过滤数据
  let filteredItems = filterDate 
    ? timelineItems.filter(item => item.date === filterDate) 
    : timelineItems;

  const timelineContainer = document.getElementById('timeline-items');
  if (filteredItems.length === 0) {
    const emptyText = filterDate 
      ? `<p class="empty-tip">暂无${filterDate}的记录 ✨</p>` 
      : `<p class="empty-tip">暂无记录，开始添加吧 ✨</p>`;
    timelineContainer.innerHTML = emptyText;
    return;
  }

  let html = '';
  filteredItems.forEach(item => {
    let mediaHtml = '';
    let title = '';
    let desc = '';

    switch (item.type) {
      case '图片':
        title = item.desc;
        desc = item.desc;
        mediaHtml = `<img src="${item.src}" class="timeline-media" alt="图片">`;
        break;
      case '笔记':
        title = item.title;
        desc = item.content;
        break;
      case '视频':
        title = item.desc;
        desc = item.desc;
        mediaHtml = `<video src="${item.src}" class="timeline-media" controls></video>`;
        break;
      case '音乐':
        title = item.name;
        desc = '点击播放音乐';
        mediaHtml = `<audio src="${item.src}" class="timeline-media" controls></audio>`;
        break;
    }

    html += `
      <div class="timeline-item">
        <div class="timeline-date">${item.date}</div>
        <div class="timeline-content-card">
          <span class="timeline-type" style="color:${item.color}">${item.type}</span>
          <h3 class="timeline-title">${title}</h3>
          <p class="timeline-desc">${desc}</p>
          ${mediaHtml}
          <button class="timeline-delete" data-key="${item.typeKey}" data-id="${item.id}">删除</button>
        </div>
      </div>
    `;
  });

  timelineContainer.innerHTML = html;
  // 绑定时间轴删除按钮事件
  bindTimelineDeleteEvents();
}

// ========== 删除功能 ==========
function bindDeleteEvents() {
  document.querySelectorAll('.item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.getAttribute('data-type');
      const id = parseInt(e.target.getAttribute('data-id'));
      const key = `starry_${type}`;
      let items = JSON.parse(localStorage.getItem(key) || '[]');
      items = items.filter(item => item.id !== id);
      localStorage.setItem(key, JSON.stringify(items));
      renderItems(`${type}-tab`);
      renderTimeline();
      initBackgroundSlider(); // 更新背景列表
    });
  });
}

function bindTimelineDeleteEvents() {
  document.querySelectorAll('.timeline-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const key = e.target.getAttribute('data-key');
      const id = parseInt(e.target.getAttribute('data-id'));
      let items = JSON.parse(localStorage.getItem(key) || '[]');
      items = items.filter(item => item.id !== id);
      localStorage.setItem(key, JSON.stringify(items));
      
      // 新增：删除后保持搜索状态
      const currentSearchDate = document.getElementById('timeline-search-date').value;
      renderTimeline(currentSearchDate); // 重新渲染时保留搜索条件
      
      if (key === 'starry_image') initBackgroundSlider(); // 更新背景列表
    });
  });
}

// ========== 文件上传预览 ==========
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('image-preview').innerHTML = `<img src="${reader.result}" alt="图片预览">`;
  };
  reader.readAsDataURL(file);
}

function handleVideoUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('video-preview').innerHTML = `<video src="${reader.result}" controls></video>`;
  };
  reader.readAsDataURL(file);
}

function handleMusicUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('music-preview').innerHTML = `<audio src="${reader.result}" controls></audio>`;
  };
  reader.readAsDataURL(file);
}

// ========== 保存功能 ==========
function saveImage() {
  const date = document.getElementById('image-date').value;
  const desc = document.getElementById('image-desc').value.trim();
  const preview = document.getElementById('image-preview').querySelector('img');
  if (!date || !desc || !preview) {
    alert('请填写日期、描述并选择图片！');
    return;
  }
  saveItem('image-modal', { date, desc, src: preview.src });
}

function saveNote() {
  const date = document.getElementById('note-date').value;
  const title = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  if (!date || !title || !content) {
    alert('请填写日期、标题和内容！');
    return;
  }
  saveItem('note-modal', { date, title, content });
}

function saveVideo() {
  const date = document.getElementById('video-date').value;
  const desc = document.getElementById('video-desc').value.trim();
  const preview = document.getElementById('video-preview').querySelector('video');
  if (!date || !desc || !preview) {
    alert('请填写日期、描述并选择视频！');
    return;
  }
  saveItem('video-modal', { date, desc, src: preview.src });
}

function saveMusic() {
  const date = document.getElementById('music-date').value;
  const name = document.getElementById('music-name').value.trim();
  const preview = document.getElementById('music-preview').querySelector('audio');
  if (!date || !name || !preview) {
    alert('请填写日期、音乐名称并选择音乐！');
    return;
  }
  saveItem('music-modal', { date, name, src: preview.src });
}

// ========== 新增：时间线搜索功能 ==========
function searchTimelineByDate() {
  const searchDate = document.getElementById('timeline-search-date').value;
  if (!searchDate) {
    alert('请选择要搜索的日期！');
    return;
  }
  renderTimeline(searchDate);
}

// 新增：重置搜索
function resetTimelineSearch() {
  document.getElementById('timeline-search-date').value = '';
  renderTimeline(); // 不传参数则显示所有记录
}