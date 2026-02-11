#!/usr/bin/env python3
"""
Validazione migrazione dati Legacy -> Produzione per il progetto Lemmario.

Confronta i dati locali in old_website/ (fonte di verita) con l'API di produzione.

Livelli:
  --level quick   : Solo conteggi collection (~5s)
  --level sample  : Conteggi + 10 lemmi campione (~30s)
  --level full    : Conteggi + tutti i 234 lemmi (~3-5 min)

Uso:
  python3 scripts/validation/validate-migration.py --level quick
  python3 scripts/validation/validate-migration.py --level sample --api https://glossari.dh.unica.it/api
  python3 scripts/validation/validate-migration.py --level full --report
"""

import argparse
import html as html_module
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from datetime import datetime
from typing import Any

# --- Configurazione ---

DEFAULT_API_BASE = "https://glossari.dh.unica.it/api"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
OLD_WEBSITE_DIR = os.path.join(PROJECT_ROOT, "old_website")
REPORT_DIR = os.path.join(PROJECT_ROOT, "report_migration")
RATE_LIMIT_MS = 100

SAMPLE_LEMMI = [
    ("additio", "latino"),
    ("camera", "latino"),
    ("camera", "volgare"),
    ("usura", "latino"),
    ("usura", "volgare"),
    ("ragione", "volgare"),
    ("forma", "latino"),
    ("moneta", "volgare"),
    ("algebra", "volgare"),
    ("visitatores", "latino"),
]

# --- Utilita ---


def normalize_text(text: str) -> str:
    """Normalizza testo per confronto: strip, whitespace collassato, NFC."""
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def fetch_api(api_base: str, endpoint: str, retries: int = 2) -> dict[str, Any]:
    """Fetch JSON dall'API Payload CMS con retry."""
    url = f"{api_base}/{endpoint}"
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url)
            req.add_header("Accept", "application/json")
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt < retries:
                time.sleep(1)
                continue
            print(f"  ERRORE API: {url} -> {e}", file=sys.stderr)
            return {"docs": [], "totalDocs": -1}


def rate_limit():
    """Pausa per rate limiting."""
    time.sleep(RATE_LIMIT_MS / 1000)


# --- Parser HTML Legacy ---


def preprocess_html(html_content: str) -> str:
    """Pre-processing HTML come htmlParser.ts riga 178."""
    return re.sub(r"(?<![</])p>", "<p>", html_content)


