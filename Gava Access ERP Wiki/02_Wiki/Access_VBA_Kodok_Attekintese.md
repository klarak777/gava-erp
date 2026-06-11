---
title: "Access ERP: VBA Kódok és Architektúra Áttekintése"
aliases: ["VBA Architektúra", "Modulok", "Kódkönyvtár"]
tags: [wiki, access, erp, vba, architektúra]
created: 2026-05-20
updated: 2026-05-20
sources: ["[[Access VBA kódok.pdf]]"]
---

# Access ERP VBA Architektúra Áttekintés

Ez a dokumentum a "Gava Access ERP" rendszer mögötti teljes VBA kódbázis felépítését, főbb moduljait és funkcióit foglalja össze az `Access VBA kódok.pdf` alapján.

## 1. Globális és Segédmodulok (Standard Modulok)

### `basCommonUtils` (Központi Segédfüggvények)
A rendszer legfontosabb, minden űrlap által használt "svájci bicskája".
- **Fájl- és mappakezelés:** Fájlok megnyitása (`OpenFileDirectly`), hálózati meghajtók UNC útvonalra konvertálása (`ConvertToUNC`), fájlok létezésének és zárolásának ellenőrzése.
- **Excel integráció:** Adatok importálása Excelből (`ImportDataFromExcel`), specifikus munkalapok keresése név (vagy részlet) alapján, Excel objektumok biztonságos kezelése és bezárása.
- **Szövegkezelés:** String normalizálás (`NormalizeString`) az ékezetek és speciális karakterek eltávolításához, automatikus nagybetűsítés űrlapmezőkön.
- **Webes PDF megtekintés:** A `ShowPDFDirectly` és rokon függvények dinamikus HTML/CSS kód generálásával ágyazzák be a PDF és konvertált DOCX fájlokat az Access webböngésző (WebBrowser) vezérlőibe.

### `basWebhooks` (API Integráció)
A külső rendszerekkel (n8n, API) való kommunikációért felelős.
- **Küldési funkciók:** `SendRakodasWebhook`, `SendFuvarmWebhook`, `SendEKAERWebhook`.
- **Technológia:** MSXML2.XMLHTTP vagy WinHttp hívások használatával JSON payloadokat küld (fájl elérési utakkal, fuvarozó nevekkel) POST metódussal a `gavaapi.live` végpontokra.

### Kisebb célmodulok
- **`Module3`, `Module4`:** Tartalmazzák a legutóbb fejlesztett `NormalToEuro` és `KalkulaldOsszPalettat` funkciókat a Transport Cost számításához.
- **`Module5`:** `PipakBejeloleseAccessben` rutint tartalmazza (tömeges checkbox frissítés DAO Recordseten keresztül).
- **`CleanTourNumbers`, `UpdateLoadDate`, `UpdateLoadDateAndTransporter`:** Adattisztító és szinkronizáló makrók a `Sheet1` és a `FileMapDatabase` táblák közötti elsődleges kulcsok (Order number) és dátumok javítására.

## 2. Űrlapok (Form Modulok)

### Rendszer- és Jogosultságkezelés
- **`Form_Bejelentkezés` és `Module1`:** Windows környezeti változó (`Environ$("COMPUTERNAME")`) alapján azonosítja a számítógépet. Automatikus beléptetést tesz lehetővé, illetve tartalmaz egy CDO objektum alapú (Mailjet SMTP) elfelejtett jelszó küldő funkciót.
- **`Form_Main page Területek`:** Szerepkör alapú hozzáférés-szabályozás (Admin, Iroda1, Iroda2, Iroda3). Az `OpenArgs`-on keresztül kapott string alapján engedélyezi (Enable = True) vagy tiltja az adott részlegek menügombjait.

### Adatkezelő és Szűrő Űrlapok (Folyamatos űrlapok)
Ezek az űrlapok (`Form_EKAEREK`, `Form_Fuvarmegbizás`, `Form_Rakodás`, `Form_Fuvarok összesitö`) nagyon hasonló, komplex szűrőmotorral rendelkeznek:
- **Dinamikus SQL építés:** A VBA kód gyűjteménybe (Collection) pakolja a megadott szűrőket (Kamionszám, Szállító, Szezon), majd `JOIN` művelettel összefűzi azokat egy végső SQL lekérdezéssé.
- **Dátum metszetek:** A `Form_Fuvarok összesitö` egy dedikált `KeresesFrissitese` rutinban oldja meg a Szezon (pl. 24-25) és az Év együttes szűrését.
- **Vizuális elemek:** A rekordokra kattintva az adott sorhoz tartozó útvonalból (FilePath) egy webes felületen jeleníti meg a csatolt dokumentumot.

### Kamion és Fájl Szerkesztés (`Form_Kamion szerkesztés`)
A legkritikusabb fájlrendszer-műveleteket végző űrlap.
- Egy megadott XLSM fájlt (kamion fájl) másol át egy új mappába.
- Szigorú ellenőrzéseket végez a `FileSystemObject` használatával (pl. `IsFileLocked` saját rutinnal, amely `Binary Access Lock` próbával teszteli a fájlt), nehogy a felhasználó megnyitott Excelt próbáljon átnevezni.
- Ha sikeres, frissíti az adatbázisban is az új fájlnevet.

## Összegzés és Bevált Gyakorlatok
- **DAO használata:** Az adatbázisműveletekhez kizárólag DAO (Data Access Objects) technológiát használ a kód (`CurrentDb.OpenRecordset`), ami Access-ben a legstabilabb.
- **Hibakezelés:** Szinte minden rutin rendelkezik dedikált `On Error GoTo ErrorHandler` blokkal, amely MsgBox formájában ad értelmezhető hibát a felhasználónak.
- **Fájl zárolások elkerülése:** Nagyon fejlett a fájlkezelés körüli hibatűrés (pl. a `TestFileLockHandling` és a Temp fájlok automatikus takarítása `CleanUpOldTempFiles`).

## 3. Adatátviteli Makrók (Transport Cost Batch & Trigger)

- **`ModBatchTransfer` (`BatchTransferTransportCost`):** A "Transportistas" forrás Excelből a 25-26-os szezon (2025.09.01 - 2026.08.31) fuvardíjait ("T" oszlop) tételesen átviszi a `25-26 Fuvarok összesitö V2.1.xlsx` fájl "Transport cost" oszlopába. Csak az első egyező sort módosítja, és nem írja felül a már kitöltött cellákat.
- **`ThisWorkbook` (`Workbook_BeforeSave`):** Minden mentéskor (Ctrl+S vagy Mentés gomb) némán, a háttérben meghívja a `BatchTransferTransportCost` rutint az értékek folyamatos szinkronizálásához. Az `Application.DisplayAlerts = False` beállítással elnyomja a felugró MsgBox-okat a felhasználó zavartalan munkája érdekében.
