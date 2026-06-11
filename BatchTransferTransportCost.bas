Attribute VB_Name = "ModBatchTransfer"
'==============================================================================
' Modul:    ModBatchTransfer
' Cél:      A "Transportistas" forrás Excel "T" nevű (K) oszlopából az
'           értékeket TÉTELESEN átviszi a "25-26 Fuvarok összesítő V2.3.xlsx"
'           fájl "Transport cost" (X) oszlopába.
'
' Működés:
'   - Végigmegy a forrás összes során (Sheet1, 2. sortól)
'   - Szűr a 25-26-os szezonra (Loading date: 2025.09.01 – 2026.08.31)
'   - Minden order number-höz megkeresi az ELSŐ egyező sort a cél táblában
'   - Csak üres Transport cost cellába ír (nem ír felül)
'   - A cél fájl: \\192.168.1.5\raktar\MI Teszt\25-26 Fuvarok összesítő V2.3.xlsx
'
' Használat:
'   - Illessze be egy STANDARD MODULBA a Transportistas munkafüzetben
'   - Futtatás: manuálisan (egyszer, vagy szezononként)
'   - Alt+F8 → BatchTransferTransportCost → Futtatás
'
' Forrás oszlopok (Transportistas – Sheet1):
'   A = Loading date
'   C = Order number
'   K = "T" (Transport price – átviendő érték)
'
' Cél oszlopok (25-26 Fuvarok összesítő V2.3.xlsx):
'   S = Order number (azonosítás)
'   X = Transport cost (ide kerül az érték)
'
' Szezon: 2025.09.01 – 2026.08.31
' Adatok mindkét fájlban a 2. sortól kezdődnek (1. sor = fejléc)
'==============================================================================
Option Explicit

