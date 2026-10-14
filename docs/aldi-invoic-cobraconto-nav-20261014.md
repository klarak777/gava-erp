# CobraConto számlázás, ALDI INVOIC és NAV-adatszolgáltatás

Dátum: 2026-10-14.

## Kiindulás és javasolt működés

A felhasználó tájékoztatása szerint a Gava a CobraConto alkalmazásban állítja ki számláit. A pontos termék, telepített verzió, EDI licenc/szolgáltató és jelenlegi NAV-kapcsolat beállítása nem ismert; helyszíni számlázási próbát nem végeztünk.

A javasolt felépítésben a CobraConto marad a számla létrehozásának és sorszámozásának rendszere. Az ott véglegesített számla két irányba jut el: NAV Online Számla adatszolgáltatásként, valamint ALDI felé EDI INVOIC-ként. A Gava ERP vagy EDI szolgáltató a Cobra adatainak átvételét, szükséges megfeleltetését és továbbítását végzi. Nem keletkezik új, második számla az EDI-átalakítás miatt; azonos számlaszámot és egyező számlatartalmat használunk. Ez megvalósítási javaslat, nem már működő integráció.

| Feladat | Rendszer / formátum |
| --- | --- |
| Számla, módosítás, sztornó létrehozása és sorszámozása | CobraConto |
| NAV-adatszolgáltatás és NAV feldolgozási státusz | Cobra NAV-kapcsolat, NAV által előírt XML/API |
| ALDI-nak történő átadás | Az ALDI MIG szerinti INVOIC, a jóváhagyott partneri csatornán |
| Egyeztetés és archiválás | A számla, NAV státusz, EDI üzenet és partneri visszajelzés összekapcsolása |

## Az INVOIC nem helyettesíti a NAV-adatszolgáltatást

Az INVOIC az ALDI számlafogadási üzenete. A NAV Online Számla külön M2M interfészt és XML adatszerkezetet használ. Az ALDI-nak küldött EANCOM INVOIC nem adható át változtatás nélkül a NAV számlabejelentő interfészének, és az OpenText/ALDI befogadása nem igazolja a NAV felé történt adatszolgáltatást. [NAV hivatalos interfész, sémák és dokumentáció](https://github.com/nav-gov-hu/Online-Invoice).

Az adatszolgáltatási kötelezettséget érintő számláknál a sikeres NAV-feldolgozást ellenőrizni kell. Az ALDI felé történő átvitel külön státuszt kap; egyik visszaigazolás sem helyettesíti a másikat. [NAV: az online számlaadat-szolgáltatás gyakori hibái](https://nav.gov.hu/ugyfeliranytu/nezzen-utana/tudjon_rola/Az_online_szamlaadat-szolgaltatas_gyakori_hibai).

A CobraConto.Net támogatja a NAV Online Számla kapcsolatot; a Gava telepítésében ennek tényleges működését és a szolgáltatás megfelelő beállításait ellenőrizni kell. [Cobra gyártói dokumentáció](https://help.cobra.hu/index.php/online-szamla-rendszer/).

## Meglévő Cobra EDI lehetőségek

A Cobra 2026.3 változásnaplója EDISys partneri funkciót ismertet ALDI beszállítóknak. A kapcsolódó leírás szerint a számla véglegesítésekor egy beállított könyvtárba INVOIC bizonylat kerül, amelyet az EDISys dolgoz fel és továbbít ALDI felé. A leírás rendelésimportot és DESADV exportot is ismertet. Ez szolgáltatói integráció, nem bizonyítja a Gava közvetlen OpenText EANCOM D.01B kapcsolatának készenlétét. [Cobra 2026.3 változásnapló](https://help.cobra.hu/index.php/2026/08/31/cobraconto-net-2026-3-valtozasnaplo/), [EDISys HOFER/ALDI kapcsolat](https://help.cobra.hu/index.php/2026/08/31/edisys-hofer-aldi-edi-kommunikacio/).

A régebbi EDInet funkció XML-t állít elő, míg a Cobra.Export.exe strukturált CCNX/XML adatcserét támogat. Egyik formátumot sem tekintjük automatikusan azonosnak az ALDI új EANCOM MIG-jével. [Cobra EDI számlakiállítás](https://help.cobra.hu/index.php/2021/03/18/edi-szamla-kiallitas/), [XML export/import](https://help.cobra.hu/index.php/2015/10/29/xml-exportimport/).

Elsőként a telepített Cobra termék/verzió, EDI funkciók és szolgáltatói szerződés ismeretében kell kiválasztani az adatátadást. Ha használható export már rendelkezésre áll, abból építhető az OpenText profil szerinti átalakítás és továbbítás; ha nincs, Cobra interfész vagy megfelelő strukturált export szükséges. EDISys szolgáltatás használatához annak feltételeit és az ALDI/OpenText onboardinghoz való illeszkedést külön tisztázni kell. A NAV XML önmagában nem garantálja az ALDI által igényelt összes rendeléshivatkozás meglétét.

## ALDI megfeleltetés és számlamegőrzés

Az ALDI EDI Guideline 1.4, 10. fejezete és az INVOIC MIG alapján össze kell kapcsolni a számla termékeit és mennyiségeit a GTIN-ekkel, ALDI rendelési számokkal és tételhivatkozásokkal. Ellenőrizni kell a számlaszámot, partnerazonosítókat, dátumokat, pénznemet, árakat, kedvezményeket, adózást és kerekítést. A 10.2 pont legfeljebb 16 karakteres számlaszámot ír; a meglévő Cobra sorszámformátumot ehhez teszteljük, nem írjuk át önkényesen.

A Cobra szerinti módosító/sztornó bizonylatok és az ALDI által támogatott kereskedelmi számla/jóváírás megfeleltetését külön vizsgálni kell. A Guideline nem támogatja az Invoice correction üzenettípust; ebből nem következik, hogy a magyar számlamódosítási követelmények mellőzhetők. A megfelelő ALDI üzenet és hivatkozás a tényleges Cobra bizonylatból készül, közös mintateszttel ellenőrizve.

Forrás: [ALDI EDI Guideline 1.4](<../ALDI opentext/Aldi Opentext dokumentumok/ALDI SOUTH Group - EDI Guideline for Suppliers_EANCOM.pdf>), 10. fejezet, és az INVOIC MIG a letöltött Supplier dokumentumok között.

Az EDI elektronikus számlázásnál a NAV tájékoztatója előzetes írásbeli megállapodást, az eredet hitelességét, az adattartalom sértetlenségét, olvashatóságot és elektronikus megőrzést ír le. Az INVOIC üzenettípus kiválasztása önmagában nem igazolja e feltételek teljesülését. Az ALDI-val elfogadott megállapodás, a Cobra számlaformája és az archiválási mód együtt alakítja ki a folyamatot. [NAV: elektronikus számlák](https://nav.gov.hu/ado/afa/Az_elektronikus_szaml20200416).

## Következő ellenőrzés

A Gava által használt Cobra termék és verzió, a licencelt EDI szolgáltató, valamint egy véglegesített ALDI számla strukturált exportja alapján lehet véglegesíteni az interfészt. A próba során a Cobra számla, NAV-adatszolgáltatás és ALDI INVOIC azonos számlaszámát, összegeit, hivatkozásait és a két külön befogadási státuszt kell egyeztetni. Ugyanez szükséges a módosító/sztornó eseteknél. Külső kapcsolati teszt vagy számlakibocsátás ebben az elemzésben nem történt.
