// YouTube Data API wiring: set API_KEY and CHANNEL_ID before use.
// To get CHANNEL_ID: open the channel in YouTube, click "Share" -> "Copy link".
// The copied URL will be like https://www.youtube.com/channel/UC..., the part after /channel/ is the CHANNEL_ID.

const API_KEY = '';// <-- Add your YouTube Data API v3 key here
const CHANNEL_ID = '';// <-- Add the channel id (UC...)
const MAX_RESULTS = 8;

// Demo videos to show when no API key is provided — using channel links you supplied.
const SAMPLE_VIDEOS = [
  { id: '1gm_E-97kLA', title: 'BFAV 2: A NEW HOST!?' },
  { id: 'ZSSCEzdYpfI', title: 'PRG Live 2026 BIRTHDAY' },
  { id: '6RaEzS-BPw4', title: 'PRG Live 2026 Birthday trailer' },
  { id: 'MoVwxT3lXk0', title: 'BFAV 2 Trailer' }
];

const CHANNEL_URL = 'https://www.youtube.com/@PRGOfficalYT?sub_confirmation=1';

function showMessage(container, msg){
  container.innerHTML = `<p>${msg}</p>`;
}

// Load YouTube IFrame API once and return a Promise that resolves when ready
function loadYouTubeAPI(){
  return new Promise((resolve, reject) => {
    if(window.YT && window.YT.Player) return resolve(window.YT);
    // If script already injected, wait for onYouTubeIframeAPIReady
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if(!existing){
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

function createFallbackForVideo(container, videoId, title){
  container.innerHTML = '';
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const linkCard = document.createElement('a');
  linkCard.className = 'card';
  linkCard.href = `https://www.youtube.com/watch?v=${videoId}`;
  linkCard.target = '_blank';
  linkCard.rel = 'noopener';
  linkCard.innerHTML = `\n    <img src="${thumb}" alt="${title || 'Video'}">\n    <div class="meta"><p class="title">${title || 'Watch on YouTube'}</p></div>\n  `;
  container.appendChild(linkCard);
}

function handleEmbedError(container, videoId, title){
  createFallbackForVideo(container, videoId, title);
}

async function fetchLatest(){
  const listEl = document.getElementById('latest-list');
  const container = document.getElementById('video-container');
  if(!listEl || !container) return;

  if(!API_KEY || !CHANNEL_ID){
    // Populate latest list with demo videos (no autoplay featured video).
    listEl.innerHTML = '';
    SAMPLE_VIDEOS.forEach((v, idx) => {
      const thumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
      const a = document.createElement('a');
      a.className = 'card';
      a.href = `https://www.youtube.com/watch?v=${v.id}`;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `\n        <img src="${thumb}" alt="${v.title}">\n        <div class="meta"><p class="title">${v.title}</p></div>\n      `;
      // clicking the card will set it as featured (embed)
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setFeatured(v.id);
      });
      // add small stagger so items animate in order
      a.style.transitionDelay = `${idx * 60}ms`;
      listEl.appendChild(a);
    });
    // Auto-feature the first demo video
    if(SAMPLE_VIDEOS.length) setFeatured(SAMPLE_VIDEOS[0].id);
    return;
  }

  const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${MAX_RESULTS}`;
  try{
    const res = await fetch(url);
    const data = await res.json();
    if(!data.items){
      showMessage(listEl, `No videos found or API error: ${data.error?.message || 'unknown'}`);
      return;
    }

    listEl.innerHTML = '';
    let firstVideoId = null;
    data.items.forEach(item =>{
      // skip non-video items
      if(item.id.kind !== 'youtube#video') return;
      const vid = item.id.videoId;
      if(!firstVideoId) firstVideoId = vid;
      const thumb = item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '';
      const title = item.snippet.title;

      const a = document.createElement('a');
      a.className = 'card';
      a.href = `https://www.youtube.com/watch?v=${vid}`;
      a.target = '_blank';
      a.rel = 'noopener';

      a.innerHTML = `
        <img src="${thumb}" alt="${title}">
        <div class="meta"><p class="title">${title}</p></div>
      `;

      a.addEventListener('click', (e)=>{
        e.preventDefault();
        setFeatured(vid);
      });

      listEl.appendChild(a);
    });

    if(firstVideoId) setFeatured(firstVideoId);

  }catch(err){
    showMessage(listEl, `Failed to fetch videos: ${err.message}`);
  }
}

function setFeatured(videoId, title){
  const container = document.getElementById('video-container');
  if(!container) return;
  container.innerHTML = '';

  // Use official YouTube embed iframe
  const iframe = document.createElement('iframe');
  iframe.width = '720';
  iframe.height = '405';
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  iframe.title = 'Featured video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  iframe.style.border = '0';
  iframe.style.borderRadius = '10px';
  
  // If iframe fails to load after 2s, show fallback
  const fallbackTimer = setTimeout(() => {
    if(!iframe.offsetParent) { // iframe is hidden/failed
      handleEmbedError(container, videoId, title);
    }
  }, 2000);
  
  iframe.addEventListener('load', () => clearTimeout(fallbackTimer));
  iframe.addEventListener('error', () => {
    clearTimeout(fallbackTimer);
    handleEmbedError(container, videoId, title);
  });
  
  container.appendChild(iframe);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchLatest();
  // trigger entry animations after initial paint
  setTimeout(() => document.body.classList.add('animate'), 80);
});