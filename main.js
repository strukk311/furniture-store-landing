/* =========================================================
   Furniro landing — front-end demo logic (vanilla JS)
   Cart and wishlist are stored in localStorage. No backend.
   ========================================================= */

   const PRODUCTS = [
    { id: 1,  name: 'Syltherine', desc: 'Stylish cafe chair',          price: 2500000, oldPrice: 3500000,  badge: '-30%', room: 'dining',  img: 'images/p-syltherine.jpg' },
    { id: 2,  name: 'Leviosa',    desc: 'Stylish cafe chair',          price: 2500000,                     badge: null,   room: 'living',  img: 'images/g-chair.jpg' },
    { id: 3,  name: 'Lolito',     desc: 'Luxury big sofa',             price: 7000000, oldPrice: 14000000, badge: '-50%', room: 'living',  img: 'images/p-lolito.webp' },
    { id: 4,  name: 'Respira',    desc: 'Outdoor bar table and stool', price: 500000,                      badge: 'New',  room: 'living',  img: 'images/p-respira.jpg' },
    { id: 5,  name: 'Grifo',      desc: 'Night lamp',                  price: 1500000,                     badge: null,   room: 'bedroom', img: 'images/g-shelf.jpg' },
    { id: 6,  name: 'Muggo',      desc: 'Small mug',                   price: 150000,                      badge: 'New',  room: 'dining',  img: 'images/g-vase.jpg' },
    { id: 7,  name: 'Pingky',     desc: 'Cute bed set',                price: 7000000, oldPrice: 14000000, badge: '-50%', room: 'bedroom', img: 'images/g-bed.jpg' },
    { id: 8,  name: 'Potty',      desc: 'Minimalist flower pot',       price: 500000,                      badge: 'New',  room: 'living',  img: 'images/g-stools.jpg' },
    { id: 9,  name: 'Oslo',       desc: 'Dining set for six',          price: 9800000, oldPrice: 12250000, badge: '-20%', room: 'dining',  img: 'images/g-dining.jpg' },
    { id: 10, name: 'Nordi',      desc: 'Writing desk',                price: 3200000,                     badge: null,   room: 'bedroom', img: 'images/g-desk.jpg' },
    { id: 11, name: 'Tavola',     desc: 'Side table with throw',       price: 1250000,                     badge: 'New',  room: 'dining',  img: 'images/range-dining.jpg' },
    { id: 12, name: 'Cosmo',      desc: 'Linen lounge sofa',           price: 6400000, oldPrice: 8000000,  badge: '-20%', room: 'living',  img: 'images/range-living.avif' },
  ];
  
  const PAGE_SIZE = 8;
  
  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const rupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
  
  const storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
    },
  };
  
  let toastTimer;
  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2400);
  }
  
  function bump(el) {
    el.classList.remove('is-bump');
    void el.offsetWidth; // restart animation
    el.classList.add('is-bump');
  }
  
  const ICONS = {
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    compare: '<svg viewBox="0 0 24 24"><path d="M4 8h14l-3-3M20 16H6l3 3"/></svg>',
    like: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.8 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.4 0 5.6 3.3 4.4 6.7C19.5 15.4 12 20 12 20Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  };
  
  /* =========================================================
     State
     ========================================================= */
  const state = {
    cart: storage.get('furniro-cart', []),          // [{ id, qty }]
    wishlist: storage.get('furniro-wishlist', []),  // [id]
    compare: [],
    filter: 'all',
    query: '',
    expanded: false,
  };
  
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  
  /* =========================================================
     Header: scroll shadow, burger, search
     ========================================================= */
  const header = $('#header');
  const burger = $('#burger');
  const nav = $('#nav');
  
  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }, { passive: true });
  
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__link').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  
  const searchToggle = $('#searchToggle');
  const searchBar = $('#searchBar');
  const searchInput = $('#searchInput');
  
  searchToggle.addEventListener('click', () => {
    const open = searchBar.hidden;
    searchBar.hidden = !open;
    searchToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      searchInput.focus();
    } else {
      searchInput.value = '';
      state.query = '';
      renderProducts();
    }
  });
  
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim().toLowerCase();
    renderProducts();
    if (state.query) {
      $('#products').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  $$('[data-toast]').forEach((btn) => btn.addEventListener('click', () => toast(btn.dataset.toast)));
  
  /* =========================================================
     Products
     ========================================================= */
  const grid = $('#productsGrid');
  const showMoreBtn = $('#showMore');
  const emptyMsg = $('#productsEmpty');
  
  function productTemplate(p) {
    const liked = state.wishlist.includes(p.id);
    const compared = state.compare.includes(p.id);
    const badge = p.badge
      ? `<span class="product__badge ${p.badge === 'New' ? 'product__badge--new' : 'product__badge--sale'}">${p.badge}</span>`
      : '';
    const old = p.oldPrice ? `<s>${rupiah(p.oldPrice)}</s>` : '';
  
    return `
      <li class="product" data-id="${p.id}">
        ${badge}
        <div class="product__img"><img src="${p.img}" alt="${p.name}, ${p.desc.toLowerCase()}" loading="lazy"></div>
        <div class="product__info">
          <h3 class="product__name">${p.name}</h3>
          <p class="product__desc">${p.desc}</p>
          <p class="product__price"><strong>${rupiah(p.price)}</strong>${old}</p>
        </div>
        <div class="product__overlay">
          <button class="product__add" type="button" data-action="add">Add to cart</button>
          <div class="product__actions">
            <button class="product__action" type="button" data-action="share" aria-label="Share ${p.name}">${ICONS.share}<span>Share</span></button>
            <button class="product__action" type="button" data-action="compare" aria-pressed="${compared}" aria-label="Compare ${p.name}">${ICONS.compare}<span>Compare</span></button>
            <button class="product__action" type="button" data-action="like" aria-pressed="${liked}" aria-label="Like ${p.name}">${ICONS.like}<span>Like</span></button>
          </div>
        </div>
      </li>`;
  }
  
  function renderProducts(animateFrom = -1) {
    const list = PRODUCTS.filter((p) => {
      const roomOk = state.filter === 'all' || p.room === state.filter;
      const queryOk = !state.query || `${p.name} ${p.desc}`.toLowerCase().includes(state.query);
      return roomOk && queryOk;
    });
  
    // search and filters show everything they find; plain view is paginated
    const paginate = state.filter === 'all' && !state.query;
    const visible = paginate && !state.expanded ? list.slice(0, PAGE_SIZE) : list;
  
    grid.innerHTML = visible.map(productTemplate).join('');
  
    if (animateFrom >= 0) {
      $$('.product', grid).slice(animateFrom).forEach((el, i) => {
        el.classList.add('is-new-in');
        el.style.animationDelay = `${i * 70}ms`;
      });
    }
  
    emptyMsg.hidden = list.length > 0;
    showMoreBtn.parentElement.hidden = !paginate || list.length <= PAGE_SIZE;
    showMoreBtn.textContent = state.expanded ? 'Show less' : 'Show more';
  }
  
  showMoreBtn.addEventListener('click', () => {
    state.expanded = !state.expanded;
    renderProducts(state.expanded ? PAGE_SIZE : -1);
    if (!state.expanded) $('#products').scrollIntoView({ behavior: 'smooth' });
  });
  
  function setFilter(filter) {
    state.filter = filter;
    $$('.chip').forEach((c) => c.classList.toggle('is-active', c.dataset.filter === filter));
    renderProducts();
  }
  $$('.chip').forEach((chip) => chip.addEventListener('click', () => setFilter(chip.dataset.filter)));
  $$('.range__item').forEach((item) => item.addEventListener('click', () => setFilter(item.dataset.filter)));
  
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = Number(btn.closest('.product').dataset.id);
    const product = findProduct(id);
  
    switch (btn.dataset.action) {
      case 'add':
        addToCart(id);
        toast(`${product.name} added to cart`);
        break;
  
      case 'share': {
        const url = `${location.origin}${location.pathname}#products`;
        try {
          if (navigator.share) {
            await navigator.share({ title: product.name, text: product.desc, url });
          } else {
            await navigator.clipboard.writeText(url);
            toast('Link copied');
          }
        } catch {
          /* share dialog closed */
        }
        break;
      }
  
      case 'compare': {
        const on = !state.compare.includes(id);
        if (on && state.compare.length >= 3) {
          toast('You can compare up to 3 products');
          return;
        }
        state.compare = on ? [...state.compare, id] : state.compare.filter((x) => x !== id);
        btn.setAttribute('aria-pressed', String(on));
        toast(on ? `${product.name} added to compare (${state.compare.length}/3)` : `${product.name} removed from compare`);
        break;
      }
  
      case 'like': {
        const on = !state.wishlist.includes(id);
        state.wishlist = on ? [...state.wishlist, id] : state.wishlist.filter((x) => x !== id);
        storage.set('furniro-wishlist', state.wishlist);
        btn.setAttribute('aria-pressed', String(on));
        updateWishCount(true);
        toast(on ? `${product.name} added to wishlist` : `${product.name} removed from wishlist`);
        break;
      }
    }
  });
  
  /* wishlist */
  const wishCount = $('#wishCount');
  function updateWishCount(animate = false) {
    wishCount.textContent = state.wishlist.length;
    wishCount.hidden = state.wishlist.length === 0;
    if (animate) bump(wishCount);
  }
  $('#wishlistBtn').addEventListener('click', () => {
    const n = state.wishlist.length;
    toast(n ? `You have ${n} item${n > 1 ? 's' : ''} in your wishlist` : 'Your wishlist is empty. Tap Like on a product to save it.');
  });
  
  /* =========================================================
     Cart
     ========================================================= */
  const cartEl = $('#cart');
  const overlay = $('#overlay');
  const cartList = $('#cartList');
  const cartCount = $('#cartCount');
  let lastFocus = null;
  
  const cartTotal = () => state.cart.reduce((sum, item) => sum + findProduct(item.id).price * item.qty, 0);
  
  function saveCart() {
    storage.set('furniro-cart', state.cart);
    renderCart();
  }
  
  function addToCart(id) {
    const item = state.cart.find((i) => i.id === id);
    if (item) item.qty += 1;
    else state.cart.push({ id, qty: 1 });
    saveCart();
    bump(cartCount);
  }
  
  function changeQty(id, delta) {
    const item = state.cart.find((i) => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
    saveCart();
  }
  
  function renderCart() {
    const count = state.cart.reduce((n, i) => n + i.qty, 0);
    cartCount.textContent = count;
    cartCount.hidden = count === 0;
  
    const empty = state.cart.length === 0;
    $('#cartEmpty').hidden = !empty;
    $('#cartFoot').hidden = empty;
    cartList.hidden = empty;
  
    cartList.innerHTML = state.cart.map(({ id, qty }) => {
      const p = findProduct(id);
      return `
        <li class="cart-item" data-id="${id}">
          <img src="${p.img}" alt="">
          <div>
            <p class="cart-item__name">${p.name}</p>
            <p class="cart-item__price">${rupiah(p.price)}</p>
            <div class="qty">
              <button type="button" data-qty="-1" aria-label="Decrease quantity of ${p.name}">−</button>
              <span aria-live="polite">${qty}</span>
              <button type="button" data-qty="1" aria-label="Increase quantity of ${p.name}">+</button>
            </div>
          </div>
          <button class="cart-item__remove" type="button" data-remove aria-label="Remove ${p.name}">${ICONS.trash}</button>
        </li>`;
    }).join('');
  
    $('#cartTotal').textContent = rupiah(cartTotal());
  }
  
  cartList.addEventListener('click', (e) => {
    const item = e.target.closest('.cart-item');
    if (!item) return;
    const id = Number(item.dataset.id);
    const qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) changeQty(id, Number(qtyBtn.dataset.qty));
    if (e.target.closest('[data-remove]')) {
      state.cart = state.cart.filter((i) => i.id !== id);
      saveCart();
    }
  });
  
  function openCart() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-visible'));
    cartEl.classList.add('is-open');
    cartEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    setMenu(false);
    $('#cartClose').focus();
  }
  
  function closeCart() {
    overlay.classList.remove('is-visible');
    cartEl.classList.remove('is-open');
    cartEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setTimeout(() => { overlay.hidden = true; }, 300);
    lastFocus?.focus();
  }
  
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartBrowse').addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  $$('[data-open-cart]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));
  
  /* =========================================================
     Checkout modal + validation
     ========================================================= */
  const modal = $('#checkout');
  const checkoutForm = $('#checkoutForm');
  
  function openCheckout() {
    closeCart();
    $('#checkoutTotal').textContent = rupiah(cartTotal());
    $('#checkoutFormWrap').hidden = false;
    $('#checkoutSuccess').hidden = true;
    modal.hidden = false;
    document.body.classList.add('is-locked');
    setTimeout(() => $('#cName').focus(), 50);
  }
  
  function closeCheckout() {
    modal.hidden = true;
    document.body.classList.remove('is-locked');
  }
  
  $('#checkoutBtn').addEventListener('click', openCheckout);
  $('#checkoutClose').addEventListener('click', closeCheckout);
  $('#successClose').addEventListener('click', closeCheckout);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeCheckout(); });
  
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!modal.hidden) closeCheckout();
    else if (cartEl.classList.contains('is-open')) closeCart();
    else setMenu(false);
  });
  
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\+?[\d\s()-]{9,18}$/;
  
  function validateField(input) {
    const v = input.value.trim();
    let msg = '';
    if (!v) msg = 'This field is required.';
    else if (input.type === 'email' && !EMAIL_RE.test(v)) msg = 'Enter an email like name@example.com.';
    else if (input.type === 'tel' && !PHONE_RE.test(v)) msg = 'Enter a phone number with at least 9 digits.';
    else if (input.minLength > 0 && v.length < input.minLength) msg = `Enter at least ${input.minLength} characters.`;
  
    const error = input.parentElement.querySelector('.field-error');
    if (error) error.textContent = msg;
    input.setAttribute('aria-invalid', String(Boolean(msg)));
    return !msg;
  }
  
  $$('input, textarea', checkoutForm).forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });
  
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = $$('input, textarea', checkoutForm);
    const results = fields.map(validateField);
    const firstInvalid = fields[results.indexOf(false)];
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    state.cart = [];
    saveCart();
    checkoutForm.reset();
    fields.forEach((f) => f.removeAttribute('aria-invalid'));
    $('#checkoutFormWrap').hidden = true;
    $('#checkoutSuccess').hidden = false;
    $('#successClose').focus();
  });
  
  /* newsletter */
  const subscribeForm = $('#subscribeForm');
  const subscribeEmail = $('#subscribeEmail');
  const subscribeError = $('#subscribeError');
  
  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = subscribeEmail.value.trim();
    const msg = !v ? 'Enter your email to subscribe.' : !EMAIL_RE.test(v) ? 'Enter an email like name@example.com.' : '';
    subscribeError.textContent = msg;
    subscribeEmail.setAttribute('aria-invalid', String(Boolean(msg)));
    if (msg) return;
    subscribeForm.reset();
    subscribeEmail.removeAttribute('aria-invalid');
    toast('Subscribed. Watch your inbox for new arrivals.');
  });
  
  /* =========================================================
     Tips slider (native scroll-snap + arrows + dots)
     ========================================================= */
  const track = $('#sliderTrack');
  const slides = $$('.tip', track);
  const dotsWrap = $('#sliderDots');
  const prevBtn = $('.slider__arrow--prev');
  const nextBtn = $('.slider__arrow--next');
  
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'slider__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Article ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = $$('.slider__dot', dotsWrap);
  
  const step = () => slides[1].offsetLeft - slides[0].offsetLeft;
  const maxScroll = () => track.scrollWidth - track.clientWidth;
  
  function goTo(i) {
    track.scrollTo({ left: Math.min(i * step(), maxScroll()) });
  }
  
  function updateSlider() {
    const atEnd = track.scrollLeft >= maxScroll() - 2;
    const index = atEnd ? slides.length - 1 : Math.round(track.scrollLeft / step());
    dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === index)));
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = atEnd;
    // keep arrows centred on the image
    document.querySelector('.slider').style.setProperty('--img-h', `${$('.tip__img').offsetHeight}px`);
  }
  
  prevBtn.addEventListener('click', () => track.scrollBy({ left: -step() }));
  nextBtn.addEventListener('click', () => track.scrollBy({ left: step() }));
  track.addEventListener('scroll', () => requestAnimationFrame(updateSlider), { passive: true });
  window.addEventListener('resize', updateSlider);
  
  /* =========================================================
     Gallery reveal on scroll
     ========================================================= */
  const tiles = $$('.g');
  if ('IntersectionObserver' in window) {
    tiles.forEach((t, i) => {
      t.classList.add('reveal');
      t.style.setProperty('--d', `${(i % 4) * 0.08}s`);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    tiles.forEach((t) => io.observe(t));
  }
  
  /* =========================================================
     Init
     ========================================================= */
  // drop saved items that no longer exist in the catalogue
  state.cart = state.cart.filter((i) => findProduct(i.id));
  renderProducts();
  renderCart();
  updateWishCount();
  window.addEventListener('load', updateSlider);
  updateSlider();