def parse_legacy_html(filepath: str) -> dict[str, Any]:
    """Parsa un file HTML legacy ed estrae definizioni, ricorrenze, livelli.

    Replica la logica di scripts/migration/parsers/htmlParser.ts.
    """
    with open(filepath, encoding="utf-8") as f:
        raw_html = f.read()

    html_content = preprocess_html(raw_html)

    # Estrai contenuto del div#lemma
    lemma_match = re.search(
        r'<div\s+id="lemma">([\s\S]*?)</div>\s*$', html_content, re.IGNORECASE
    )
    content = lemma_match.group(1) if lemma_match else html_content

    sections = content.split("<hr>")
    definizioni = []
    contenuto_ignorato = []

    for idx, section in enumerate(sections):
        # Cerca numero definizione: <strong>N.</strong>
        def_match = re.search(
            r"<p><strong>(\d+)\.</strong>\s*([\s\S]+?)</p>", section
        )
        if not def_match:
            text = re.sub(r"<[^>]+>", "", section).strip()
            if text and len(text) > 10:
                contenuto_ignorato.append(
                    f"Sezione {idx + 1} senza numero definizione"
                )
            continue

        numero = int(def_match.group(1))

        # Estrai testo definizione (strip HTML tags)
        testo_html = def_match.group(2)
        testo = re.sub(r"<[^>]+>", "", testo_html).strip()
        testo = html_module.unescape(testo)

        # Estrai livello razionalita
        livello = None
        livello_match = re.search(
            r"Livello di razionalit..?:</strong>\s*(\d+)", section
        )
        if livello_match:
            livello = int(livello_match.group(1))

        # Estrai ricorrenze: processa ogni <li> come fa htmlParser.ts
        # Ogni <li> ha un link a.bibliografia-link con data-biblio
        # e puo contenere piu <p>, ognuno con una citazione «...»
        # Tutte le citazioni nella stessa <li> condividono lo shorthand_id
        ricorrenze = []
        li_blocks = re.findall(r"<li>([\s\S]*?)</li>", section)

        for li_html in li_blocks:
            # Estrai shorthand_id dal link bibliografia
            biblio_match = re.search(r'data-biblio="([^"]+)"', li_html)
            shorthand_id = biblio_match.group(1) if biblio_match else ""

            # Trova tutti i <p> e le citazioni «...» dentro ogni <p>
            p_blocks = re.findall(r"<p>([\s\S]*?)</p>", li_html)
            if not p_blocks:
                # Fallback: cerca citazioni nell'intero <li>
                p_blocks = [li_html]

            for p_html in p_blocks:
                p_text = re.sub(r"<[^>]+>", "", p_html).strip()
                citazione_match = re.search(
                    r"\u00ab([\s\S]+?)\u00bb", p_text
                )
                if citazione_match:
                    citazione_clean = normalize_text(
                        citazione_match.group(1)
                    )
                    if citazione_clean and shorthand_id:
                        ricorrenze.append(
                            {
                                "citazione": citazione_clean[:200],
                                "shorthand_id": shorthand_id,
                            }
                        )
                    elif citazione_clean:
                        contenuto_ignorato.append(
                            f"Ricorrenza incompleta (citazione o fonte mancante): {citazione_clean[:80]}..."
                        )

        definizioni.append(
            {
                "numero": numero,
                "testo": normalize_text(testo)[:200],
                "livello": livello,
                "ricorrenze": ricorrenze,
                "ricorrenze_count": len(ricorrenze),
            }
        )

    # Cross-references
    cross_refs = re.findall(r'data-lemma="([^"]+)"', content)

    return {
        "definizioni": definizioni,
        "definizioni_count": len(definizioni),
        "ricorrenze_count": sum(d["ricorrenze_count"] for d in definizioni),
        "cross_refs": cross_refs,
        "contenuto_ignorato": contenuto_ignorato,
    }


# --- Validazioni ---