Public Sub BatchTransferTransportCost(Optional bShowMessage As Boolean = True)

    '--- Változók deklarálása ---
    Dim wsSource        As Worksheet
    Dim wbTarget        As Workbook
    Dim wsTarget        As Worksheet
    Dim targetPath      As String
    Dim targetFileName  As String
    Dim lastRowSource   As Long
    Dim lastRowTarget   As Long
    Dim i               As Long
    Dim j               As Long
    Dim loadingDate     As Date
    Dim orderNumber     As String
    Dim tValue          As Variant
    Dim seasonStart     As Date
    Dim seasonEnd       As Date
    Dim targetWasOpen   As Boolean
    Dim transferCount   As Long
    Dim skippedCount    As Long
    Dim notFoundCount   As Long
    Dim wb              As Workbook

    '=== BEÁLLÍTÁSOK (szükség esetén módosítandó) ===
    Const SOURCE_SHEET      As String = "Sheet1"
    Const SOURCE_COL_DATE   As String = "A"     ' Loading date oszlop
    Const SOURCE_COL_ORDER  As String = "C"     ' Order number oszlop
    Const SOURCE_COL_T      As String = "K"     ' "T" oszlop (átviendő érték)
    Const TARGET_COL_ORDER  As String = "S"     ' Order number a cél táblában
    Const TARGET_COL_COST   As String = "X"     ' Transport cost a cél táblában
    Const DATA_START_ROW    As Long = 2         ' Adatok kezdősora (mindkét fájl)

    '--- Szezon dátumhatárok ---
    seasonStart = DateSerial(2025, 9, 1)
    seasonEnd = DateSerial(2026, 8, 31)

    '--- Cél fájl elérési útja ---
    targetPath = "\\192.168.1.5\raktar\MI Teszt\25-26 Fuvarok összesitö V2.1.xlsx"
    targetFileName = "25-26 Fuvarok összesitö V2.1.xlsx"

    '--- Forrás munkalap beállítása ---
    On Error Resume Next
    Set wsSource = ThisWorkbook.Sheets(SOURCE_SHEET)
    On Error GoTo 0

    If wsSource Is Nothing Then
        MsgBox "A forrás munkalap """ & SOURCE_SHEET & """ nem található a munkafüzetben!" & vbCrLf & _
               "Ellenőrizd a munkalap nevét.", _
               vbExclamation, "Hiba - Forrás munkalap"
        Exit Sub
    End If

    '--- Cél fájl elérhetőség ellenőrzése ---
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(targetPath) Then
        MsgBox "A célfájl nem található vagy nem elérhető:" & vbCrLf & vbCrLf & _
               targetPath & vbCrLf & vbCrLf & _
               "Lehetséges okok:" & vbCrLf & _
               "  • Az OpenVPN kapcsolat nem aktív" & vbCrLf & _
               "  • A hálózati meghajtó nem elérhető" & vbCrLf & _
               "  • A fájl neve megváltozott", _
               vbExclamation, "Hiba - Célfájl nem elérhető"
        Exit Sub
    End If

    '--- Ellenőrizzük, hogy a cél munkafüzet már nyitva van-e ---
    targetWasOpen = False
    For Each wb In Workbooks
        If LCase(wb.Name) = LCase(targetFileName) Then
            Set wbTarget = wb
            targetWasOpen = True
            Exit For
        End If
    Next wb

    '--- Ha nincs nyitva, megnyitjuk ---
    If Not targetWasOpen Then
        On Error Resume Next
        Set wbTarget = Workbooks.Open(targetPath)
        On Error GoTo 0

        If wbTarget Is Nothing Then
            MsgBox "Nem sikerült megnyitni a célfájlt:" & vbCrLf & targetPath, _
                   vbExclamation, "Hiba - Fájl megnyitása"
            Exit Sub
        End If
    End If

    '--- Cél munkalap (első munkalap) ---
    Set wsTarget = wbTarget.Sheets(1)

    '--- Utolsó sorok meghatározása ---
    lastRowSource = wsSource.Cells(wsSource.Rows.Count, SOURCE_COL_ORDER).End(xlUp).Row
    lastRowTarget = wsTarget.Cells(wsTarget.Rows.Count, TARGET_COL_ORDER).End(xlUp).Row

    '--- Ellenőrzés: van-e adat ---
    If lastRowSource < DATA_START_ROW Then
        MsgBox "A forrás táblában nincsenek adatok!", vbInformation, "Információ"
        GoTo CleanUp
    End If

    If lastRowTarget < DATA_START_ROW Then
        MsgBox "A cél táblában nincsenek adatok!", vbInformation, "Információ"
        GoTo CleanUp
    End If

    '--- Teljesítményoptimalizáció ---
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    '--- Számlálók nullázása ---
    transferCount = 0
    skippedCount = 0
    notFoundCount = 0

    '--- Végigmegyünk a forrás sorokon ---
    For i = DATA_START_ROW To lastRowSource

        ' Loading date ellenőrzése – érvényes dátum-e
        If IsDate(wsSource.Cells(i, SOURCE_COL_DATE).Value) Then
            loadingDate = CDate(wsSource.Cells(i, SOURCE_COL_DATE).Value)

            ' Csak 25-26 szezonhoz tartozó sorok
            If loadingDate >= seasonStart And loadingDate <= seasonEnd Then

                ' Order number kiolvasása
                orderNumber = Trim(CStr(wsSource.Cells(i, SOURCE_COL_ORDER).Value))

                ' "T" érték kiolvasása
                tValue = wsSource.Cells(i, SOURCE_COL_T).Value

                ' Csak ha van order number ÉS van T érték
                If orderNumber <> "" And Not IsEmpty(tValue) And CStr(tValue) <> "" Then

                    Dim matchFound As Boolean
                    matchFound = False

                    ' Keresés a cél táblában – ELSŐ egyező sor
                    For j = DATA_START_ROW To lastRowTarget
                        If Trim(CStr(wsTarget.Cells(j, TARGET_COL_ORDER).Value)) = orderNumber Then
                            matchFound = True

                            ' Csak ha a Transport cost cella üres
                            If IsEmpty(wsTarget.Cells(j, TARGET_COL_COST).Value) Or _
                               Trim(CStr(wsTarget.Cells(j, TARGET_COL_COST).Value)) = "" Then
                                wsTarget.Cells(j, TARGET_COL_COST).Value = tValue
                                ' Pénznem formátum (Ft vagy EUR) áthúzása a forrásból
                                wsTarget.Cells(j, TARGET_COL_COST).NumberFormat = wsSource.Cells(i, SOURCE_COL_T).NumberFormat
                                transferCount = transferCount + 1
                            Else
                                skippedCount = skippedCount + 1
                            End If

                            Exit For  ' Csak az ELSŐ találatnál állunk meg
                        End If
                    Next j

                    If Not matchFound Then
                        notFoundCount = notFoundCount + 1
                    End If
                End If
            End If
        End If
    Next i

    '--- Cél fájl mentése, ha történt változás ---
    If transferCount > 0 Then
        wbTarget.Save
    End If

CleanUp:
    '--- Teljesítménybeállítások visszaállítása ---
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
    Application.EnableEvents = True

    '--- Eredmény kijelzése (csak manuális futtatáskor) ---
    If bShowMessage Then
        MsgBox "Batch Transfer kész!" & vbCrLf & vbCrLf & _
               "Átvitt értékek:        " & transferCount & vbCrLf & _
               "Már kitöltve (kihagyva): " & skippedCount & vbCrLf & _
               "Nem találva a célban:  " & notFoundCount, _
               vbInformation, "Transport Cost – Batch Transfer Eredmény"
    End If

End Sub
