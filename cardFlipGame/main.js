const board = document.getElementById('board');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const resetBtn = document.getElementById('reset');
const overlay = document.getElementById('overlay');
const finalMovesEl = document.getElementById('final-moves');
const finalTimeEl = document.getElementById('final-time');
const playAgainBtn = document.getElementById('play-again');

const emojis = ['፩','፪','፫','፬','፭','፮','፯','፰','፱','፲'];
let deck = [];
let first = null;
let second = null;
let locked = false;
let moves = 0;
let matches = 0;
let startTime = null;
let timerId = null;
let audioCtx = null;

function ensureAudio(){
  if(!audioCtx){
    try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){}
  }
  if(audioCtx && audioCtx.state === 'suspended'){
    audioCtx.resume();
  }
}

function beep(freq=440, duration=0.08, type='sine', volume=0.07){
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = volume;
  o.connect(g);
  g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  o.stop(now + duration + 0.02);
}

function chord(freqs=[523.25,659.25,783.99], duration=0.25, volume=0.06){
  if(!audioCtx) return;
  const now = audioCtx.currentTime;
  freqs.forEach(f => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.value = f;
    g.gain.value = volume;
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    o.stop(now + duration + 0.05);
  });
}

function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    speechSynthesis.speak(u);
  }catch(e){}
}

function pad(n){return n.toString().padStart(2,'0');}
function formatTime(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const ss = s % 60;
  return `${pad(m)}:${pad(ss)}`;
}

function startTimer(){
  startTime = Date.now();
  clearInterval(timerId);
  timerId = setInterval(()=>{
    const elapsed = Date.now() - startTime;
    timeEl.textContent = formatTime(elapsed);
  }, 200);
}

function stopTimer(){
  clearInterval(timerId);
  timerId = null;
}

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

function createCard(emoji){
  const card = document.createElement('button');
  card.className = 'card';
  card.setAttribute('aria-label','Memory card');
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-face card-back">★</div>
      <div class="card-face card-front"><div class="emoji">${emoji}</div></div>
    </div>
  `;
  card.dataset.emoji = emoji;
  card.addEventListener('click', ()=> flip(card));
  return card;
}

function buildDeck(){
  const pairs = [...emojis, ...emojis];
  shuffle(pairs);
  deck = pairs.map(createCard);
  board.innerHTML = '';
  deck.forEach(c => board.appendChild(c));
}

function reset(){
  first = null; second = null; locked = false; moves = 0; matches = 0;
  movesEl.textContent = '0';
  timeEl.textContent = '00:00';
  stopTimer();
  startTime = null;
  overlay.classList.add('hidden');
  buildDeck();
}

function flip(card){
  if(locked) return;
  if(card === first) return;

  if(!startTime) startTimer();
  ensureAudio();
  beep(520, 0.06, 'square', 0.04);

  card.classList.add('flipped');

  if(!first){
    first = card; return;
  }

  second = card; locked = true; moves++;
  movesEl.textContent = String(moves);

  const match = first.dataset.emoji === second.dataset.emoji;
  if(match){
    matches++;
    first.setAttribute('disabled','true');
    second.setAttribute('disabled','true');
    first = null; second = null; locked = false;
    if(matches === emojis.length){
      stopTimer();
      finalMovesEl.textContent = String(moves);
      finalTimeEl.textContent = timeEl.textContent;
      ensureAudio();
      chord([523.25,659.25,783.99], 0.4, 0.07);
      speak(`Congratulations! You completed the game in ${moves} moves, time ${timeEl.textContent}.`);
      overlay.classList.remove('hidden');
    }
    else {
      ensureAudio();
      beep(700, 0.07, 'triangle', 0.05);
      setTimeout(()=>{ beep(880, 0.06, 'triangle', 0.045); }, 70);
    }
  } else {
    setTimeout(()=>{
      first.classList.remove('flipped');
      second.classList.remove('flipped');
      first = null; second = null; locked = false;
    }, 700);
    ensureAudio();
    beep(300, 0.08, 'sawtooth', 0.05);
    setTimeout(()=>{ beep(220, 0.09, 'sawtooth', 0.05); }, 110);
  }
}

resetBtn.addEventListener('click', reset);
playAgainBtn.addEventListener('click', reset);

reset();