def quick_check(api_base: str) -> dict[str, Any]:
    """Livello 1: Confronta conteggi totali."""
    print("\n=== LIVELLO 1: Quick Check (conteggi) ===\n")

    # Carica dati legacy
    with open(os.path.join(OLD_WEBSITE_DIR, "indice.json"), encoding="utf-8") as f:
        indice = json.load(f)
    with open(
        os.path.join(OLD_WEBSITE_DIR, "bibliografia.json"), encoding="utf-8"
    ) as f:
        bibliografia = json.load(f)

    legacy_counts = {
        "lemmi": len(indice["lemmi"]),
        "fonti": len(bibliografia),
    }

    # Conta definizioni e ricorrenze parsando tutti gli HTML
    total_defs = 0
    total_rics = 0
    total_cross_refs = 0
    for entry in indice["lemmi"]:
        filepath = os.path.join(OLD_WEBSITE_DIR, "lemmi", entry["file"])
        if os.path.exists(filepath):
            parsed = parse_legacy_html(filepath)
            total_defs += parsed["definizioni_count"]
            total_rics += parsed["ricorrenze_count"]
            total_cross_refs += len(parsed["cross_refs"])

    legacy_counts["definizioni"] = total_defs
    legacy_counts["ricorrenze"] = total_rics
    legacy_counts["cross_refs_legacy"] = total_cross_refs

    # Fetch conteggi produzione
    collections = {
        "lemmi": "lemmi",
        "fonti": "fonti",
        "definizioni": "definizioni",
        "ricorrenze": "ricorrenze",
        "varianti-grafiche": "varianti-grafiche",
        "riferimenti-incrociati": "riferimenti-incrociati",
        "livelli-razionalita": "livelli-razionalita",
    }

    prod_counts = {}
    for name, slug in collections.items():
        data = fetch_api(api_base, f"{slug}?limit=1&depth=0")
        prod_counts[name] = data.get("totalDocs", -1)
        rate_limit()

    # Confronto
    results = []
    for key in ["lemmi", "fonti", "definizioni", "ricorrenze"]:
        legacy_val = legacy_counts.get(key, "N/A")
        prod_val = prod_counts.get(key, -1)
        status = "OK" if legacy_val == prod_val else "MISMATCH"
        icon = "OK" if status == "OK" else "XX"
        print(f"  {icon} {key}: legacy={legacy_val} prod={prod_val}")
        results.append(
            {
                "collection": key,
                "legacy": legacy_val,
                "production": prod_val,
                "status": status,
            }
        )

    # Collection extra (senza corrispondente legacy diretto)
    for key in ["varianti-grafiche", "riferimenti-incrociati", "livelli-razionalita"]:
        prod_val = prod_counts.get(key, -1)
        print(f"  -- {key}: prod={prod_val}")
        results.append(
            {
                "collection": key,
                "legacy": "N/A",
                "production": prod_val,
                "status": "INFO",
            }
        )

    print(f"\n  Cross-references nel legacy: {total_cross_refs} (non migrati)")

    failures = [r for r in results if r["status"] == "MISMATCH"]
    print(
        f"\n  Risultato: {'TUTTO OK' if not failures else f'{len(failures)} DISCREPANZE'}"
    )

    return {
        "level": "quick",
        "results": results,
        "legacy_counts": legacy_counts,
        "prod_counts": prod_counts,
        "failures": failures,
    }


