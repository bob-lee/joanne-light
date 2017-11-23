(function() {
  var phone = document.querySelector('#phone');
  var isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
  if (!isTouchDevice) {
    phone.removeAttribute('href');
  }
})();
