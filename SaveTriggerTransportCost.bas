'==============================================================================
' Modul:    ThisWorkbook – Workbook_BeforeSave esemény
' Cél:      A Transportistas munkafüzet mentésekor automatikusan meghívja a
'           BatchTransferTransportCost() makrót, ÜZENET NÉLKÜL.
'
' Telepítés:
'   1. Nyisd meg a Transportistas munkafüzetet
'   2. Alt+F11 → VBA Editor
'   3. A bal oldali Project Explorer-ben kattints DUPLÁN a "ThisWorkbook"-ra
'      (Microsoft Excel Objects mappában – NEM egy sima Module-ban!)
'   4. Másold be ezt a teljes kódot az üres ablakba
'   5. Mentsd el .xlsm formátumban
'
' FONTOS: A BatchTransferTransportCost() szubrutinnak egy Standard Modulban
'         kell lennie ugyanabban a munkafüzetben!
'==============================================================================

Private Sub Workbook_BeforeSave(ByVal SaveAsUI As Boolean, Cancel As Boolean)

    ' Az MsgBox elnyomásához ideiglenesen kikapcsoljuk az összes figyelmeztetést
    Application.DisplayAlerts = False

    ' Meghívjuk a meglévő, jól működő BatchTransfer logikát
    On Error Resume Next
    BatchTransferTransportCost
    On Error GoTo 0

    ' Figyelmeztetések visszakapcsolása
    Application.DisplayAlerts = True

End Sub