def sample_check(api_base: str) -> dict[str, Any]:
    """Livello 2: Quick check + 10 lemmi campione deep compare."""
    quick_results = quick_check(api_base)

    print("\n=== LIVELLO 2: Sample Check (10 lemmi campione) ===\n")

    # Carica indice per mapping file
    with open(os.path.join(OLD_WEBSITE_DIR, "indice.json"), encoding="utf-8") as f:
        indice = json.load(f)

    file_map = {(e["nome"], e["tipo"]): e["file"] for e in indice["lemmi"]}

    # Fetch tutti i lemmi da produzione (bulk)
    prod_data = fetch_api(api_base, "lemmi?limit=500&depth=0")
    prod_lemmi = {(l["termine"], l["tipo"]): l for l in prod_data.get("docs", [])}

    lemma_results = []

    for termine, tipo in SAMPLE_LEMMI:
        print(f"  Verifico: {termine} ({tipo})...")

        # Legacy
        filename = file_map.get((termine, tipo))
        if not filename:
            lemma_results.append(
                {
                    "termine": termine,
                    "tipo": tipo,
                    "status": "LEGACY_MISSING",
                    "detail": "File non trovato in indice.json",
                }
            )
            continue

        filepath = os.path.join(OLD_WEBSITE_DIR, "lemmi", filename)
        if not os.path.exists(filepath):
            lemma_results.append(
                {
                    "termine": termine,
                    "tipo": tipo,
                    "status": "FILE_MISSING",
                    "detail": f"File {filename} non esiste",
                }
            )
            continue

        legacy_parsed = parse_legacy_html(filepath)

        # Produzione
        prod_lemma = prod_lemmi.get((termine, tipo))
        if not prod_lemma:
            lemma_results.append(
                {
                    "termine": termine,
                    "tipo": tipo,
                    "status": "PROD_MISSING",
                    "detail": "Lemma non trovato in produzione",
                }
            )
            continue

        lemma_id = prod_lemma["id"]

        # Fetch definizioni produzione
        rate_limit()
        prod_defs_data = fetch_api(
            api_base,
            f"definizioni?where%5Blemma%5D%5Bequals%5D={lemma_id}&depth=1&limit=50",
        )
        prod_defs = prod_defs_data.get("docs", [])

        # Fetch ricorrenze per ogni definizione
        prod_ric_total = 0
        prod_defs_detail = []
        for pd in prod_defs:
            rate_limit()
            ric_data = fetch_api(
                api_base,
                f"ricorrenze?where%5Bdefinizione%5D%5Bequals%5D={pd['id']}&depth=1&limit=100",
            )
            ric_count = ric_data.get("totalDocs", 0)
            prod_ric_total += ric_count

            # Livello razionalita
            livello_prod = None
            lr = pd.get("livello_razionalita")
            if isinstance(lr, dict):
                livello_prod = lr.get("numero")
            elif isinstance(lr, (int, float)):
                livello_prod = int(lr)

            prod_defs_detail.append(
                {
                    "numero": pd.get("numero"),
                    "testo": normalize_text(pd.get("testo", ""))[:200],
                    "livello": int(livello_prod) if livello_prod else None,
                    "ricorrenze_count": ric_count,
                }
            )

        # Confronto
        issues = []

        # Conteggio definizioni
        if legacy_parsed["definizioni_count"] != len(prod_defs):
            issues.append(
                f"Definizioni: legacy={legacy_parsed['definizioni_count']} prod={len(prod_defs)}"
            )

        # Conteggio ricorrenze
        if legacy_parsed["ricorrenze_count"] != prod_ric_total:
            issues.append(
                f"Ricorrenze: legacy={legacy_parsed['ricorrenze_count']} prod={prod_ric_total}"
            )

        # Confronto livelli per definizione (match per numero, non per indice)
        prod_defs_by_num = {
            d["numero"]: d for d in prod_defs_detail if d.get("numero")
        }
        for leg_def in legacy_parsed["definizioni"]:
            prod_def = prod_defs_by_num.get(leg_def["numero"])
            if not prod_def:
                issues.append(
                    f"Def {leg_def['numero']} non trovata in produzione"
                )
                continue

            # Confronto livelli
            if leg_def["livello"] and prod_def["livello"]:
                if leg_def["livello"] != prod_def["livello"]:
                    issues.append(
                        f"Def {leg_def['numero']} livello: legacy={leg_def['livello']} prod={prod_def['livello']}"
                    )

            # Confronto ricorrenze per definizione
            if leg_def["ricorrenze_count"] != prod_def["ricorrenze_count"]:
                issues.append(
                    f"Def {leg_def['numero']} ricorrenze: legacy={leg_def['ricorrenze_count']} prod={prod_def['ricorrenze_count']}"
                )

        status = "OK" if not issues else "ISSUES"
        icon = "OK" if status == "OK" else "!!"

        detail = {
            "termine": termine,
            "tipo": tipo,
            "status": status,
            "legacy_defs": legacy_parsed["definizioni_count"],
            "prod_defs": len(prod_defs),
            "legacy_rics": legacy_parsed["ricorrenze_count"],
            "prod_rics": prod_ric_total,
            "issues": issues,
            "slug": prod_lemma.get("slug", ""),
            "pubblicato": prod_lemma.get("pubblicato", False),
        }

        print(
            f"    {icon} defs: {legacy_parsed['definizioni_count']}/{len(prod_defs)}  "
            f"rics: {legacy_parsed['ricorrenze_count']}/{prod_ric_total}  "
            f"{'  '.join(issues) if issues else 'tutto OK'}"
        )

        lemma_results.append(detail)

    failures = [r for r in lemma_results if r["status"] != "OK"]
    print(
        f"\n  Risultato campione: {len(lemma_results) - len(failures)}/{len(lemma_results)} OK"
    )
    if failures:
        print(f"  Lemmi con problemi: {len(failures)}")

    return {
        **quick_results,
        "level": "sample",
        "lemma_results": lemma_results,
        "sample_failures": failures,
    }


