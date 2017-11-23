(function() {
  var profile = document.querySelector('#profile');
  var state = 'paused';
  console.log('profile');
  profile.addEventListener('click', function(e) {
    state = state === 'paused' ? 'running' : 'paused';
    profile.style['animation-play-state'] = state;
  });
})();
