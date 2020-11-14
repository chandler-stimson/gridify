{
  const config = {
    steps: 30,
    removeByWeight: 0.1
  };

  const colors = ['#794c74', '#c56183', '#fadcaa', '#b2deec'];

  const detect = (left, top, width, height, bypass = true) => {
    let es = [];
    for (let x = left; x <= left + width; x += width / config.steps) {
      for (let y = top; y <= top + height; y += height / config.steps) {
        const e = [...document.elementsFromPoint(x * innerWidth / 100, y * innerHeight / 100)]
          .filter(e => {
            if (e.tagName === 'INPUT' || e.tagName === 'A') {
              return true;
            }
            if (e.getAttribute('tabindex')) {
              return true;
            }
            if (getComputedStyle(e).cursor === 'pointer') {
              return true;
            }
          }).shift();

        if (e) {
          const index = es.indexOf(e);
          if (index === -1) {
            es.push(e);

            if (es.length > 2) {
              break;
            }
          }
        }
      }
    }
    const overlaps = es.map(e => {
      const box = e.getBoundingClientRect();
      const area =
        (Math.min(box.right, (left + width) / 100 * innerWidth) - Math.max(box.left, left / 100 * innerWidth)) *
        (Math.min(box.bottom, (top + height) / 100 * innerHeight) - Math.max(box.top, top / 100 * innerHeight));

      return area / (box.width * box.height);
    });
    if (config.removeByWeight) {
      const mes = es.filter((e, i) => overlaps[i] > config.removeByWeight);
      if (mes.length) {
        es = mes;
      }
    }

    if (!bypass) {
      // if one element is child of the other one
      if (es.length === 2) {
        if (es[0].contains(es[1])) {
          es = [es[0]];
        }
        else if (es[1].contains(es[0])) {
          es = [es[1]];
        }
      }

      if (es.length === 1) {
        const e = es[0];
        e.focus();
        if (e !== document.querySelector(':focus')) {
          e.click();
        }
        remove();
      }
      else if (es.length === 0) {
        remove();
        chrome.runtime.sendMessage({
          method: 'notify',
          message: 'No link or selectable element is detected'
        });
      }
    }
  };

  const history = [];
  const find = digit => {
    history.push(digit);

    let left = 0;
    let top = 0;
    let width = 100;
    let height = 100;
    for (const n of history) {
      if (n === 2 || n === 5 || n === 8) {
        left += width / 3;
      }
      if (n === 3 || n === 6 || n === 9) {
        left += width * 2 / 3;
      }
      if (n === 4 || n === 5 || n === 6) {
        top += height / 3;
      }
      if (n === 1 || n === 2 || n === 3) {
        top += height * 2 / 3;
      }
      width = width / 3;
      height = height / 3;
    }

    build(left, top, width, height, colors[history.length % colors.length], history.length);
    detect(left, top, width, height, false);
  };

  const keydown = e => {
    if (e.code.startsWith('Digit') || e.code.startsWith('Numpad')) {
      find(Number(e.key));
    }
    else if (e.code === 'Backspace' || e.code === 'Delete') {
      remove(history.length);
      history.pop();
      opacity();
    }
    else {
      remove();
    }
    e.preventDefault();
  };
  const click = () => {
    remove();
  };

  const remove = level => {
    if (level) {
      [...document.querySelectorAll('.level-' + level)].forEach(r => r.remove());
    }
    else {
      [...document.querySelectorAll('.grid-view')].forEach(r => r.remove());
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('click', click);
    }
  };

  const opacity = () => {
    [...document.querySelectorAll('.grid-view')].forEach((f, i) => {
      f.style.opacity = i === history.length ? '1' : '0.1';
    });
  };

  const build = (left, top, width, height, color, level = 0) => {
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('data/view/index.html');
    iframe.classList.add('grid-view', 'level-' + level);
    iframe.style = `
      position: fixed;
      z-index: 2147483647;
      border: none;
      left: ${left}%;
      top: ${top}%;
      width: ${width}%;
      height: ${height}%;
      pointer-events: none;
    `;
    document.documentElement.appendChild(iframe);
    opacity();
  };
  remove();
  build(0, 0, 100, 100, '#000');
  detect(0, 0, 100, 100, true);

  document.addEventListener('keydown', keydown);
  document.addEventListener('click', click);
}
