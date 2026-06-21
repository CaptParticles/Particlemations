// YouTube Data API wiring: set API_KEY and CHANNEL_ID before use.

const API_KEY = ''; // <-- Add your YouTube Data API v3 key here
const CHANNEL_ID = ''; // <-- Add the channel id (UC...)
const MAX_RESULTS = 8;

// Demo videos used when API is not configured
const SAMPLE_VIDEOS = [
  { id: 'Ve_6ee34Mg4', title: 'Bfav Announcement Trailer' },
  { id: '446c3lVlnBU', title: "BFAV 1: THERE'S ONLY 14 NEWBIES!!!" },
  { id: '1gm_E-97kLA', title: 'BFAV 2: A NEW HOST!?' },
  { id: 'MoVwxT3lXk0', title: 'BFAV 2 Trailer' }
];

const CHANNEL_URL = 'https://www.youtube.com/@PRGOfficalYT?sub_confirmation=1';

function showMessage(container, msg) {
  container.innerHTML = `<p>${msg}</p>`;
}

// Load YouTube API (optional helper)
function loadYouTubeAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);

    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    const timeout = setTimeout(() => reject(new Error('YT API load timeout')), 5000);

    window.onYouTubeIframeAPIReady = () => {
      clearTimeout(timeout);
      resolve(window.YT);
    };
  });
}

function createFallbackForVideo(container, videoId, title) {
  container.innerHTML = '';

  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const linkCard = document.createElement('a');
  linkCard.className = 'card';
  linkCard.href = `https://www.youtube.com/watch?v=${videoId}`;
  linkCard.target = '_blank';
  linkCard.rel = 'noopener';

  linkCard.innerHTML = `
    <img src="${thumb}" alt="${title}">
    <div class="meta">
      <p class="title">${title}</p>
    </div>
  `;

  container.appendChild(linkCard);
}

function handleEmbedError(container, videoId, title) {
  createFallbackForVideo(container, videoId, title);
}

async function fetchLatest() {
  const listEl = document.getElementById('latest-list');
  const container = document.getElementById('video-container');
  if (!listEl || !container) return;

  // If no API key → use demo mode
  if (!API_KEY || !CHANNEL_ID) {
    listEl.innerHTML = '';

    SAMPLE_VIDEOS.forEach((v, idx) => {
      const thumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;

      const a = document.createElement('a');
      a.className = 'card';
      a.href = `https://www.youtube.com/watch?v=${v.id}`;
      a.target = '_blank';
      a.rel = 'noopener';

      a.innerHTML = `
        <img src="${thumb}" alt="${v.title}">
        <div class="meta"><p class="title">${v.title}</p></div>
      `;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        setFeatured(v.id, v.title);
      });

      a.style.transitionDelay = `${idx * 60}ms`;
      listEl.appendChild(a);
    });

    setFeatured(SAMPLE_VIDEOS[0].id, SAMPLE_VIDEOS[0].title);
    return;
  }

  // Real API request
  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?key=${API_KEY}` +
    `&channelId=${CHANNEL_ID}` +
    `&part=snippet,id` +
    `&order=date` +
    `&type=video` +
    `&maxResults=${MAX_RESULTS}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) {
      showMessage(listEl, 'No videos found or API error.');
      return;
    }

    listEl.innerHTML = '';

    let firstVideoId = null;

    data.items.forEach((item) => {
      if (item.id.kind !== 'youtube#video') return;

      const vid = item.id.videoId;
      if (!firstVideoId) firstVideoId = vid;

      const title = item.snippet.title;
      const thumb =
        item.snippet.thumbnails?.medium?.url ||
        item.snippet.thumbnails?.default?.url;

      const a = document.createElement('a');
      a.className = 'card';
      a.href = `https://www.youtube.com/watch?v=${vid}`;
      a.target = '_blank';
      a.rel = 'noopener';

      a.innerHTML = `
        <img src="${thumb}" alt="${title}">
        <div class="meta"><p class="title">${title}</p></div>
      `;

      a.addEventListener('click', (e) => {
        e.preventDefault();
        setFeatured(vid, title);
      });

      listEl.appendChild(a);
    });

    if (firstVideoId) setFeatured(firstVideoId, '');
  } catch (err) {
    showMessage(listEl, `Failed to fetch videos: ${err.message}`);
  }
}

function setFeatured(videoId, title = '') {
  const container = document.getElementById('video-container');
  if (!container) return;

  container.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.width = '720';
  iframe.height = '405';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  iframe.title = title || 'Featured video';
  iframe.allow =
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.style.border = '0';
  iframe.style.borderRadius = '10px';

  // fallback safety
  const timer = setTimeout(() => {
    handleEmbedError(container, videoId, title);
  }, 4000);

  iframe.onload = () => clearTimeout(timer);
  iframe.onerror = () => {
    clearTimeout(timer);
    handleEmbedError(container, videoId, title);
  };

  container.appendChild(iframe);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLatest();
  setTimeout(() => document.body.classList.add('animate'), 80);
});