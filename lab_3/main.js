const keyMap = {
  65: "boom", // a
  83: "clap", // s
  68: "hihat", // d
  70: "kick", // f
  71: "openhat", // g
  72: "ride", // h
  74: "snare", // j
  75: "tink", // k
  76: "tom", // l
};

const state = {
  channels: [],
  activeChannel: null,
  isRecording: false,
  isPlaying: false,
  recordStartTime: 0,
  metronomeActive: false,
  metronomeBpm: 120,
  metronomeInterval: null,
  metronomeCount: 0,
  loopActive: false,
  loopBars: 4,
  channelCount: 0,
  anyChannelPlaying: false,
};

function init() {
  addChannel();
  addChannel();
  addChannel();
  addChannel();

  setupKeyListeners();
  setupButtonListeners();

  document
    .getElementById("metronome-bpm")
    .addEventListener("change", updateMetronomeBpm);

  document
    .getElementById("loop-toggle")
    .addEventListener("change", updateLoopSettings);
  document
    .getElementById("loop-bars")
    .addEventListener("change", updateLoopSettings);

  document
    .getElementById("metronome-toggle")
    .addEventListener("change", toggleMetronome);
}

function addChannel() {
  state.channelCount++;
  const channelIndex = state.channelCount - 1;

  const channel = {
    id: channelIndex,
    events: [],
    isPlaying: false,
    hasRecording: false,
  };

  state.channels.push(channel);

  const channelEl = document.createElement("div");
  channelEl.className = "channel";
  channelEl.innerHTML = `
        <div class="channel-number">Ch ${channelIndex + 1}</div>
        <div class="channel-status" id="channel-status-${channelIndex}"></div>
        <div class="channel-controls">
            <button class="record-btn" id="record-btn-${channelIndex}" data-channel="${channelIndex}">Nagrywaj</button>
            <button class="play-btn" id="play-btn-${channelIndex}" data-channel="${channelIndex}">Odtwórz</button>
            <button class="stop-btn" id="stop-btn-${channelIndex}" data-channel="${channelIndex}">Stop</button>
        </div>
        <div class="channel-select">
            <input type="checkbox" id="channel-select-${channelIndex}" class="channel-checkbox" data-channel="${channelIndex}" checked>
            <label for="channel-select-${channelIndex}">Aktywny</label>
        </div>
    `;

  document.getElementById("channels-container").appendChild(channelEl);

  setupChannelListeners(channelIndex);
}

function removeChannel() {
  if (state.channelCount <= 1) return;

  if (state.isRecording && state.activeChannel === state.channelCount - 1) {
    stopRecording();
  }

  if (state.channels[state.channelCount - 1].isPlaying) {
    stopChannel(state.channelCount - 1);
  }

  const channelsContainer = document.getElementById("channels-container");
  channelsContainer.removeChild(channelsContainer.lastChild);

  state.channels.pop();
  state.channelCount--;

  updateGlobalPlayingState();
}

function setupChannelListeners(channelIndex) {
  const recordBtn = document.querySelector(
    `.record-btn[data-channel="${channelIndex}"]`
  );
  const playBtn = document.querySelector(
    `.play-btn[data-channel="${channelIndex}"]`
  );
  const stopBtn = document.querySelector(
    `.stop-btn[data-channel="${channelIndex}"]`
  );

  recordBtn.addEventListener("click", function () {
    if (state.isRecording && state.activeChannel === channelIndex) {
      stopRecording();
    } else {
      startRecording(channelIndex);
    }
  });

  playBtn.addEventListener("click", () => playChannel(channelIndex));
  stopBtn.addEventListener("click", () => stopChannel(channelIndex));
}

function setupKeyListeners() {
  window.addEventListener("keydown", playSound);
  window.addEventListener("keyup", removeTransition);
}

function setupButtonListeners() {
  document.querySelectorAll(".key").forEach((key) => {
    key.addEventListener("click", function () {
      const keyCode = this.getAttribute("data-key");
      playSound({ keyCode });
    });
    key.addEventListener("transitionend", removeTransition);
  });

  document
    .getElementById("play-all")
    .addEventListener("click", playAllChannels);
  document
    .getElementById("stop-all")
    .addEventListener("click", stopAllChannels);
  document.getElementById("add-channel").addEventListener("click", addChannel);
  document
    .getElementById("remove-channel")
    .addEventListener("click", removeChannel);
}

function playSound(e) {
  const keyCode = e.keyCode || e.target?.getAttribute("data-key");

  if (!keyMap[keyCode]) return;

  const audio = document.querySelector(`audio[data-key="${keyCode}"]`);
  const key = document.querySelector(`.key[data-key="${keyCode}"]`);

  if (!audio) return;

  audio.currentTime = 0;
  audio.play();

  key.classList.add("playing");

  if (state.isRecording && state.activeChannel !== null) {
    const timeOffset = Date.now() - state.recordStartTime;
    state.channels[state.activeChannel].events.push({
      keyCode,
      time: timeOffset,
    });
  }
}

function removeTransition(e) {
  if (e.propertyName !== "transform") return;
  this.classList.remove("playing");
}

function startRecording(channelIndex) {
  if (state.isRecording) {
    stopRecording();
  }

  state.channels[channelIndex].events = [];
  state.channels[channelIndex].hasRecording = false;
  updateChannelStatus(channelIndex);

  state.isRecording = true;
  state.activeChannel = channelIndex;
  state.recordStartTime = Date.now();

  const recordBtn = document.getElementById(`record-btn-${channelIndex}`);
  recordBtn.classList.add("active-recording");
  recordBtn.textContent = "Stop";
}

