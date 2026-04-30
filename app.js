var audio = document.getElementById("audio");
var coverImage = document.getElementById("coverImage");
var songName = document.getElementById("songName");
var songArtist = document.getElementById("songArtist");
var currentTimeText = document.getElementById("currentTime");
var durationText = document.getElementById("duration");
var progressBar = document.getElementById("progressBar");
var playButton = document.getElementById("playButton");
var modeIcon = document.getElementById("modeIcon");
var modeLabel = document.getElementById("modeLabel");
var prevButton = document.getElementById("prevButton");
var nextButton = document.getElementById("nextButton");
var modeButton = document.getElementById("modeButton");
var queueList = document.getElementById("queueList");
var queuePanel = document.getElementById("queuePanel");
var queueToggle = document.getElementById("queueToggle");
var searchInput = document.getElementById("searchInput");
var searchButton = document.getElementById("searchButton");
var searchPanel = document.getElementById("searchPanel");
var searchResult = document.getElementById("searchResult");
var downloadButton = document.getElementById("downloadButton");
var downloadModal = document.getElementById("downloadModal");
var closeModalButton = document.getElementById("closeModalButton");
var copyButton = document.getElementById("copyButton");
var shareContent = document.getElementById("shareContent");

var rawList = Array.isArray(window.list) ? window.list : [];
var playlist = rawList.map(function (item, index) {
  return {
    id: index + "-" + item.name,
    name: item.name || "未命名歌曲",
    artist: item.artist || "未知专辑",
    url: cleanValue(item.url || ""),
    cover: cleanValue(item.cover || "")
  };
});

var currentIndex = 0;
var playMode = "sequence";
var playModeTextMap = {
  sequence: "顺序播放",
  loop: "单曲循环",
  random: "随机播放"
};
var playModeIconMap = {
  sequence: "⇄",
  loop: "↻",
  random: "⤮"
};

if (!playlist.length) {
  songName.textContent = "没有可播放歌曲";
  songArtist.textContent = "请在 music.js 中配置 list";
  progressBar.disabled = true;
  playButton.disabled = true;
  prevButton.disabled = true;
  nextButton.disabled = true;
  modeButton.disabled = true;
  renderQueue();
} else {
  loadSong(currentIndex);
  renderQueue();
}

playButton.addEventListener("click", function () {
  if (!playlist.length) {
    return;
  }

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

prevButton.addEventListener("click", function () {
  if (!playlist.length) {
    return;
  }
  playPrev();
});

nextButton.addEventListener("click", function () {
  if (!playlist.length) {
    return;
  }
  playNext();
});

modeButton.addEventListener("click", function () {
  if (playMode === "sequence") {
    playMode = "loop";
  } else if (playMode === "loop") {
    playMode = "random";
  } else {
    playMode = "sequence";
  }

  updateModeDisplay();
});

audio.addEventListener("play", function () {
  playButton.setAttribute("aria-label", "暂停");
  playButton.innerHTML = '<span class="button-icon">⏸</span>';
  coverImage.classList.add("playing");
});

audio.addEventListener("pause", function () {
  playButton.setAttribute("aria-label", "播放");
  playButton.innerHTML = '<span class="button-icon">▶</span>';
  coverImage.classList.remove("playing");
});

audio.addEventListener("loadedmetadata", function () {
  progressBar.max = Math.floor(audio.duration) || 0;
  durationText.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", function () {
  progressBar.value = Math.floor(audio.currentTime) || 0;
  currentTimeText.textContent = formatTime(audio.currentTime);
});

audio.addEventListener("ended", function () {
  if (playMode === "loop") {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  playNext();
});

progressBar.addEventListener("input", function () {
  audio.currentTime = Number(progressBar.value);
});

queueToggle.addEventListener("click", function () {
  queuePanel.classList.toggle("hidden");
  hideSearchPanel();
});

searchButton.addEventListener("click", function () {
  renderSearch(searchInput.value);
});

searchInput.addEventListener("focus", function () {
  renderSearch(searchInput.value);
});

searchInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    renderSearch(searchInput.value);
  }
});

downloadButton.addEventListener("click", function () {
  downloadModal.classList.remove("hidden");
});

closeModalButton.addEventListener("click", function () {
  downloadModal.classList.add("hidden");
});

downloadModal.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal-mask")) {
    downloadModal.classList.add("hidden");
  }
});

document.addEventListener("click", function (event) {
  if (!queuePanel.classList.contains("hidden")) {
    var clickedQueueArea = queuePanel.contains(event.target) || queueToggle.contains(event.target);
    if (!clickedQueueArea) {
      hideQueuePanel();
    }
  }

  if (!searchPanel.classList.contains("hidden")) {
    var clickedSearchArea = searchPanel.contains(event.target) || searchInput.contains(event.target) || searchButton.contains(event.target);
    if (!clickedSearchArea) {
      hideSearchPanel();
    }
  }
});

copyButton.addEventListener("click", function () {
  shareContent.select();
  shareContent.setSelectionRange(0, shareContent.value.length);

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareContent.value).then(function () {
      copyButton.textContent = "复制成功";
      resetCopyText();
    }).catch(copyByCommand);
  } else {
    copyByCommand();
  }
});

function copyByCommand() {
  document.execCommand("copy");
  copyButton.textContent = "复制成功";
  resetCopyText();
}

function resetCopyText() {
  window.setTimeout(function () {
    copyButton.textContent = "复制内容";
  }, 1200);
}

