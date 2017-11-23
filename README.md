# Joanne Lee - lightweight

This is a lightweight version of original [Joanne's website](https://github.com/bob-lee/ng-joanne-lee), shows images of her works. 

- no `Angular` framework (no page transition animation, ..)
- get image urls from REST API by `firebase cloud function`
- server-side rendering by `firebase cloud function`
- offline capability by `workbox`
- using `IntersectionObserver` api for lazy loadig offscreen images

```bash
# Initial build
git clone https://github.com/bob-lee/joanne-light.git
npm i
npm run build

# Firebase Hosting Emulation
node_modules/.bin/firebase login 
# Use your own project
node_modules/.bin/firebase use -add <your-test-proj>
npm run serve
```
