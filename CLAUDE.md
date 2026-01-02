# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lemmario** is a specialized dictionary of historical Italian mathematical and economic terminology from medieval and Renaissance statutes and documents. The project is currently in migration from a static website (https://lemmario.netlify.app/) to a dynamic TypeScript-based platform.

## Project Status

This repository is in **initial setup phase**. The [old_website](old_website/) directory contains the legacy static site data that needs to be migrated:

- **239 lemma entries** (dictionary entries) as HTML files in [old_website/lemmi/](old_website/lemmi/)
- [old_website/bibliografia.json](old_website/bibliografia.json) - bibliographic references database
- [old_website/indice.json](old_website/indice.json) - index of all lemmas with metadata

There is currently no TypeScript/JavaScript codebase yet.

## Data Structure

### Lemma Entries
Each lemma (dictionary entry) in [old_website/lemmi/](old_website/lemmi/) contains:
- **Title** (lemma name in Italian or Latin)
- **Definitions** (numbered, can have multiple meanings)
- **Occurrences** (ricorrenza) - citations from historical sources with:
  - Bibliographic reference (links to bibliografia.json)
  - Original text excerpt in medieval Italian or Latin
  - Page/location reference
- **Rationality level** (livello di razionalità) - classification system (1-4):
  - Level 2: Operations
  - Level 4: Technical elements

### Index Structure
[old_website/indice.json](old_website/indice.json) defines lemmas with:
```json
{ "nome": "additio", "tipo": "latino", "file": "additio.html" }
```
- `tipo` is either "volgare" (vernacular Italian) or "latino" (Latin)
- Some lemmas exist in both languages with different files (e.g., `camera_lat.html` and `camera_volg.html`)

### Bibliography Structure
[old_website/bibliografia.json](old_website/bibliografia.json) uses shorthand IDs as keys:
```json
"Stat.fornai.1339": {
  "title": "Statuto dell'Arte dei fornai...",
  "date": "1339",
  "reference": "Full citation..."
}
```

## Development Architecture Considerations

When building the TypeScript migration:

1. **Data Model**: Preserve the multi-definition structure where single lemmas can have multiple numbered meanings, each with their own citations and rationality levels

2. **Bilingual Support**: Handle both Italian (volgare) and Latin (latino) entries, including cases where the same term exists in both languages

3. **Citation Linking**: Maintain the connection between lemma citations and the bibliography database using the shorthand reference system

4. **Historical Text Encoding**: The HTML files contain medieval Italian and Latin text with specific formatting. Consider how to parse and preserve this formatting in the new system

5. **Classification System**: The "livello di razionalità" (rationality level) is a research-specific taxonomy that categorizes mathematical/economic concepts by their abstraction level

## Language and Domain

This is a specialized academic project dealing with:
- Medieval and Renaissance Italian economic/mathematical terminology
- Historical Latin legal and commercial texts
- Digital humanities / corpus linguistics
- Historical lexicography

The primary language of the interface and data is **Italian**, though source texts include both medieval Italian and Latin.
