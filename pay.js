/* danyamm2shop — окно покупки. Подключается одной строкой в index.html. */
(function () {
  'use strict';

  // ВАЖНО: после создания воркера вставь сюда его адрес (без / в конце).
  var API = 'https://danyamm2-pay.zotovd695.workers.dev';

  var css =
    '.pay-back{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:14px;overflow-y:auto}' +
    '.pay-box{width:100%;max-width:380px;background:var(--card,#15151b);color:var(--text,#f5f5f7);border:1px solid var(--border,rgba(255,255,255,.1));border-radius:28px;padding:22px;box-shadow:var(--shadow,0 16px 44px rgba(0,0,0,.55))}' +
    '.pay-box h3{font-size:18px;line-height:1.25;margin:0}' +
    '.pay-sum{margin:4px 0 14px;font-size:22px;font-weight:800;color:var(--accent,#8b5cf6);font-variant-numeric:tabular-nums}' +
    '.pay-box label{display:block;font-size:13px;font-weight:700;margin:12px 0 6px}' +
    '.pay-box input[type=text]{width:100%;padding:12px 14px;border-radius:14px;border:1px solid var(--border,rgba(255,255,255,.12));background:var(--card2,#1d1d25);color:inherit;font:inherit}' +
    '.pay-box input[type=text]:focus{outline:none;border-color:var(--accent,#8b5cf6);box-shadow:0 0 0 4px var(--soft,rgba(139,92,246,.18))}' +
    '.pay-agree{display:flex;gap:10px;align-items:flex-start;margin-top:14px;font-size:12.5px;color:var(--muted,#aaa);font-weight:500}' +
    '.pay-agree input{margin-top:2px;width:18px;height:18px;flex:none;accent-color:var(--accent,#8b5cf6)}' +
    '.pay-agree a{color:var(--accent,#8b5cf6);text-decoration:underline}' +
    '.pay-note{margin-top:10px;font-size:12px;color:var(--muted,#aaa)}' +
    '.pay-err{min-height:18px;margin-top:10px;font-size:13px;font-weight:700;color:#ef4444}' +
    '.pay-go{width:100%;margin-top:6px;padding:13px;border-radius:16px;background:var(--accent,#8b5cf6);color:var(--on,#fff);font:inherit;font-weight:800;cursor:pointer}' +
    '.pay-go[disabled]{opacity:.6;cursor:wait}' +
    '.pay-cancel{width:100%;margin-top:8px;padding:11px;border-radius:16px;background:var(--card2,#1d1d25);color:inherit;font:inherit;font-weight:700;cursor:pointer}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  function money(n) {
    return (Math.round(n * 100) / 100).toString().replace('.', ',') + ' ₽';
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function load(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ничего */ } }

  var current = null;

  function openPay(card) {
    if (current) return;
    var id = card.dataset.id, name = card.dataset.name, price = +card.dataset.price;

    var back = el('div', 'pay-back');
    var box = el('div', 'pay-box');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Покупка');

    box.appendChild(el('h3', '', name));
    box.appendChild(el('div', 'pay-sum', money(price)));

    var l1 = el('label', '', 'Ник в Roblox');
    l1.htmlFor = 'payNick';
    var nick = el('input');
    nick.type = 'text'; nick.id = 'payNick'; nick.maxLength = 20;
    nick.autocomplete = 'off'; nick.placeholder = 'например, Danya_123';
    nick.value = load('pay_nick');

    var l2 = el('label', '', 'Твой Telegram');
    l2.htmlFor = 'payTg';
    var tg = el('input');
    tg.type = 'text'; tg.id = 'payTg'; tg.maxLength = 33;
    tg.autocomplete = 'off'; tg.placeholder = '@username';
    tg.value = load('pay_tg');

    var agreeRow = el('label', 'pay-agree');
    var agree = el('input');
    agree.type = 'checkbox';
    var at = el('span');
    at.appendChild(document.createTextNode('Я прочитал(а) и согласен(на) с '));
    var a1 = el('a', '', 'пользовательским соглашением'); a1.href = 'terms.html'; a1.target = '_blank'; a1.rel = 'noopener';
    at.appendChild(a1);
    at.appendChild(document.createTextNode(' и '));
    var a2 = el('a', '', 'политикой конфиденциальности'); a2.href = 'privacy.html'; a2.target = '_blank'; a2.rel = 'noopener';
    at.appendChild(a2);
    agreeRow.appendChild(agree); agreeRow.appendChild(at);

    var note = el('p', 'pay-note', 'Оплата проходит на защищённой странице платёжного сервиса. Предмет передаём в игре после подтверждения оплаты.');
    var err = el('div', 'pay-err'); err.setAttribute('role', 'alert');
    var go = el('button', 'pay-go', 'Оплатить ' + money(price)); go.type = 'button';
    var cancel = el('button', 'pay-cancel', 'Отмена'); cancel.type = 'button';

    [l1, nick, l2, tg, agreeRow, note, err, go, cancel].forEach(function (n) { box.appendChild(n); });
    back.appendChild(box);
    document.body.appendChild(back);
    current = back;
    (nick.value ? tg : nick).focus();

    function close() {
      document.removeEventListener('keydown', onKey);
      if (back.parentNode) back.parentNode.removeChild(back);
      current = null;
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    cancel.addEventListener('click', close);
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });

    go.addEventListener('click', function () {
      err.textContent = '';
      var n = nick.value.trim(), t = tg.value.trim();
      if (!/^[A-Za-z0-9_]{3,20}$/.test(n)) { err.textContent = 'Ник в Roblox: 3–20 символов, латиница, цифры и _'; nick.focus(); return; }
      if (!/^@?[A-Za-z0-9_]{5,32}$/.test(t)) { err.textContent = 'Telegram: например @username'; tg.focus(); return; }
      if (!agree.checked) { err.textContent = 'Поставь галочку, что согласен(на) с условиями'; return; }
      if (API.indexOf('YOUR-WORKER') > -1) { err.textContent = 'Оплата ещё не подключена. Напиши продавцу в Telegram.'; return; }

      save('pay_nick', n); save('pay_tg', t);
      go.disabled = true; go.textContent = 'Создаём платёж…';

      fetch(API + '/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: id, nick: n, tg: t, agree: true })
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (x) {
        if (x.ok && x.j && typeof x.j.url === 'string' && x.j.url.indexOf('https://') === 0) {
          location.href = x.j.url;
          return;
        }
        throw new Error((x.j && x.j.error) || 'Не получилось создать платёж');
      }).catch(function (e) {
        err.textContent = e && e.message && e.message !== 'Failed to fetch' ? e.message : 'Нет связи с сервером оплаты. Попробуй ещё раз.';
        go.disabled = false; go.textContent = 'Оплатить ' + money(price);
      });
    });
  }

  // Перехватываем все кнопки «Купить»: в каталоге, в быстром просмотре и в избранном.
  document.addEventListener('click', function (e) {
    var b = e.target.closest('a.buy, a.go, #qvBuy');
    if (!b) return;
    var card = null;
    if (b.dataset.pid) card = document.querySelector('.card[data-id="' + b.dataset.pid + '"]');
    else card = b.closest('.card');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    if (card.classList.contains('sold') || +card.dataset.stock <= 0 || b.getAttribute('aria-disabled') === 'true') return;
    openPay(card);
  }, true);
})();
