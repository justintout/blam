import { v4 as uuidv4 } from 'uuid';

const startMark = 'round-start';
const endMark = 'round-end';
const lastGameMeasure = 'last-game';

type GameState = 'idle' | 'starting' | 'canceling' | 'running' | 'flipped' | 'roundend';

class Game {
  startCode = 'Space';
  reactCode = 'Space';
  state: GameState = 'idle';
  measures: string[] = [];
  
  div: HTMLDivElement;
  history: HTMLUListElement;

  constructor(div: HTMLDivElement, history: HTMLUListElement) {
    this.div = div;
    this.history = history;
    this.state = 'idle';
  }
  
  onTouchStart = (e: TouchEvent) => {
    if (this.state !== 'running') {
      e.target.dispatchEvent(new KeyboardEvent('keypress', {
        code: "Space"
      }));
      return;
    }
    e.target.dispatchEvent(new KeyboardEvent('keydown', {
      code: "Space"
    }));
  }
  
  onKeypress = (e: KeyboardEvent) => {
    console.log(`keypress ${this.state}`, e, this);

    if (e.code !== this.startCode) {
      return;
    }

    switch (this.state) {
      case 'idle':
        this.state = 'starting';
        this.round();
        return;
      case 'starting':
        this.state = 'canceling';
        return;
      case 'roundend':
        this.reset();
        return;
      case 'running':
      case 'canceling':
        return;
    }
  }
  
  onKeydown = (e: KeyboardEvent) => {
    if (this.state !== 'running' || e.code !== this.reactCode) {
      return;
    }
    this.endRound();
    return;
  }
  
  async round() {
    const loop = 10;
    const cancelMsg = `(Press <kbd>Space</kdb> to cancel)`
    this.div.innerHTML = '<b>3</b> ' + cancelMsg;
    for (let i = 3000; i -= loop; i === 0) {
      if (this.state === 'canceling') {
        this.reset();
        return;
      }
      if (i === 2000) {
        this.div.innerHTML = '<b>2</b> ' + cancelMsg;
      }
      if (i === 1000) {
        this.div.textContent = '<b>1</b> ' + cancelMsg;
      }
      await delay(loop);
    }
    const pop = Math.floor(Math.random() * 3000) + 750;
    this.div.textContent = 'WAIT';
    document.addEventListener('keypress', () => {
      this.endRound();
    }, {once: true});
    console.log("popping ", pop);
    setTimeout(() => this.flip(), pop);
    console.log(this.div);
  }
  

  flip() {
    console.log(this);
    console.log(this.div);
    this.state = 'flipped';
    this.div.style.backgroundColor = 'rebeccapurple';
    window.performance.mark(startMark);
    this.div.innerHTML = `<b>PRESS NOW!</b>`;
  }

  endRound() {
    if (this.state !== 'flipped') {
      this.state = 'roundend';
      window.performance.mark(endMark);
      this.div.innerHTML = '<b>TOO EARLY!</b> Press <kbd>Space</kbd> to reset.';
      return;
    }
    window.performance.mark(endMark);
    this.state = 'roundend';
    window.performance.measure(lastGameMeasure, startMark, endMark);
    window.performance.measure("round-" + uuidv4(), startMark, endMark);
    const measure = window.performance.getEntriesByName(lastGameMeasure);
    this.div.textContent = measure[0].duration.toPrecision(3);
    console.log(measure[0].toJSON());
  }

  reset() {
    const measure = window.performance.getEntriesByName(lastGameMeasure);
    const entry = document.createElement('li')
    if (measure.length !== 0) {
      entry.textContent = measure[0].duration.toPrecision(3);
      this.history.appendChild(entry);
    }
    this.state = 'idle';
    this.div.style.backgroundColor = 'white';
    performance.clearMarks();
    performance.clearMeasures(lastGameMeasure);
    this.div.innerHTML = `Press <kbd>Space</kbd> to start the round.`;
  }
}

async function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

(function(){ 
  const game = new Game(document.querySelector("div#game"), document.querySelector("ul#history"));
  
  document.addEventListener("keypress", game.onKeypress);
  document.addEventListener("touchstart", game.onTouchStart);
  document.addEventListener("keydown", game.onKeydown);
})();