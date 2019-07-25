let context = null;
let oscillator = null;
function getOrCreateContext() {
  if (!context) {
    context = new AudioContext();
    console.log(context);
    oscillator = context.createOscillator();
    oscillator.connect(context.destination);
  }
  return context;
}
const list = document.getElementById('midi-list');
const debugEl = document.getElementById('debug');

let isStarted = false;

/**
 * 波形の種類
 * @param {string} type
 */
function changeType(type) {
  oscillator.type = type;
}

const length = 2;
const eps = 0.01;

// This is a tetris theme transposed from https://musescore.com/user/16693/scores/38133
const tetris = [
  [76, 4],
  [71, 8],
  [72, 8],
  [74, 4],
  [72, 8],
  [71, 8],
  [69, 4],
  [69, 8],
  [72, 8],
  [76, 4],
  [74, 8],
  [72, 8],
  [71, 4],
  [71, 8],
  [72, 8],
  [74, 4],
  [76, 4],
  [72, 4],
  [69, 4],
  [69, 4],
  [0, 4],
  [74, 3],
  [77, 8],
  [81, 4],
  [79, 8],
  [77, 8],
  [76, 3],
  [72, 8],
  [76, 4],
  [74, 8],
  [72, 8],
  [71, 4],
  [71, 8],
  [72, 8],
  [74, 4],
  [76, 4],
  [72, 4],
  [69, 4],
  [69, 4],
  [0, 4]
];

function playTetris() {
  getOrCreateContext();
  oscillator.start(0);
  let time = context.currentTime + eps;
  tetris.forEach((note) => {
    const freq = Math.pow(2, (note[0] - 69) / 12) * 440;
    console.log(time);
    oscillator.frequency.setTargetAtTime(0, time - eps, 0.001);
    oscillator.frequency.setTargetAtTime(freq, time, 0.001);
    time += length / note[1];
  });
}

document
  .getElementById('typesine')
  .addEventListener('click', changeType.bind(null, 'sine'));
document
  .getElementById('typesquare')
  .addEventListener('click', changeType.bind(null, 'square'));
document
  .getElementById('typesaw')
  .addEventListener('click', changeType.bind(null, 'sawtooth'));
document
  .getElementById('typetriangle')
  .addEventListener('click', changeType.bind(null, 'triangle'));

document.getElementById('tetris').addEventListener('click', playTetris);

function noteOn(midiNote) {
  console.log(midiNote);
  getOrCreateContext();
  const freq = Math.pow(2, (midiNote - 69) / 12) * 440;
  oscillator.frequency.setTargetAtTime(freq, context.currentTime, 0);
  if (!isStarted) {
    oscillator.start(0);
    isStarted = true;
  } else {
    context.resume();
  }
}

function noteOff() {
  context.suspend();
}

function connectToDevice(device) {
  console.log('Connecting to device', device);
  device.onmidimessage = function(m) {
    const [command, key] = m.data;
    if (command === 145) {
      debugEl.innerText = 'KEY UP: ' + key;
      noteOn(key);
    } else if (command === 129) {
      debugEl.innerText = 'KEY DOWN';
      noteOff();
    }
  };
}

function replaceElements(inputs) {
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }
  const elements = inputs.map((e) => {
    console.log(e);
    const el = document.createElement('li');
    el.innerText = `${e.name} (${e.manufacturer})`;
    el.addEventListener('click', connectToDevice.bind(null, e));
    return el;
  });

  elements.forEach((e) => list.appendChild(e));
}

navigator.requestMIDIAccess().then(function(access) {
  console.log('access', access);
  replaceElements(Array.from(access.inputs.values()));
  access.onstatechange = function() {
    replaceElements(Array.from(this.inputs.values()));
  };
});

// C4-C5 q-iキーのキーボードエミュレーション
const emulatedKeys = {
  q: 60,
  w: 62,
  e: 64,
  r: 65,
  t: 67,
  y: 69,
  u: 71,
  i: 72
};

// タイプされたら呼ばれる
document.addEventListener('keydown', function(e) {
  if (emulatedKeys.hasOwnProperty(e.key)) {
    noteOn(emulatedKeys[e.key]);
  }
});

// タイプが終わったら呼ばれる
document.addEventListener('keyup', function(e) {
  if (emulatedKeys.hasOwnProperty(e.key)) {
    noteOff();
  }
});

const con = new AudioContext();

// Audio 用の buffer を読み込む
var getAudioBuffer = function(url, fn) {
  var req = new XMLHttpRequest();
  // array buffer を指定
  req.responseType = 'arraybuffer';

  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 0 || req.status === 200) {
        // array buffer を audio buffer に変換
        con.decodeAudioData(req.response, function(buffer) {
          // コールバックを実行
          fn(buffer);
        });
      }
    }
  };

  req.open('GET', url, true);
  req.send('');
};

console.log(getAudioBuffer);

// サウンドを再生
var playSound = function(buffer) {
  // source を作成
  var source = con.createBufferSource();
  // buffer をセット
  source.buffer = buffer;
  // context に connect
  source.connect(con.destination);
  // 再生
  source.start(0);
};

// main
window.onload = function() {
  // サウンドを読み込む
  getAudioBuffer('../mp3s/door_chime0.mp3', function(buffer) {
    console.log('a');
    // 読み込み完了後にボタンにクリックイベントを登録
    document.getElementById('play-mp3').addEventListener('click', () => {
      console.log('呼ばれた');
      // サウンドを再生
      playSound(buffer);
    });
  });
};
