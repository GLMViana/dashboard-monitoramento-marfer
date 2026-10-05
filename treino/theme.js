/* aplica o tema salvo antes de pintar a tela, para não piscar */
(function () {
  try {
    var st = (JSON.parse(localStorage.getItem('treino.v1') || '{}') || {}).settings;
    var t = st && st.theme;
    if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);
  } catch (e) { }
})();