function stopRecording() {
  if (!state.isRecording) return;

  const channelIndex = state.activeChannel;
  const recordBtn = document.getElementById(`record-btn-${channelIndex}`);

  state.isRecording = false;
  state.channels[channelIndex].hasRecording =
    state.channels[channelIndex].events.length > 0;
  updateChannelStatus(channelIndex);

  recordBtn.classList.remove("active-recording");
  recordBtn.textContent = "Nagrywaj";

  state.activeChannel = null;
}

function updateChannelStatus(channelIndex) {
  const statusEl = document.getElementById(`channel-status-${channelIndex}`);
  const channel = state.channels[channelIndex];

  statusEl.classList.remove("has-recording", "is-playing");

  if (channel.isPlaying) {
    statusEl.classList.add("is-playing");
  } else if (channel.hasRecording) {
    statusEl.classList.add("has-recording");
  }
}

function updateChannelButtonStates(channelIndex) {
  const playBtn = document.getElementById(`play-btn-${channelIndex}`);
  const stopBtn = document.getElementById(`stop-btn-${channelIndex}`);
  const channel = state.channels[channelIndex];

  playBtn.classList.remove("active-playing");
  stopBtn.classList.remove("active-stop");

  if (channel.isPlaying) {
    playBtn.classList.add("active-playing");
    stopBtn.classList.add("active-stop");
  }
}

function updateGlobalPlayingState() {
  state.anyChannelPlaying = state.channels.some((channel) => channel.isPlaying);

  const playAllBtn = document.getElementById("play-all");
  const stopAllBtn = document.getElementById("stop-all");

  playAllBtn.classList.toggle("active", state.anyChannelPlaying);
  stopAllBtn.classList.toggle("active", state.anyChannelPlaying);
}

function playChannel(channelIndex) {
  if (
    state.channels[channelIndex].isPlaying ||
    !state.channels[channelIndex].hasRecording
  )
    return;

  state.channels[channelIndex].isPlaying = true;
  updateChannelStatus(channelIndex);
  updateChannelButtonStates(channelIndex);
  updateGlobalPlayingState();

  const events = [...state.channels[channelIndex].events];

  let maxDuration = 0;
  if (state.loopActive) {
    const beatsPerBar = 4;
    const beatDuration = 60000 / state.metronomeBpm;
    maxDuration = state.loopBars * beatsPerBar * beatDuration;
  } else if (events.length > 0) {
    maxDuration = events[events.length - 1].time + 100;
  }

  events.forEach((event) => {
    setTimeout(() => {
      const audio = document.querySelector(
        `audio[data-key="${event.keyCode}"]`
      );
      const key = document.querySelector(`.key[data-key="${event.keyCode}"]`);

      if (audio && state.channels[channelIndex].isPlaying) {
        audio.currentTime = 0;
        audio.play();
        key.classList.add("playing");
      }
    }, event.time);
  });

  if (state.loopActive && maxDuration > 0) {
    setTimeout(() => {
      if (state.channels[channelIndex].isPlaying) {
        playChannel(channelIndex);
      }
    }, maxDuration);
  } else if (maxDuration > 0) {
    setTimeout(() => {
      if (state.channels[channelIndex].isPlaying) {
        stopChannel(channelIndex);
      }
    }, maxDuration);
  }
}

function stopChannel(channelIndex) {
  state.channels[channelIndex].isPlaying = false;
  updateChannelStatus(channelIndex);
  updateChannelButtonStates(channelIndex);
  updateGlobalPlayingState();
}

function playAllChannels() {
  const selectedChannels = [];
  document.querySelectorAll(".channel-checkbox").forEach((checkbox) => {
    if (checkbox.checked) {
      selectedChannels.push(parseInt(checkbox.getAttribute("data-channel")));
    }
  });

  selectedChannels.forEach((channelIndex) => {
    if (state.channels[channelIndex].hasRecording) {
      playChannel(channelIndex);
    }
  });
}

function stopAllChannels() {
  state.channels.forEach((channel, index) => {
    if (channel.isPlaying) {
      stopChannel(index);
    }
  });
}

function toggleMetronome() {
  const metronomeToggle = document.getElementById("metronome-toggle");
  state.metronomeActive = metronomeToggle.checked;

  if (state.metronomeActive) {
    startMetronome();
  } else {
    stopMetronome();
  }
}

function updateMetronomeBpm() {
  const bpmInput = document.getElementById("metronome-bpm");
  state.metronomeBpm = parseInt(bpmInput.value);

  if (state.metronomeActive) {
    stopMetronome();
    startMetronome();
  }
}

function startMetronome() {
  if (state.metronomeInterval) clearInterval(state.metronomeInterval);

  const beatDuration = 60000 / state.metronomeBpm;
  const metronomeLight = document.getElementById("metronome-light");

  state.metronomeCount = 0;
  state.metronomeInterval = setInterval(() => {
    const isFirstBeat = state.metronomeCount % 4 === 0;
    const soundKey = isFirstBeat ? 70 : 75;

    const audio = document.querySelector(`audio[data-key="${soundKey}"]`);
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }

    metronomeLight.classList.add("active");
    setTimeout(() => {
      metronomeLight.classList.remove("active");
    }, 100);

    state.metronomeCount++;
  }, beatDuration);
}

function stopMetronome() {
  if (state.metronomeInterval) {
    clearInterval(state.metronomeInterval);
    state.metronomeInterval = null;
  }
}

function updateLoopSettings() {
  const loopToggle = document.getElementById("loop-toggle");
  const loopBarsInput = document.getElementById("loop-bars");

  state.loopActive = loopToggle.checked;
  state.loopBars = parseInt(loopBarsInput.value);
}

document.addEventListener("DOMContentLoaded", init);
