export const header = `
  <nav class="header-menu">
    <a class="header-menu-item {{isActive path 'profile'}}" href="/profile">profile</a>
    <div class="ddm {{isWork titleWork}}">
      <input type="checkbox" id="ddm-1">
      <label for="ddm-1" class="header-menu-item">{{titleWork}}</label>
      <i class="fa fa-angle-right fa-lg" aria-hidden="true"></i>
      <div class="dd">
        <a class="{{isActive path 'portrait'}}" href="/work/portrait">portrait</a>
        <a class="{{isActive path 'painting'}}" href="/work/painting">painting</a>
        <a class="{{isActive path 'illustration'}}" href="/work/illustration">illustration</a>
      </div>
    </div>
    <a class="header-menu-item {{isActive path 'contact'}}" href="/contact">contact</a>
  </nav>
`;

export const home = `
  <div class="home">

  </div>
`;

export const profile = `
  <div class="profile" id="profile">

    <div class="content">
      <span>
        Hi, I am Joanne, was an illustrator for children's books in South Korea, enjoying country like lifestyle here in Wairarapa, New Zealand, love to share some of my works. Enjoy!
      </span>
      <ul>
        <li>Illustrator at Dongsuh Publishing Company, 1986-88</li>
        <li>Personal exhibition at Seoul, 1989</li>
        <li>Freelance illustrator for children's books, magazines and postcards, 1989-99</li>
      </ul>
    </div>

  </div>
  <script defer src="/profile.js"></script>
`;

export const contact = `
  <div class="contact">

    <div class="content">
      <p>
        Are you interested in having your own portrait or have any enquiry?
      </p>

      <p>
        Please send me an email:
      </p>

      <a href="mailto:joannelee133@gmail.com">
        <i class="fa fa-envelope" aria-hidden="true"></i>
        joannelee133@gmail.com
      </a>

      <p>
        or drop me a call:
      </p>

      <a id="phone" href="tel:+64277564652">
        <i class="fa fa-phone" aria-hidden="true"></i>
        +64 027 756 4652
      </a>

    </div>

  </div>
  <script defer src="/contact.js"></script>
`;

export const work = `
  <div id="images" class="images">

    {{#each images}}
      <div class="image" data-idx="{{@index}}">
        <picture>
          <img data-idx="{{@index}}" data-src="{{imageSrc this}}" class="image1" alt="{{this.fileName}}">
        </picture>

        <div class="expand">
          <span>{{this.text}}</span>
          {{#if this.thumbUrl}}
          <img data-idx="{{@index}}" data-src="{{thumbSrc this}}" class="image2" alt="thumb">
          {{/if}}
        </div>
      </div>
    {{/each}}

  </div>
  <script defer src="/intersection-observer.js"></script>
  <script defer src="/work.js"></script>
`;