function cleanValue(value) {
  return String(value).replace(/[`"]/g, "").trim();
}

function loadSong(index) {
  var song = playlist[index];
  if (!song) {
    return;
  }

  currentIndex = index;
  audio.src = song.url;
  coverImage.src = song.cover;
  songName.textContent = song.name;
  songArtist.textContent = song.artist;
  currentTimeText.textContent = "00:00";
  durationText.textContent = "00:00";
  progressBar.value = 0;
  renderQueue();
}

function playSong(index) {
  loadSong(index);
  audio.play();
}

function playPrev() {
  if (playMode === "random" && playlist.length > 1) {
    playRandom();
    return;
  }

  var nextIndex = currentIndex - 1;
  if (nextIndex < 0) {
    nextIndex = playlist.length - 1;
  }
  playSong(nextIndex);
}

function playNext() {
  if (!playlist.length) {
    return;
  }

  if (playMode === "random" && playlist.length > 1) {
    playRandom();
    return;
  }

  var nextIndex = currentIndex + 1;
  if (nextIndex >= playlist.length) {
    nextIndex = 0;
  }
  playSong(nextIndex);
}

function playRandom() {
  var randomIndex = currentIndex;
  while (randomIndex === currentIndex && playlist.length > 1) {
    randomIndex = Math.floor(Math.random() * playlist.length);
  }
  playSong(randomIndex);
}

function renderQueue() {
  if (!playlist.length) {
    queueList.innerHTML = '<li><p class="empty-text">当前播放列表为空</p></li>';
    return;
  }

  queueList.innerHTML = playlist.map(function (song, index) {
    var activeClass = index === currentIndex ? " queue-item active-row" : " queue-item";
    return (
      '<li class="' + activeClass.trim() + '">' +
      '  <div class="queue-song" data-action="play" data-index="' + index + '">' +
      "    <strong>" + escapeHtml(song.name) + "</strong>" +
      "    <span>" + escapeHtml(song.artist) + "</span>" +
      "  </div>" +
      '  <div class="item-actions">' +
      '    <button class="small-button delete-small" data-action="delete" data-index="' + index + '" aria-label="删除歌曲">X</button>' +
      "  </div>" +
      "</li>"
    );
  }).join("");
}

queueList.addEventListener("click", function (event) {
  var target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  var index = Number(target.dataset.index);
  if (target.dataset.action === "play") {
    playSong(index);
    queuePanel.classList.add("hidden");
  }

  if (target.dataset.action === "delete") {
    deleteSong(index);
  }
});

function deleteSong(index) {
  if (!playlist[index]) {
    return;
  }

  var isCurrentSong = index === currentIndex;
  playlist.splice(index, 1);

  if (!playlist.length) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    coverImage.removeAttribute("src");
    songName.textContent = "播放列表已清空";
    songArtist.textContent = "请重新配置歌曲";
    currentIndex = 0;
    renderQueue();
    return;
  }

  if (index < currentIndex) {
    currentIndex -= 1;
  }

  if (currentIndex >= playlist.length) {
    currentIndex = playlist.length - 1;
  }

  if (isCurrentSong) {
    loadSong(currentIndex);
    audio.play();
  } else {
    loadSong(currentIndex);
  }
}

function renderSearch(keyword) {
  searchPanel.classList.remove("hidden");
  queuePanel.classList.add("hidden");

  var text = cleanValue(keyword).toLowerCase();
  var grouped = groupAlbums();
  var resultHtml = "";

  Object.keys(grouped).forEach(function (albumName) {
    var songs = grouped[albumName].filter(function (song) {
      if (!text) {
        return true;
      }
      return song.name.toLowerCase().indexOf(text) > -1 || song.artist.toLowerCase().indexOf(text) > -1;
    });

    if (!songs.length) {
      return;
    }

    resultHtml += '<div class="album-block">';
    resultHtml += '<p class="album-title">' + escapeHtml(albumName) + "</p>";
    resultHtml += '<ul class="song-list">';
    resultHtml += songs.map(function (song) {
      return (
        '<li class="song-item">' +
        '  <div class="search-main" data-song-id="' + song.id + '">' +
        "    <strong>" + escapeHtml(song.name) + "</strong>" +
        "    <span>" + escapeHtml(song.artist) + "</span>" +
        "  </div>" +
        "</li>"
      );
    }).join("");
    resultHtml += "</ul>";
    resultHtml += "</div>";
  });

  if (!resultHtml) {
    resultHtml = '<p class="empty-text">没有找到相关歌曲</p>';
  }

  searchResult.innerHTML = resultHtml;
}

searchResult.addEventListener("click", function (event) {
  var target = event.target.closest("[data-song-id]");
  if (!target) {
    return;
  }

  var songId = target.dataset.songId;
  if (!songId) {
    return;
  }

  var index = playlist.findIndex(function (song) {
    return song.id === songId;
  });

  if (index > -1) {
    playSong(index);
    searchPanel.classList.add("hidden");
  }
});

function groupAlbums() {
  return playlist.reduce(function (result, song) {
    var albumName = song.artist || "未知专辑";
    if (!result[albumName]) {
      result[albumName] = [];
    }
    result[albumName].push(song);
    return result;
  }, {});
}

function hideSearchPanel() {
  searchPanel.classList.add("hidden");
  searchInput.value = "";
  searchResult.innerHTML = "";
}

function hideQueuePanel() {
  queuePanel.classList.add("hidden");
}

function updateModeDisplay() {
  modeIcon.textContent = playModeIconMap[playMode];
  modeLabel.textContent = playModeTextMap[playMode];
}

function formatTime(value) {
  if (!value || Number.isNaN(value)) {
    return "00:00";
  }

  var totalSeconds = Math.floor(value);
  var minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  var seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