def full_check(api_base: str) -> dict[str, Any]:
    """Livello 3: Quick check + tutti i 234 lemmi."""
    quick_results = quick_check(api_base)

    print("\n=== LIVELLO 3: Full Check (tutti i lemmi) ===\n")

    # Carica dati
    with open(os.path.join(OLD_WEBSITE_DIR, "indice.json"), encoding="utf-8") as f:
        indice = json.load(f)
    with open(
        os.path.join(OLD_WEBSITE_DIR, "bibliografia.json"), encoding="utf-8"
    ) as f:
        bibliografia = json.load(f)

    # Fetch bulk produzione
    prod_lemmi_data = fetch_api(api_base, "lemmi?limit=500&depth=0")
    prod_lemmi = {
        (l["termine"], l["tipo"]): l for l in prod_lemmi_data.get("docs", [])
    }

    prod_fonti_data = fetch_api(api_base, "fonti?limit=200&depth=0")
    prod_fonti = {
        f["shorthand_id"]: f for f in prod_fonti_data.get("docs", []) if f.get("shorthand_id")
    }

    # --- Validazione Lemmi ---
    print("  Fase 1: Validazione lemmi...")
    lemmi_missing = []
    lemmi_slug_errors = []
    lemmi_not_published = []

    for entry in indice["lemmi"]:
        key = (entry["nome"], entry["tipo"])
        if key not in prod_lemmi:
            lemmi_missing.append(entry)
        else:
            pl = prod_lemmi[key]
            if entry["tipo"] == "latino" and not pl["slug"].endswith("-lat"):
                lemmi_slug_errors.append(
                    f"{entry['nome']}: slug={pl['slug']} (manca -lat)"
                )
            if not pl.get("pubblicato"):
                lemmi_not_published.append(entry["nome"])

    print(f"    Lemmi mancanti: {len(lemmi_missing)}")
    print(f"    Slug errati: {len(lemmi_slug_errors)}")
    print(f"    Non pubblicati: {len(lemmi_not_published)}")

    # --- Validazione Fonti ---
    print("  Fase 2: Validazione fonti...")
    fonti_missing = []
    fonti_field_mismatches = []

    for sid, data in bibliografia.items():
        if sid not in prod_fonti:
            fonti_missing.append(sid)
        else:
            pf = prod_fonti[sid]
            if data.get("title") and data["title"] != pf.get("titolo", ""):
                fonti_field_mismatches.append(
                    f"{sid}: titolo legacy='{data['title'][:50]}' prod='{pf.get('titolo', '')[:50]}'"
                )

    print(f"    Fonti mancanti: {len(fonti_missing)}")
    print(f"    Campi diversi: {len(fonti_field_mismatches)}")

    # --- Validazione Definizioni e Ricorrenze per lemma ---
    print("  Fase 3: Validazione definizioni e ricorrenze per lemma...")
    def_mismatches = []
    ric_mismatches = []
    processed = 0

    for entry in indice["lemmi"]:
        key = (entry["nome"], entry["tipo"])
        if key not in prod_lemmi:
            continue

        filepath = os.path.join(OLD_WEBSITE_DIR, "lemmi", entry["file"])
        if not os.path.exists(filepath):
            continue

        legacy_parsed = parse_legacy_html(filepath)
        lemma_id = prod_lemmi[key]["id"]

        rate_limit()
        prod_defs_data = fetch_api(
            api_base,
            f"definizioni?where%5Blemma%5D%5Bequals%5D={lemma_id}&depth=0&limit=50",
        )
        prod_def_count = prod_defs_data.get("totalDocs", 0)

        if legacy_parsed["definizioni_count"] != prod_def_count:
            def_mismatches.append(
                {
                    "termine": entry["nome"],
                    "tipo": entry["tipo"],
                    "legacy": legacy_parsed["definizioni_count"],
                    "production": prod_def_count,
                }
            )

        # Per le ricorrenze, conta il totale per tutte le definizioni
        prod_ric_total = 0
        for pd in prod_defs_data.get("docs", []):
            rate_limit()
            ric_data = fetch_api(
                api_base,
                f"ricorrenze?where%5Bdefinizione%5D%5Bequals%5D={pd['id']}&depth=0&limit=1",
            )
            prod_ric_total += ric_data.get("totalDocs", 0)

        if legacy_parsed["ricorrenze_count"] != prod_ric_total:
            ric_mismatches.append(
                {
                    "termine": entry["nome"],
                    "tipo": entry["tipo"],
                    "legacy": legacy_parsed["ricorrenze_count"],
                    "production": prod_ric_total,
                }
            )

        processed += 1
        if processed % 25 == 0:
            print(f"    Processati {processed}/{len(indice['lemmi'])} lemmi...")

    print(f"    Definizioni con conteggio diverso: {len(def_mismatches)}")
    print(f"    Ricorrenze con conteggio diverso: {len(ric_mismatches)}")

    return {
        **quick_results,
        "level": "full",
        "lemmi_missing": lemmi_missing,
        "lemmi_slug_errors": lemmi_slug_errors,
        "lemmi_not_published": lemmi_not_published,
        "fonti_missing": fonti_missing,
        "fonti_field_mismatches": fonti_field_mismatches,
        "def_mismatches": def_mismatches,
        "ric_mismatches": ric_mismatches,
    }


