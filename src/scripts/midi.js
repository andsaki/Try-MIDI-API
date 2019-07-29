import * as L from './library';

let context = null;
let oscillator = null;
function getOrCreateContext() {
  if (!context) {
    context = new AudioContext();
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

const bpm = L.kirby.bpm;
const length = (60 * 4) / bpm;
const eps = 0.01;

function Play() {
  getOrCreateContext();
  oscillator.start(0);
  let time = context.currentTime + eps;
  L.kirby.source.forEach((note) => {
    const freq = Math.pow(2, (note.pitch - 69) / 12) * 440;
    oscillator.frequency.setTargetAtTime(0, time - eps, 0.001);
    oscillator.frequency.setTargetAtTime(freq, time, 0.001);
    time += length / note.beats;
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

document.getElementById('play').addEventListener('click', Play);

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
  a: 60, // C
  w: 61, // C#
  s: 62, // D
  e: 63, // D#
  d: 64, // E
  f: 65, // F
  t: 66, // F#
  g: 67, // G
  y: 68, // G#
  h: 69, // A
  u: 70, // A#
  j: 71, // B
  k: 72 // C
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
