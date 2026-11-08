<#
.SYNOPSIS
    Áquila Pro — Exportador & Validador Contábil RPA (Thomson Reuters Domínio / SigaWeb)
.DESCRIPTION
    Lê registros financeiros de mensalidades/baixas (JSON/CSV ou modo de homologação sintética),
    valida campos obrigatórios (CPF 11 dígitos, Competência YYYY-MM, Valor > 0, Conta Contábil),
    segrega registros inválidos em `dominio_invalidos.csv` e gera o arquivo posicional/delimitado
    por pipe `|` em `C:\aquila\storage\dominio_out\dominio_export.txt`.
    Compativel com Windows PowerShell 5.1 e PowerShell 7+.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$InputJsonPath = "C:\aquila\storage\dominio_in\lancamentos.json",

    [Parameter(Mandatory = $false)]
    [string]$OutputDir = "C:\aquila\storage\dominio_out",

    [Parameter(Mandatory = $false)]
    [switch]$GenerateSampleIfMissing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$ExportTxtPath = Join-Path $OutputDir "dominio_export.txt"
$InvalidCsvPath = Join-Path $OutputDir "dominio_invalidos.csv"

function Format-MonetaryCents {
    param([Parameter(Mandatory = $true)][decimal]$Amount)
    $rounded = [Math]::Round($Amount, 2, [System.MidpointRounding]::AwayFromZero)
    return $rounded.ToString("0.00", [System.Globalization.CultureInfo]::InvariantCulture)
}

function Test-ValidCpfFormat {
    param([AllowNull()][string]$Cpf)
    if ([string]::IsNullOrWhiteSpace($Cpf)) { return $false }
    $digits = ($Cpf -replace '\D', '')
    if ($digits.Length -ne 11) { return $false }
    if ($digits -match '^(\d)\1{10}$') { return $false }
    return $true
}

if (-not (Test-Path -LiteralPath $InputJsonPath)) {
    if ($GenerateSampleIfMissing) {
        $parentIn = Split-Path -Parent $InputJsonPath
        if (-not (Test-Path -LiteralPath $parentIn)) {
            New-Item -ItemType Directory -Path $parentIn -Force | Out-Null
        }
        $sampleData = @(
            @{
                id_lancamento     = "LANC-2026-0001"
                matricula         = "AQ-2026-001"
                cpf_responsavel   = "12345678909"
                competencia       = "2026-11"
                data_lancamento   = "2026-11-05"
                conta_debito      = "110101"
                conta_credito     = "310101"
                valor_bruto       = 1450.00
                desconto_bolsa    = 150.00
                juros_multa       = 0.00
                historico         = "MENSALIDADE ESCOLAR NOV/2026 ALUNO SINTETICO 001"
            },
            @{
                id_lancamento     = "LANC-2026-0002"
                matricula         = "AQ-2026-002"
                cpf_responsavel   = "98765432100"
                competencia       = "2026-11"
                data_lancamento   = "2026-11-06"
                conta_debito      = "110101"
                conta_credito     = "310101"
                valor_bruto       = 1450.00
                desconto_bolsa    = 0.00
                juros_multa       = 29.00
                historico         = "MENSALIDADE ESCOLAR NOV/2026 ALUNO SINTETICO 002"
            }
        )
        $sampleData | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $InputJsonPath -Encoding UTF8
    } else {
        throw "Arquivo de entrada nao encontrado em '$InputJsonPath'. Use -GenerateSampleIfMissing para homologacao."
    }
}

$rawContent = Get-Content -LiteralPath $InputJsonPath -Raw -Encoding UTF8
$records = ConvertFrom-Json -InputObject $rawContent
if ($null -eq $records) {
    $records = @()
} elseif ($records -isnot [System.Array]) {
    $records = @($records)
}

$validLines = New-Object System.Collections.Generic.List[string]
$invalidRows = New-Object System.Collections.Generic.List[psobject]

