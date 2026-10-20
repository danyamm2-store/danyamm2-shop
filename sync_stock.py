#!/usr/bin/env python3
"""Обновляет stock.json по количеству на странице профиля FunPay.
Запуск: python sync_stock.py            (скачивает профиль с funpay.com)
        python sync_stock.py page.html  (тест на сохранённой странице)
Если страница не открылась или разобралась странно, файл НЕ меняется."""
import json, re, sys, urllib.request, datetime

PROFILE = "https://funpay.com/users/18713151/"
STOCK, FPMAP = "stock.json", "fp_map.json"

def load_page():
    if len(sys.argv) > 1:
        return open(sys.argv[1], encoding="utf-8", errors="replace").read()
    req = urllib.request.Request(PROFILE, headers={"User-Agent": "Mozilla/5.0", "Accept-Language": "ru"})
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")

def parse(html):
    """-> {offer_id: количество или None (если у лота нет поля «количество»)}"""
    res = {}
    for oid, block in re.findall(r'<a href="https://funpay\.com/lots/offer\?id=(\d+)" class="tc-item">(.*?)</a>', html, re.S):
        m = re.search(r'class="tc-amount[^"]*"[^>]*>\s*([^<]*)', block)
        digits = re.sub(r"\D", "", m.group(1)) if m else ""
        res[oid] = int(digits) if digits else None
    return res

def main():
    offers = parse(load_page())
    if len(offers) < 5:                       # защита: страница не та / блокировка
        print("На странице найдено лотов: %d. Выходим без изменений." % len(offers)); return 1
    data = json.load(open(STOCK, encoding="utf-8"))
    fpmap = json.load(open(FPMAP, encoding="utf-8")) if FPMAP else {}
    tracked = {k: (k if k.isdigit() else fpmap.get(k)) for k in data["stock"]}
    tracked = {k: o for k, o in tracked.items() if o}
    found = [k for k, o in tracked.items() if o in offers]
    print("Лотов на странице: %d. Лотов с сайта найдено на FunPay: %d из %d" % (len(offers), len(found), len(tracked)))
    print("ID на странице:", sorted(offers))
    # ЗАЩИТА: если большая часть лотов «пропала», это сбой страницы, а не продажи. Ничего не меняем.
    if len(found) < 0.5 * len(tracked):
        print("СТОП: на странице нет большей части твоих лотов (FunPay отдал урезанную страницу?). stock.json не изменён.")
        return 1
    changes = []
    for key, oid in tracked.items():
        old = data["stock"][key]
        if oid in offers:
            new = offers[oid]
            if new is None: continue          # у лота нет количества: не трогаем
        else:
            new = 0                           # лота нет в профиле: распродан/скрыт
        if new != old:
            data["stock"][key] = new; changes.append("%s: %s -> %s" % (key, old, new))
    if changes:
        msk = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=3)
        data["updated"] = msk.strftime("%Y-%m-%d %H:%M")
        json.dump(data, open(STOCK, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\n".join(changes) or "Изменений нет"); return 0

if __name__ == "__main__":
    sys.exit(main())