# --- Report ---


def generate_report(data: dict[str, Any]) -> str:
    """Genera report Markdown."""
    timestamp = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    level = data.get("level", "unknown")

    lines = [
        "# Report Validazione Migrazione Legacy -> Produzione",
        "",
        f"**Data**: {timestamp}",
        f"**Livello**: {level}",
        "",
        "---",
        "",
        "## Conteggi Collection",
        "",
        "| Collection | Legacy | Produzione | Stato |",
        "|---|---|---|---|",
    ]

    for r in data.get("results", []):
        lines.append(
            f"| {r['collection']} | {r['legacy']} | {r['production']} | {r['status']} |"
        )

    lines.append("")

    # Cross-references
    cross_refs = data.get("legacy_counts", {}).get("cross_refs_legacy", 0)
    if cross_refs:
        lines.append(
            f"**Cross-references nel legacy**: {cross_refs} (non migrati - gap noto)"
        )
        lines.append("")

    # Dettaglio lemmi (sample o full)
    if "lemma_results" in data:
        lines.extend(
            [
                "---",
                "",
                "## Dettaglio Lemmi Campione",
                "",
                "| Lemma | Tipo | Def Legacy | Def Prod | Ric Legacy | Ric Prod | Stato |",
                "|---|---|---|---|---|---|---|",
            ]
        )
        for lr in data["lemma_results"]:
            lines.append(
                f"| {lr['termine']} | {lr['tipo']} | "
                f"{lr.get('legacy_defs', 'N/A')} | {lr.get('prod_defs', 'N/A')} | "
                f"{lr.get('legacy_rics', 'N/A')} | {lr.get('prod_rics', 'N/A')} | "
                f"{lr['status']} |"
            )

        # Issues dettagliate
        issues_lemmi = [lr for lr in data["lemma_results"] if lr.get("issues")]
        if issues_lemmi:
            lines.extend(["", "### Dettaglio Problemi", ""])
            for lr in issues_lemmi:
                lines.append(f"**{lr['termine']} ({lr['tipo']})**:")
                for issue in lr["issues"]:
                    lines.append(f"- {issue}")
                lines.append("")

    # Dettaglio full check
    if data.get("level") == "full":
        lines.extend(["---", "", "## Risultati Full Check", ""])

        if data.get("lemmi_missing"):
            lines.append("### Lemmi Mancanti in Produzione")
            lines.append("")
            for m in data["lemmi_missing"]:
                lines.append(f"- {m['nome']} ({m['tipo']})")
            lines.append("")

        if data.get("fonti_missing"):
            lines.append("### Fonti Mancanti in Produzione")
            lines.append("")
            for sid in data["fonti_missing"]:
                lines.append(f"- {sid}")
            lines.append("")

        if data.get("def_mismatches"):
            lines.extend(
                [
                    "### Definizioni con Conteggio Diverso",
                    "",
                    "| Lemma | Tipo | Legacy | Produzione |",
                    "|---|---|---|---|",
                ]
            )
            for dm in data["def_mismatches"]:
                lines.append(
                    f"| {dm['termine']} | {dm['tipo']} | {dm['legacy']} | {dm['production']} |"
                )
            lines.append("")

        if data.get("ric_mismatches"):
            lines.extend(
                [
                    "### Ricorrenze con Conteggio Diverso",
                    "",
                    "| Lemma | Tipo | Legacy | Produzione |",
                    "|---|---|---|---|",
                ]
            )
            for rm in data["ric_mismatches"]:
                lines.append(
                    f"| {rm['termine']} | {rm['tipo']} | {rm['legacy']} | {rm['production']} |"
                )
            lines.append("")

        if data.get("fonti_field_mismatches"):
            lines.append("### Fonti con Campi Diversi")
            lines.append("")
            for fm in data["fonti_field_mismatches"]:
                lines.append(f"- {fm}")
            lines.append("")

        if not any(
            data.get(k)
            for k in [
                "lemmi_missing",
                "fonti_missing",
                "def_mismatches",
                "ric_mismatches",
            ]
        ):
            lines.append("**Nessuna discrepanza trovata.**")
            lines.append("")

    # Gap noti
    lines.extend(
        [
            "---",
            "",
            "## Gap Noti (non errori)",
            "",
            "- **Varianti grafiche**: non estratte dal parser di migrazione (0 in produzione)",
            "- **Riferimenti incrociati**: presenti nel legacy HTML (`data-lemma`), non migrati (0 in produzione)",
            "- **forma.html (latino)**: 6 citazioni troncate nel dato sorgente (`<<` senza `>>` di chiusura)",
            "- **ragione.html (volgare)**: 8 ricorrenze con fonti non parsabili",
            "- **libro.html (volgare)**: 1 citazione incompleta",
            "",
            "---",
            "",
            f"*Report generato automaticamente il {timestamp}*",
        ]
    )

    return "\n".join(lines)