# Registro 0000 - Cabecalho do Lote Domínio Sistemas
$batchDate = (Get-Date).ToString("ddMMyyyy")
$validLines.Add("|0000|AQUILA_PRO_ERP|$batchDate|LAYOUT_DOMINIO_V2026|")

$seq = 0
foreach ($rec in $records) {
    $seq++
    $idLanc = [string]$rec.id_lancamento
    $matricula = [string]$rec.matricula
    $cpfRaw = [string]$rec.cpf_responsavel
    $cpfClean = ($cpfRaw -replace '\D', '')
    $comp = [string]$rec.competencia
    $dtLanc = [string]$rec.data_lancamento
    $cDeb = [string]$rec.conta_debito
    $cCred = [string]$rec.conta_credito
    $hist = ([string]$rec.historico) -replace '\|', ' '

    $errors = New-Object System.Collections.Generic.List[string]

    if (-not (Test-ValidCpfFormat -Cpf $cpfClean)) {
        $errors.Add("CPF_RESPONSAVEL_INVALIDO")
    }
    if ($comp -notmatch '^\d{4}-(0[1-9]|1[0-2])$') {
        $errors.Add("COMPETENCIA_INVALIDA")
    }
    if ([string]::IsNullOrWhiteSpace($cDeb) -or [string]::IsNullOrWhiteSpace($cCred)) {
        $errors.Add("CONTA_CONTABIL_AUSENTE")
    }

    [decimal]$vBruto = 0
    [decimal]$vDesc = 0
    [decimal]$vJuros = 0
    try {
        $vBruto = [decimal]$rec.valor_bruto
        $vDesc = [decimal]$rec.desconto_bolsa
        $vJuros = [decimal]$rec.juros_multa
    } catch {
        $errors.Add("VALORES_MONETARIOS_NAO_NUMERICOS")
    }

    [decimal]$vLiquido = $vBruto - $vDesc + $vJuros
    if ($vBruto -le 0 -or $vLiquido -lt 0) {
        $errors.Add("VALOR_LIQUIDO_OU_BRUTO_INVALIDO")
    }

    if ($errors.Count -gt 0) {
        $invalidRows.Add([pscustomobject]@{
            Sequencia      = $seq
            IdLancamento   = $idLanc
            Matricula      = $matricula
            CpfResponsavel = $cpfClean
            Competencia    = $comp
            MotivoRejeicao = ($errors -join ";")
        })
        continue
    }

    $dtFormatted = $dtLanc -replace '-', ''
    $strBruto = Format-MonetaryCents -Amount $vBruto
    $strDesc = Format-MonetaryCents -Amount $vDesc
    $strJuros = Format-MonetaryCents -Amount $vJuros
    $strLiquido = Format-MonetaryCents -Amount $vLiquido

    # Registro 6000 / 6100 - Lançamento Contábil Delimitado por Pipe
    $line = "|6100|$seq|$idLanc|$matricula|$cpfClean|$comp|$dtFormatted|$cDeb|$cCred|$strBruto|$strDesc|$strJuros|$strLiquido|$hist|"
    $validLines.Add($line)
}

# Registro 9999 - Trailer do Lote
$totalLines = $validLines.Count + 1
$validLines.Add("|9999|$totalLines|")

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllLines($ExportTxtPath, $validLines.ToArray(), $utf8NoBom)

if ($invalidRows.Count -gt 0) {
    $invalidRows | Export-Csv -LiteralPath $InvalidCsvPath -NoTypeInformation -Encoding UTF8
} elseif (Test-Path -LiteralPath $InvalidCsvPath) {
    Remove-Item -LiteralPath $InvalidCsvPath -Force
}

Write-Output ("EXPORT_OK|Validos={0}|Invalidos={1}|Arquivo={2}" -f ($validLines.Count - 2), $invalidRows.Count, $ExportTxtPath)
