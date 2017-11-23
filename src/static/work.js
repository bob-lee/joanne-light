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
  const list = document.querySelectorAll('img.image1');
 
  let intersectionObserver;
  let intersectionRatio;
  let elementToObserve;
  let _indexToObserve;
 
  Object.defineProperty(this, "indexToObserve", {
    get: function () { return _indexToObserve; },
    set: function (value) {
      
      const len = list.length;
 
      if (_indexToObserve && (!value || value <= _indexToObserve || value >= len)) {
        console.error('indexToObserve', value);
        return;
      }
 
      _indexToObserve = value;
 
      // load more images
      for (let i = 0; i < INTERSECT_PAGESIZE; i++) {
        const index = _indexToObserve + i;
        if (index === len) { 
          return // reached page end 
        };

        // set 'src' to load image
        const img = list[index];
        img.setAttribute('src', img.getAttribute('data-src'));
        // optional thumb image
        const thumb = document.querySelector('img.image2[data-idx="' + index + '"]');
        if (thumb) {
          thumb.setAttribute('src', thumb.getAttribute('data-src'));
        }
        console.log('[' + index + ']');
      }
    }
  });
 
  try {
    intersectionObserver = new IntersectionObserver(function(entries) {
      const entry = entries[0]; // observe one element
      const currentRatio = intersectionRatio;
      const newRatio = entry.intersectionRatio;
      const boundingClientRect = entry.boundingClientRect;
      const scrollingDown = currentRatio !== undefined && newRatio < currentRatio &&
        boundingClientRect.bottom < boundingClientRect.height;
 
      intersectionRatio = newRatio;
 
      if (scrollingDown) {
        // it's scrolling down and observed image started to hide.
        // so unobserve it and start loading next images.
        const i = indexToObserve + INTERSECT_PAGESIZE;
        unobserve();
        indexToObserve = i;
        console.info(currentRatio + ' -> ' + newRatio + ' [' + i + ']');
      }
 
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  } catch (e) {
    console.error('failed to create IntersectionObserver:', e);
  }
 
  // register 'load' event handlers
  list.forEach(function(img) { 
    img.addEventListener('load', function() {
      observe(img);

      const idx = img.getAttribute('data-idx');
      const imgBox = document.querySelector('.image[data-idx="' + idx + '"]');
      imgBox.classList.add('show');
    });
  });
 
  indexToObserve = 0; // setter will trigger loading first images
 
  console.log('work', list.length, !!intersectionObserver);
 
  function observe(me) { // observe new element, me
    if (!me) {
      return;
    }
 
    const index = me.getAttribute('data-idx');
 
    if (index == indexToObserve) {
      elementToObserve = me;
      intersectionObserver.observe(me);
      console.info('elementToObserve', index);
    } else {
      console.log('observe(' + index + ' !== ' + indexToObserve + ')');
    }
  }
 
  function unobserve() { // unobserve current element
    if (elementToObserve) {
      intersectionObserver.unobserve(elementToObserve);
      intersectionRatio = undefined;
      console.info('unobserve [' + indexToObserve + ']');
    } else {
      console.log('null elementToObserve');
    }
  }

})();
