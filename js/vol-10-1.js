/**
 * MathCore — 10.º Ano · Vol. 1
 * Imagens de resumos: images/<slug>.png
 */
window.MATHCORE_VOLUME = {
  yearKey: "10",
  volNumber: 1,
  backHref: "ano10.html",
  themes: [
    {
      id: "tema-1",
      title: "Tema 1 — Modelos Matemáticos para a Cidadania",
      sections: [
        {
          num: "1",
          title: "Modelos matemáticos nas eleições",
          items: [
            { num: "1.1", title: "Maioria simples", slug: "maioria_simples" },
            { num: "1.2", title: "Maioria absoluta", slug: "maioria_absoluta" },
            { num: "1.3", title: "Método de Borda", slug: "metodo_de_borda" },
          ],
        },
        {
          num: "2",
          title: "Modelos matemáticos na partilha",
          items: [
            { num: "2.1", title: "Método de Hondt", slug: "metodo_de_hondt" },
            { num: "2.2", title: "Método de Saint-Laguë", slug: "metodo_de_saint_lague" },
          ],
        },
        {
          num: "3",
          title: "Modelos matemáticos em finanças",
          items: [
            { num: "3.1", title: "Matemática nos salários", slug: "matematica_nos_salarios" },
            { num: "3.2", title: "Matemática na poupança e no crédito", slug: "matematica_na_poupanca_e_no_credito" },
          ],
        },
      ],
    },
    {
      id: "tema-2",
      title: "Tema 2 — Estatística",
      sections: [
        { num: "1", title: "Introdução à estatística", slug: "introducao_a_estatistica", items: [] },
        {
          num: "2",
          title: "Dados univariados",
          items: [
            { num: "2.1", title: "Dados quantitativos", slug: "dados_quantitativos" },
            { num: "2.2", title: "Organização dos dados", slug: "organizacao_dos_dados" },
            { num: "2.3", title: "Medidas de localização", slug: "medidas_de_localizacao" },
            { num: "2.4", title: "Medidas de dispersão", slug: "medidas_de_dispersao" },
          ],
        },
        { num: "3", title: "Dados bivariados", slug: "dados_bivariados", items: [] },
      ],
    },
  ],
};
