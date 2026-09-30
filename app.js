// Tela única do site: cabeçalho fixo + conteúdo trocado por rota (#/...).
(function () {
  "use strict";

  var FASES = XM.FASES, TEMAS = XM.TEMAS;
  var view = document.getElementById("view");
  var navLinks = document.querySelectorAll("#nav a[data-rota]");

  function h(tag, props, kids) {
    var e = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "class") e.className = props[k];
      else if (k === "text") e.textContent = props[k];
      else e.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { e.append(c); });
    return e;
  }

  function show(node, titulo) {
    view.replaceChildren(node);
    document.title = titulo + " · Xeque-Malte";
    var t = view.querySelector("h1");
    if (t) { t.tabIndex = -1; t.focus({ preventScroll: true }); }
    window.scrollTo(0, 0);
  }

  function marcaMenu(rota) {
    navLinks.forEach(function (a) {
      if (a.dataset.rota === rota) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function nome(lista, slug) {
    return lista.filter(function (x) { return x.slug === slug; })[0];
  }

  // ---------- Telas ----------
  function dashboard() {
    var grade = h("div", { class: "fases" }, FASES.map(function (f) {
      return h("section", { class: "cartao" }, [
        h("span", { class: "glifo", "aria-hidden": "true", text: f.glifo }),
        h("h2", {}, [h("a", { href: "#/" + f.slug, text: f.nome })]),
        h("p", { text: f.desc }),
        h("ul", { class: "temas" }, TEMAS.map(function (t) {
          return h("li", {}, [h("a", { href: "#/" + f.slug + "/" + t.slug, text: t.nome })]);
        }))
      ]);
    }));
    show(h("div", {}, [
      h("h1", { text: "Escolha uma fase" }),
      h("p", { class: "lead", text: "Cada fase tem cálculo, estratégia e tática." }),
      grade
    ]), "Início");
  }

  function fasePagina(f) {
    var fases = h("nav", { class: "pilulas", "aria-label": "Fases" }, FASES.map(function (x) {
      var a = h("a", { href: "#/" + x.slug, text: x.nome });
      if (x.slug === f.slug) a.setAttribute("aria-current", "page");
      return a;
    }));
    var grade = h("div", { class: "fases" }, TEMAS.map(function (t) {
      return h("section", { class: "cartao" }, [
        h("h2", {}, [h("a", { href: "#/" + f.slug + "/" + t.slug, text: t.nome })]),
        h("p", { text: t.desc })
      ]);
    }));
    show(h("div", {}, [
      h("p", { class: "trilha" }, [h("a", { href: "#/", text: "Início" }), document.createTextNode(" / " + f.nome)]),
      h("span", { class: "glifo", "aria-hidden": "true", text: f.glifo }),
      h("h1", { text: f.nome }),
      h("p", { class: "lead", text: f.desc }),
      fases,
      grade
    ]), f.nome);
  }

  function subunidade(fase, tema) {
    var rotulo = tema.nome + " · " + fase.nome;
    show(h("div", {}, [h("h1", { text: rotulo }), h("p", { class: "lead", text: "Carregando..." })]), rotulo);

    XM.getSub(fase.slug, tema.slug).then(function (sub) {
      var irmaos = h("nav", { class: "pilulas", "aria-label": "Temas de " + fase.nome }, TEMAS.map(function (t) {
        var a = h("a", { href: "#/" + fase.slug + "/" + t.slug, text: t.nome });
        if (t.slug === tema.slug) a.setAttribute("aria-current", "page");
        return a;
      }));
      var trilha = h("p", { class: "trilha" }, [
        h("a", { href: "#/", text: "Início" }), document.createTextNode(" / "),
        h("a", { href: "#/" + fase.slug, text: fase.nome })
      ]);
      var corpo = h("div", {}, [trilha]);

      if (!sub) {
        corpo.append(h("h1", { text: rotulo }), irmaos,
          h("p", { text: "Ainda não há conteúdo aqui. Adicione uma linha em subunidades no banco." }));
      } else {
        corpo.append(h("h1", { text: sub.titulo }), irmaos);
        String(sub.conteudo || "").split(/\n{2,}/).forEach(function (p) {
          if (p.trim()) corpo.append(h("p", { class: "texto", text: p.trim() }));
        });
        if (sub.fontes.length) {
          var lista = h("ul", { class: "fontes" });
          sub.fontes.forEach(function (f) {
            if (f.url && /^https?:\/\//.test(f.url)) {
              lista.append(h("li", {}, [h("a", { href: f.url, target: "_blank", rel: "noopener", text: f.titulo })]));
            }
          });
          corpo.append(h("h2", { text: "Fontes e livros" }), lista);
        }
      }
      show(corpo, rotulo);
    }).catch(function (err) {
      show(h("div", {}, [h("h1", { text: rotulo }), h("p", { class: "msg", role: "alert", text: err.message })]), rotulo);
    });
  }

  function contato() {
    show(h("div", {}, [
      h("h1", { text: "Contato" }),
      h("p", { class: "texto", text: "Sugestões, correções e dúvidas são bem-vindas." }),
      h("p", { class: "texto" }, [h("a", { href: "mailto:seu-email@exemplo.com", text: "seu-email@exemplo.com" })])
    ]), "Contato");
  }

  function sobre() {
    show(h("div", {}, [
      h("h1", { text: "Sobre" }),
      h("p", { class: "texto", text: "O Xeque-Malte reúne textos, fontes e livros sobre abertura, meio-jogo e finais. Edite este texto em app.js." })
    ]), "Sobre");
  }

  function naoEncontrado() {
    show(h("div", {}, [
      h("h1", { text: "Página não encontrada" }),
      h("p", { class: "texto" }, [h("a", { href: "#/", text: "Voltar ao início" })])
    ]), "Não encontrada");
  }

  // ---------- Rotas ----------
  function rota() {
    var p = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    marcaMenu(p[0]);
    if (!p.length) return dashboard();
    if (p[0] === "contato") return contato();
    if (p[0] === "sobre") return sobre();
    var f = nome(FASES, p[0]), t = nome(TEMAS, p[1]);
    if (f && t) return subunidade(f, t);
    if (f && p.length === 1) return fasePagina(f);
    return naoEncontrado();
  }

  XM.getUser().then(function (u) {
    if (!u) { location.replace("index.html"); return; }
    document.getElementById("sair").addEventListener("click", function () {
      XM.signOut().then(function () { location.replace("index.html"); });
    });
    window.addEventListener("hashchange", rota);
    rota();
  });
})();
