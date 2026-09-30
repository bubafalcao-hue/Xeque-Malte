// Camada de dados e login. Todo o resto do site usa apenas o objeto XM.
(function () {
  "use strict";

  var cfg = window.XM_CONFIG || {};
  var demo = !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY;
  var client = null;

  if (!demo) {
    if (!window.supabase) throw new Error("Biblioteca do Supabase não carregou. Verifique a internet.");
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  var FASES = [
    { slug: "abertura", nome: "Abertura", glifo: "\u2659", desc: "Os primeiros lances e as ideias por trás deles." },
    { slug: "meio-jogo", nome: "Meio-jogo", glifo: "\u2658", desc: "Planos, ataques e decisões no centro da partida." },
    { slug: "finais", nome: "Finais", glifo: "\u2654", desc: "Converter vantagens e salvar posições difíceis." }
  ];
  var TEMAS = [
    { slug: "calculo", nome: "Cálculo", desc: "Variantes, lances forçados e visualização." },
    { slug: "estrategia", nome: "Estratégia", desc: "Planos, estruturas de peões e casas fracas." },
    { slug: "tatica", nome: "Tática", desc: "Combinações, motivos e golpes táticos." }
  ];

  function traduz(err) {
    var m = (err && err.message) || "";
    if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
    if (/already registered/i.test(m)) return "Este e-mail já tem conta. Use \"Entrar\".";
    if (/rate limit/i.test(m)) return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    if (/email not confirmed/i.test(m)) return "Confirme seu e-mail pelo link que enviamos.";
    return "Não foi possível concluir. Tente de novo.";
  }

  // ---------- Modo demonstração (sem servidor) ----------
  var DEMO_KEY = "xm_demo_user";
  function demoSub(fase, tema) {
    var f = FASES.filter(function (x) { return x.slug === fase; })[0];
    var t = TEMAS.filter(function (x) { return x.slug === tema; })[0];
    return {
      titulo: t.nome + " em " + f.nome.toLowerCase(),
      conteudo: "Este é um texto de exemplo para " + t.nome.toLowerCase() + " em " + f.nome.toLowerCase() +
        ".\n\nNo modo real, o texto vem da tabela subunidades do banco. Escreva o conteúdo por lá e ele aparece aqui.",
      fontes: [{ titulo: "Exemplo de fonte (Lichess)", url: "https://lichess.org/learn" }]
    };
  }

  // ---------- API pública ----------
  var XM = {
    demo: demo,
    FASES: FASES,
    TEMAS: TEMAS,

    getUser: function () {
      if (demo) return Promise.resolve(localStorage.getItem(DEMO_KEY) ? { email: localStorage.getItem(DEMO_KEY) } : null);
      return client.auth.getSession().then(function (r) {
        return r.data.session ? r.data.session.user : null;
      });
    },

    signIn: function (email, senha) {
      if (demo) { localStorage.setItem(DEMO_KEY, email); return Promise.resolve({}); }
      return client.auth.signInWithPassword({ email: email, password: senha }).then(function (r) {
        if (r.error) throw new Error(traduz(r.error));
        return {};
      });
    },

    signUp: function (email, senha) {
      if (demo) { localStorage.setItem(DEMO_KEY, email); return Promise.resolve({}); }
      return client.auth.signUp({ email: email, password: senha }).then(function (r) {
        if (r.error) throw new Error(traduz(r.error));
        return { confirmar: !r.data.session };
      });
    },

    signOut: function () {
      if (demo) { localStorage.removeItem(DEMO_KEY); return Promise.resolve(); }
      return client.auth.signOut();
    },

    // Retorna { titulo, conteudo, fontes:[{titulo,url}] } ou null se não existir.
    getSub: function (fase, tema) {
      if (demo) return Promise.resolve(demoSub(fase, tema));
      return client.from("subunidades").select("id,titulo,conteudo")
        .eq("fase", fase).eq("tema", tema).maybeSingle()
        .then(function (r) {
          if (r.error) throw new Error("Não foi possível carregar o conteúdo.");
          if (!r.data) return null;
          var sub = r.data;
          return client.from("fontes").select("titulo,url,arquivo")
            .eq("subunidade_id", sub.id).order("id")
            .then(function (fr) {
              if (fr.error) throw new Error("Não foi possível carregar as fontes.");
              return Promise.all((fr.data || []).map(function (f) {
                if (f.arquivo) {
                  return client.storage.from("livros").createSignedUrl(f.arquivo, 3600)
                    .then(function (s) { return { titulo: f.titulo, url: s.data ? s.data.signedUrl : null }; });
                }
                return { titulo: f.titulo, url: f.url };
              })).then(function (fontes) {
                return { titulo: sub.titulo, conteudo: sub.conteudo, fontes: fontes };
              });
            });
        });
    }
  };

  window.XM = XM;
})();
