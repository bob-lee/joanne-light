(function () {

  if ('NodeList' in window && !NodeList.prototype.forEach) {
    console.info('polyfill for IE11');
    NodeList.prototype.forEach = function (callback, thisArg) {
      thisArg = thisArg || window;
      for (var i = 0; i < this.length; i++) {
        callback.call(thisArg, this[i], i, this);
      }
    };
  }

  const INTERSECT_PAGESIZE = 2;

  class Work {
    list: NodeListOf<Element>;
    intersectionObserver: IntersectionObserver;
    intersectionRatio: number | undefined;
    elementToObserve: Element;
    private _indexToObserve: number; // only to grow from 0 as scrolling down
    get indexToObserve() { return this._indexToObserve; }
    set indexToObserve(value) {
      const len = this.list.length;
      if (this._indexToObserve && (!value || value <= this._indexToObserve || value >= len)) {
        console.error(`indexToObserve(${value})`);
        return;
      }

      this._indexToObserve = value;

      // update 'toLoad' to load more images
      for (let i = 0; i < INTERSECT_PAGESIZE; i++) {
        const index = this._indexToObserve + i;
        if (index === len) { return; }
        const imageEl = this.list[index];
        imageEl.setAttribute('src', imageEl.getAttribute('data-src') || '');
        const thumbEl = document.querySelector('img.image2[data-idx="' + index + '"]');
        if (thumbEl) {
          thumbEl.setAttribute('src', thumbEl.getAttribute('data-src') || '');
        }
        console.log('[' + index + ']');
      }
    }

    constructor() {
      try {

        this.intersectionObserver = new IntersectionObserver(entries => {
          const entry = entries[0];
          const currentRatio = this.intersectionRatio;
          const newRatio = entry.intersectionRatio;
          const boundingClientRect = entry.boundingClientRect;
          const scrollingDown = currentRatio !== undefined && newRatio < currentRatio &&
            boundingClientRect.bottom < boundingClientRect.height;

          this.intersectionRatio = newRatio;

          if (scrollingDown) {
            const i = this.indexToObserve + INTERSECT_PAGESIZE;
            this.unobserve();
            this.indexToObserve = i;
            console.info(`${currentRatio} -> ${newRatio} [${i}]`);
          }

        }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
      } catch (e) {
        console.error(`failed to create IntersectionObserver:`, e);
      }
    }

    observe(me: Element) { // observe new element, me
      if (!me) {
        console.warn(`observe() invalid input: ${me}`);
        return;
      }

      const index = me.getAttribute('data-idx');

      if (Number(index) === this.indexToObserve) {
        this.elementToObserve = me;
        this.intersectionObserver.observe(me);
        console.info(`elementToObserve = ${index}`);
      } else {
        console.log(`observe(${index} !== ${this.indexToObserve})`);
      }
    }

    unobserve() { // unobserve current element
      if (this.elementToObserve) {
        this.intersectionObserver.unobserve(this.elementToObserve);
        this.intersectionRatio = undefined;
        console.info(`unobserve [${this.indexToObserve}]`);
      } else {
        console.log(`null elementToObserve`);
      }
    }

    init() {
      this.list = document.querySelectorAll('img.image1');
      this.list.forEach(img => img.addEventListener('load', _ => this.observe(img)));
      this.indexToObserve = 0;
    }

  }

  const work = new Work();
  work.init();

})();