# --- Main ---


def main():
    parser = argparse.ArgumentParser(
        description="Validazione migrazione dati Lemmario"
    )
    parser.add_argument(
        "--level",
        choices=["quick", "sample", "full"],
        default="quick",
        help="Livello di validazione (default: quick)",
    )
    parser.add_argument(
        "--api",
        default=DEFAULT_API_BASE,
        help=f"Base URL API produzione (default: {DEFAULT_API_BASE})",
    )
    parser.add_argument(
        "--report",
        action="store_true",
        help="Salva report Markdown in report_migration/",
    )
    args = parser.parse_args()

    print(f"Validazione migrazione Lemmario - Livello: {args.level}")
    print(f"API: {args.api}")
    print(f"Dati legacy: {OLD_WEBSITE_DIR}")

    start_time = time.time()

    if args.level == "quick":
        results = quick_check(args.api)
    elif args.level == "sample":
        results = sample_check(args.api)
    elif args.level == "full":
        results = full_check(args.api)
    else:
        results = quick_check(args.api)

    elapsed = time.time() - start_time
    print(f"\nDurata: {elapsed:.1f}s")

    if args.report:
        os.makedirs(REPORT_DIR, exist_ok=True)
        date_str = datetime.now().strftime("%Y-%m-%d")
        report_path = os.path.join(
            REPORT_DIR, f"validation_{args.level}_{date_str}.md"
        )
        report = generate_report(results)
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"\nReport salvato: {report_path}")


if __name__ == "__main__":
    main()
