/* Sumont Bela Vista — Eco Lodge
   Movimento: GSAP + ScrollTrigger (coreografia) e Lenis (rolagem suave).
   Todo conteúdo é visível por padrão; os estados iniciais só são aplicados via JS. */

(() => {
  const WHATSAPP = "5531984713632"; // [CONFIRMAR] número oficial

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  /* ---------- WhatsApp: uma mensagem por origem ---------- */
  $$("[data-wa]").forEach((el) => {
    el.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(el.dataset.wa)}`;
    el.target = "_blank";
    el.rel = "noopener";
  });
  const year = $("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  const curtain = $("[data-curtain]");
  const nav = $("[data-nav]");
  const hero = $("[data-hero]");
  const waFloat = $(".wa-float");

  /* ---------- Além da cabana: item ativo troca a imagem ---------- */
  const places = $$(".place-item");
  const frames = $$(".beyond__frame img");
  function activatePlace(item) {
    const i = Number(item.dataset.img);
    places.forEach((el) => {
      el.classList.toggle("is-active", el === item);
      el.querySelector("button").setAttribute("aria-pressed", String(el === item));
    });
    frames.forEach((img, k) => img.classList.toggle("is-active", k === i));
  }
  places.forEach((item) => {
    const btn = item.querySelector("button");
    item.addEventListener("mouseenter", () => activatePlace(item));
    btn.addEventListener("focus", () => activatePlace(item));
    btn.addEventListener("click", () => activatePlace(item));
  });

  /* ---------- Filme das cabanas: botão próprio, som ligado, pausa fora da tela ---------- */
  const film = $("[data-film]");
  if (film) {
    const video = $("video", film);
    const play = $("[data-film-play]", film);
    play.addEventListener("click", () => {
      video.controls = true;
      video.muted = false;
      video.play().catch(() => { film.classList.remove("is-playing"); });
      video.focus({ preventScroll: true });
    });
    video.addEventListener("play", () => film.classList.add("is-playing"));
    video.addEventListener("ended", () => {
      film.classList.remove("is-playing");
      video.controls = false;
      video.load(); // volta à capa
      play.focus({ preventScroll: true });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && !video.paused) video.pause();
      }, { threshold: 0.25 }).observe(film);
    }
  }

  /* ---------- Vídeo final: tocar só quando visível ---------- */
  const closingVideo = $(".closing__video");
  if (closingVideo && "IntersectionObserver" in window && !reduceMotion) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // Capa e vídeo só carregam quando o visitante chega perto do fim da página
        if (closingVideo.dataset.poster) { closingVideo.poster = closingVideo.dataset.poster; delete closingVideo.dataset.poster; }
        if (closingVideo.preload === "none") { closingVideo.preload = "auto"; closingVideo.load(); }
        closingVideo.play().catch(() => {});
      } else {
        closingVideo.pause();
      }
    }, { rootMargin: "600px 0px" }).observe(closingVideo);
  } else if (closingVideo) {
    // Movimento reduzido: sem vídeo em loop, só a capa
    closingVideo.poster = closingVideo.dataset.poster || closingVideo.poster;
  }

  /* ---------- Menu e botão flutuante (sem GSAP também funciona) ---------- */
  let lastY = window.scrollY;
  let heroH = hero.offsetHeight; // medido fora do evento de rolagem
  window.addEventListener("resize", () => { heroH = hero.offsetHeight; });
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
  function updateChrome(y = window.scrollY) {
    const past = y > heroH * 0.85;
    nav.classList.toggle("is-solid", past);
    waFloat.classList.toggle("is-visible", past);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    // Nunca esconde o menu enquanto algo dentro dele tem foco do teclado
    if (past && goingDown && !nav.contains(document.activeElement)) nav.classList.add("is-hidden");
    if (goingUp || !past) nav.classList.remove("is-hidden");
    lastY = y;
  }

  /* ---------- Sem GSAP ou com movimento reduzido: página estática e completa ---------- */
  if (!hasGsap || reduceMotion) {
    curtain?.remove();
    window.addEventListener("scroll", () => updateChrome(), { passive: true });
    updateChrome();
    setupFaq(false);
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out" });

  /* ---------- Rolagem suave ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on("scroll", ({ scroll }) => { ScrollTrigger.update(); updateChrome(scroll); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  } else {
    window.addEventListener("scroll", () => updateChrome(), { passive: true });
  }

  // Âncoras internas passam pela rolagem suave
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 ? $(id) : null;
      if (!target || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.6, offset: -80 });
      history.replaceState(null, "", id);
    });
  });

  /* ---------- Divisão de texto ---------- */
  function splitLines(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.textContent = "";
    const spans = words.map((w, i) => {
      const s = document.createElement("span");
      s.textContent = w;
      s.setAttribute("aria-hidden", "true");
      el.append(s, i < words.length - 1 ? " " : "");
      return s;
    });
    const lines = [];
    spans.forEach((s) => {
      const top = s.offsetTop;
      const last = lines[lines.length - 1];
      if (!last || Math.abs(last.top - top) > 4) lines.push({ top, words: [s.textContent] });
      else last.words.push(s.textContent);
    });
    el.textContent = "";
    return lines.map(({ words: ws }) => {
      const line = document.createElement("span");
      line.className = "line";
      line.setAttribute("aria-hidden", "true");
      const inner = document.createElement("span");
      inner.className = "line__inner";
      inner.textContent = ws.join(" ");
      line.append(inner);
      el.append(line);
      return inner;
    });
  }

  function splitWords(el, cls = "w") {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", words.join(" "));
    el.textContent = "";
    return words.map((w, i) => {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = w;
      s.setAttribute("aria-hidden", "true");
      el.append(s, i < words.length - 1 ? " " : "");
      return s;
    });
  }

  function splitChars(el) {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    return [...text].map((c) => {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = c;
      s.setAttribute("aria-hidden", "true");
      el.append(s);
      return s;
    });
  }

  /* ---------- Início: espera fontes e a foto do hero ---------- */
  const heroImg = $(".hero__bg");
  const imgReady = heroImg.complete ? Promise.resolve() : new Promise((r) => { heroImg.onload = r; heroImg.onerror = r; });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 2800));
  Promise.race([Promise.all([imgReady, fontsReady]), timeout]).then(start);

  function start() {
    const heroLines = splitLines($(".hero__title"));
    const heroFades = $$("[data-fade]", hero);
    const chips = $$("[data-chip]", hero);
    const stats = $$(".hero__stats > div", hero);
    const word = $(".hero__word");
    const scene = $("[data-scene]");

    gsap.set(heroLines, { yPercent: 110 });
    gsap.set(heroFades, { opacity: 0, y: 18 }); // opacity (não autoAlpha): o botão continua focável
    gsap.set(chips, { autoAlpha: 0, scale: 0.85 });
    gsap.set(stats, { autoAlpha: 0, y: 16 });
    gsap.set(word, { yPercent: 55, autoAlpha: 0 });
    gsap.set(".hero__bg", { scale: 1.14, filter: "blur(8px)" });
    gsap.set(".hero__cabin", { scale: 1.14 });

    /* O momento autoral: a cortina com o S se abre e o SUMONT sobe por trás da cabana */
    const intro = gsap.timeline({ onComplete: () => { curtain?.remove(); lenis?.start(); heroExit(); ScrollTrigger.refresh(); } });
    intro
      .fromTo(".curtain__mark", { autoAlpha: 0, scale: 0.7 }, { autoAlpha: 1, scale: 1, duration: 0.7 })
      .to(".curtain__mark", { autoAlpha: 0, scale: 1.15, duration: 0.45, ease: "power2.in" }, "+=0.15")
      .to(curtain, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=0.1")
      .to([".hero__bg", ".hero__cabin"], { scale: 1, duration: 2.2, ease: "expo.out" }, "-=0.75")
      .to(".hero__bg", { filter: "blur(0px)", duration: 1.4, ease: "power2.out" }, "<")
      .to(word, { yPercent: 0, autoAlpha: 1, duration: 1.8 }, "-=1.6")
      .to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.09 }, "-=1.3")
      .to(heroFades, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, "-=0.9")
      .to(stats, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, "-=0.8")
      .to(chips, { autoAlpha: 1, scale: 1, duration: 0.9, stagger: 0.14, ease: "back.out(1.6)" }, "-=0.9");

    /* Profundidade: a foto e a palavra se movem em planos diferentes */
    if (finePointer) {
      const sceneX = gsap.quickTo(scene, "x", { duration: 1.2, ease: "power3.out" });
      const sceneY = gsap.quickTo(scene, "y", { duration: 1.2, ease: "power3.out" });
      const wordX = gsap.quickTo(word, "x", { duration: 1.4, ease: "power3.out" });
      const wordY = gsap.quickTo(word, "y", { duration: 1.4, ease: "power3.out" });
      hero.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        sceneX(nx * -14); sceneY(ny * -8);
        wordX(nx * 26); wordY(ny * 12);
      });
    }

    /* Saída do hero ao rolar (criada depois da entrada): a palavra sobe mais rápido que a cabana */
    function heroExit() {
      gsap.timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } })
        .to(word, { yPercent: -70, ease: "none" }, 0)
        .to(scene, { yPercent: 10, scale: 1.06, ease: "none" }, 0)
        .to(".hero__content", { yPercent: -30, opacity: 0, ease: "none" }, 0)
        .to(chips, { autoAlpha: 0, ease: "none", duration: 0.4 }, 0);
    }

    setupScroll();
    setupMagnetic();
    setupFaq(true);
    updateChrome();
    ScrollTrigger.refresh();
  }

  /* ---------- Revelações ao rolar ---------- */
  function setupScroll() {
    // Títulos: linha a linha
    $$("[data-split]").forEach((el) => {
      if (hero.contains(el)) return;
      const lines = splitLines(el);
      gsap.from(lines, {
        yPercent: 110,
        duration: 1.3,
        stagger: 0.09,
        scrollTrigger: { trigger: el, start: "top 86%" },
      });
    });

    // Textos de apoio
    $$("[data-fade]").forEach((el) => {
      if (hero.contains(el)) return;
      gsap.from(el, {
        opacity: 0,
        y: 26,
        filter: "blur(6px)",
        duration: 1.2,
        scrollTrigger: { trigger: el, start: "top 90%" },
      });
    });

    // Manifesto: as palavras acendem conforme a rolagem
    const manifesto = $("[data-scrub-words]");
    if (manifesto) {
      const words = splitWords(manifesto);
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: manifesto, start: "top 78%", end: "bottom 45%", scrub: 0.6 },
      });
    }

    // Imagens: abrem por máscara e flutuam em parallax
    $$("[data-reveal]").forEach((el) => {
      gsap.fromTo(el,
        { clipPath: "inset(14% 8% 14% 8% round 28px)" },
        { clipPath: "inset(0% 0% 0% 0% round 28px)", duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
    $$("[data-parallax]").forEach((img) => {
      gsap.fromTo(img, { yPercent: -7 }, {
        yPercent: 7,
        ease: "none",
        scrollTrigger: { trigger: img.closest(".media"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    $$("[data-float]").forEach((img) => {
      gsap.fromTo(img, { y: 70 }, {
        y: -50,
        ease: "none",
        scrollTrigger: { trigger: img.closest(".cabin"), start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Nome das cabanas: letras sobem da borda da foto
    $$("[data-name]").forEach((el) => {
      const chars = splitChars(el);
      gsap.from(chars, {
        yPercent: 110,
        duration: 1.4,
        stagger: 0.05,
        scrollTrigger: { trigger: el.parentElement, start: "top 60%" },
      });
    });

    // Um dia no Sumont
    setupDay();

    // Lista "Além da cabana"
    gsap.from(".place-item", {
      opacity: 0, y: 30, duration: 1.1, stagger: 0.1,
      scrollTrigger: { trigger: ".beyond__list", start: "top 85%" },
    });

    // Passos da cota
    gsap.from("[data-steps] li", {
      opacity: 0, x: -24, duration: 1, stagger: 0.1,
      scrollTrigger: { trigger: "[data-steps]", start: "top 85%" },
    });

    // Investimento: curvas desenhadas, números contam, cronograma se traça
    $$("[data-draw]").forEach((path) => {
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, {
        strokeDashoffset: 0, ease: "none",
        scrollTrigger: { trigger: ".invest", start: "top 80%", end: "bottom 60%", scrub: 1 },
      });
    });
    $$("[data-figures] dd").forEach((dd) => countUp(dd));
    const schedule = $("[data-schedule]");
    if (schedule) {
      gsap.fromTo(schedule, { "--draw": 0 }, {
        "--draw": 1, duration: 1.8, ease: "expo.inOut",
        scrollTrigger: { trigger: schedule, start: "top 88%" },
      });
      gsap.from($$("li", schedule), {
        opacity: 0, y: 12, duration: 0.8, stagger: 0.14, delay: 0.3,
        scrollTrigger: { trigger: schedule, start: "top 88%" },
      });
    }

    // Final: o pôr do sol cresce até tomar a tela
    gsap.fromTo("[data-closing-frame]",
      { clipPath: "inset(9% 7% 9% 7% round 36px)" },
      { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none",
        scrollTrigger: { trigger: "[data-closing]", start: "top bottom", end: "top 15%", scrub: true } });
    gsap.fromTo(".closing__video", { scale: 1.2 }, {
      scale: 1, ease: "none",
      scrollTrigger: { trigger: "[data-closing]", start: "top bottom", end: "bottom bottom", scrub: true },
    });

    // Rodapé: a palavra SUMONT sobe devagar
    gsap.fromTo(".footer__word", { yPercent: 40 }, {
      yPercent: 0, ease: "none",
      scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
    });

    // Menu: link da seção atual
    const links = $$(".nav__pill a");
    links.forEach((a) => {
      const section = $(a.getAttribute("href"));
      if (!section) return;
      ScrollTrigger.create({
        trigger: section,
        start: "top 50%",
        end: "bottom 50%",
        onToggle: ({ isActive }) => a.classList.toggle("is-current", isActive),
      });
    });
  }

  /* ---------- Um dia no Sumont: faixa horizontal pinada ---------- */
  function setupDay() {
    const day = $("[data-day]");
    const stage = $("[data-day-stage]");
    const track = $("[data-track]");
    const bar = $("[data-day-bar]");
    // Manhã → meio-dia → tarde → noite. O texto troca de cor pela luminância real do fundo.
    const colors = [[247, 248, 247], [182, 205, 180], [79, 103, 79], [24, 33, 27]];
    function paintDay(p) {
      const seg = p * (colors.length - 1);
      const i = Math.min(colors.length - 2, Math.floor(seg));
      const f = seg - i;
      const [r, g, b] = colors[i].map((c, k) => Math.round(c + (colors[i + 1][k] - c) * f));
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      day.style.setProperty("--day-bg", `rgb(${r} ${g} ${b})`);
      day.style.setProperty("--day-fg", lum > 0.42 ? "#1E261E" : "#F7F8F7");
    }

    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", () => {
        day.classList.add("is-pinned");
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        paintDay(0);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              paintDay(self.progress);
              gsap.set(bar, { scaleX: self.progress });
            },
          },
        });
        // Cada foto se aproxima quando cruza o centro
        $$(".moment__media img", track).forEach((img) => {
          gsap.fromTo(img, { scale: 1.18 }, {
            scale: 1, ease: "none",
            scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "center center", scrub: true },
          });
        });
        return () => {
          day.classList.remove("is-pinned");
          day.style.removeProperty("--day-bg");
          day.style.removeProperty("--day-fg");
        };
    });
    mm.add("(max-width: 899px)", () => {
        gsap.from(".moment", {
          opacity: 0, x: 40, duration: 1.1, stagger: 0.1,
          scrollTrigger: { trigger: ".day__list", start: "top 85%" },
        });
    });
  }

  /* ---------- Números que contam ---------- */
  function countUp(el) {
    const original = el.textContent;
    const nums = original.match(/\d[\d.]*/g);
    if (!nums) return;
    const targets = nums.map((n) => Number(n.replace(/\./g, "")));
    const state = { p: 0 };
    const fmt = (v, src) => {
      const r = Math.round(v);
      return src.includes(".") ? r.toLocaleString("pt-BR") : String(r);
    };
    gsap.to(state, {
      p: 1,
      duration: 1.8,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
      onUpdate: () => {
        let i = 0;
        el.textContent = original.replace(/\d[\d.]*/g, (src) => fmt(targets[i++] * state.p, src));
      },
      onComplete: () => { el.textContent = original; },
    });
  }

  /* ---------- Botões magnéticos ---------- */
  function setupMagnetic() {
    if (!finePointer) return;
    $$("[data-magnetic]").forEach((btn) => {
      const x = gsap.quickTo(btn, "x", { duration: 0.6, ease: "power3.out" });
      const y = gsap.quickTo(btn, "y", { duration: 0.6, ease: "power3.out" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.22);
        y((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener("pointerleave", () => { x(0); y(0); });
    });
  }

  /* ---------- Dúvidas: abrir e fechar com altura animada ---------- */
  function setupFaq(animated) {
    $$("[data-faq] details").forEach((d) => {
      const summary = $("summary", d);
      const answer = $(".faq__answer", d);
      summary.addEventListener("click", (e) => {
        if (!animated || !window.gsap) return;
        e.preventDefault();
        if (d.open) {
          gsap.to(answer, {
            height: 0, opacity: 0, duration: 0.45, ease: "power3.inOut",
            onComplete: () => { d.open = false; gsap.set(answer, { clearProps: "height,opacity" }); ScrollTrigger.refresh(); },
          });
        } else {
          d.open = true;
          gsap.fromTo(answer, { height: 0, opacity: 0 }, {
            height: "auto", opacity: 1, duration: 0.6, ease: "expo.out",
            onComplete: () => { gsap.set(answer, { clearProps: "height" }); ScrollTrigger.refresh(); },
          });
        }
      });
    });
  }
})();
