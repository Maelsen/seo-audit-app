#!/usr/bin/env tsx
// scripts/seed-vasileios-audit.ts
//
// Seedet ein Audit-JSON mit den exakten Vasileios Waschbaer-Service Texten pro Milestone.
// Ersetzt den frueheren Inline-Python-Block in .claude/skills/seed-vasileios-audit/SKILL.md
// (Skill-Args-Resolver hatte $1/$2 falsch aufgeloest — TS-argv ist deterministisch).
//
// Usage:
//   tsx scripts/seed-vasileios-audit.ts <auditId> [milestone]
//
// Args:
//   auditId  Pflicht. Output unter data/audits/<auditId>.json (ueberschreibt).
//   milestone Optional, Default "all". Eines von M5|M6|M7|M8|M9|M10|M11|M12|M13|all.
//
// Wenn ein nicht-implementierter Milestone (M9-M13 aktuell) angefragt wird:
// Skript warnt + ueberspringt, statt zu crashen.
//
// Wenn ein neuer Milestone gebaut wird: einfach DATA-Dict erweitern.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

type Milestone = "M5" | "M6" | "M7" | "M8" | "M9" | "M10" | "M11" | "M12" | "M13";
type DataPatch = Record<string, unknown>;

const DATA: Partial<Record<Milestone, DataPatch>> = {
  M5: {
    topRisks: [
      {
        title: "Die Seite führt Besucher nicht – sie lässt sie treiben",
        description:
          "Wer auf eure Startseite kommt sieht zuerst einen Cookie-Banner der das halbe Display einnimmt, dann allgemeine Informationen – aber keinen klaren Grund anzurufen. Kein auffälliger Button, keine Telefonnummer im sichtbaren Bereich, keine Bewertungen beim ersten Eindruck. Der Traffic ist da. Die Anfragen bleiben aus.",
      },
      {
        title: "Google vertraut deiner Seite kaum",
        description:
          "3 Backlinks von 2 Domains. Kein lokales Schema-Markup. Kein Identity-Schema. Google Reviews sind vorhanden aber werden nicht auf der Website eingebunden – nur ein externer Link führt zum GBP. Das bedeutet: Google sieht eine Seite ohne externe Bestätigung, ohne strukturierte Daten und ohne klares Autoritätssignal. In umkämpften Suchanfragen verlierst du damit gegen Wettbewerber die diese Basics gesetzt haben – unabhängig davon wie gut dein Service ist.",
      },
      {
        title: "Dein Content ist überall, aber nirgendwo stark genug",
        description:
          "Stadtseiten existieren, aber sie sind reines Keyword-Stuffing ohne echten Mehrwert für den Leser. Die Dienstleistungsseiten haben keine Painpoints, keine konkreten Beispiele, kein spezifisches FAQ. Das gleiche FAQ steht auf jeder einzelnen Seite. Google erkennt Duplicate Content und stuft diese Seiten entsprechend niedrig ein. Du hast die Struktur, aber nicht die Substanz.",
      },
    ],
    comparison: {
      heading: "Wo du heute stehst – wo du in 3 Monaten sein könntest",
      altSentences: [
        {
          aspect: "Statt einer Seite die Besucher treiben lässt",
          vision:
            "Eine Hero-Section mit einer Kernbotschaft die einen Painpoint trifft – „Zuverlässige Gebäudereinigung in Warendorf – ohne Ausfälle, ohne Erklärungsaufwand, mit festem Ansprechpartner.\" Darunter direkt Social Proof und ein CTA der Verbindlichkeit schafft.",
        },
        {
          aspect: "Statt einer Seite der Google kaum vertraut",
          vision:
            "Schema-Markup gesetzt, Reviews direkt auf der Startseite eingebunden, erste Backlinks aus lokalen Quellen aufgebaut. Google ordnet dich eindeutig ein und zeigt dich häufiger.",
        },
        {
          aspect: "Statt Stadtseiten die wie Keyword-Stuffing klingen",
          vision:
            "Jede Stadtseite spricht ein konkretes Problem an, hat ein eigenes seitenspezifisches FAQ und gibt Google genug Substanz zum Ranken. Gleiches gilt für alle Dienstleistungsseiten.",
        },
      ],
      rows: [
        { problem: "Nutzerführung Startseite", today: "Unklar, kein roter Faden", future: "Klarer Funnel mit Ziel" },
        { problem: "Lokale Rankings", today: "Vereinzelt", future: "Stabil Top 5 in der Region" },
        { problem: "Domain-Autorität", today: "Minimal", future: "Erste externe Signale" },
        { problem: "Content-Qualität Unterseiten", today: "Dünn & austauschbar", future: "Spezifisch & rankingfähig" },
        { problem: "Google Reviews sichtbar", today: "Nur externer Link", future: "Direkt auf der Startseite" },
        { problem: "Stadtseiten-Qualität", today: "Keyword-Stuffing", future: "Echte Landingpages" },
        { problem: "Mobile Ladezeit", today: "13 Sekunden", future: "Unter 3 Sekunden" },
      ],
    },
  },
  M6: {
    sections: {
      onpageSeo: {
        score: "C+",
        heading: "Technisch vorhanden – aber nicht optimal genutzt",
        text: "Die Grundlagen stimmen: SSL, Sitemap, robots.txt und Canonical-Tags sind gesetzt. Das Problem liegt eine Ebene tiefer – Google kann deine Seite lesen, aber nicht richtig einordnen.",
        findings: [
          { problem: "Title-Tag Länge", befund: "62 Zeichen – wird in Suchergebnissen abgeschnitten", status: "warning" },
          { problem: "H1-Tags", befund: "Auf 29 Seiten mehrfach vorhanden – sollte einzigartig sein", status: "warning" },
          { problem: "Duplicate H1", befund: "17 Seiten mit identischen H1-Tags", status: "fail" },
          { problem: "Keyword-Verteilung", befund: "Ziel-Keywords erscheinen zu selten in H2/H3", status: "warning" },
          { problem: "Identity-Schema", befund: "Fehlt komplett (Google kann Unternehmen nicht eindeutig zuordnen)", status: "fail" },
          { problem: "Alt-Texte", befund: "1 von 12 Bildern ohne Alt-Text", status: "warning" },
          { problem: "Wortanzahl Startseite", befund: "~420 Wörter – unter dem Minimum für rankingfähige Seiten", status: "warning" },
          { problem: "SSL / HTTPS", befund: "Aktiv und korrekt weitergeleitet", status: "ok" },
          { problem: "robots.txt", befund: "Vorhanden", status: "ok" },
          { problem: "Canonical-Tag", befund: "Korrekt gesetzt", status: "ok" },
          { problem: "Sitemap", befund: "Vorhanden und zugänglich", status: "ok" },
        ],
        costText:
          "Dein Title-Tag wird in den Suchergebnissen abgeschnitten – potenzielle Kunden sehen nicht den vollständigen Namen deines Unternehmens. Auf 17 Seiten steht derselbe H1-Tag – Google weiß nicht welche Seite für welches Keyword relevant ist. Und ohne Identity-Schema kann kein KI-System dein Unternehmen zuverlässig empfehlen wenn jemand fragt „welcher Reinigungsdienst in (Region) ist gut?“",
        actions: [
          { title: "Title-Tag auf maximal 60 Zeichen kürzen", detail: "Empfehlung: „Gebäudereinigung Warendorf – Waschbär Service“ (46 Zeichen)" },
          { title: "Einzigartigen H1 für jede Seite setzen – Seitenthema klar benennen" },
          { title: "Ziel-Keywords gezielt in H2 und H3 einbauen (gesunde Header Struktur bauen)", detail: "Beispiel Büroreinigung-Seite: Statt „Unsere Leistungen“ → „Büroreinigung Warendorf – was ist enthalten?“" },
          { title: "Identity-Schema implementieren", detail: "Damit Google und KI-Systeme dein Unternehmen eindeutig zuordnen" },
          { title: "Alt-Text für fehlendes Bild nachtragen" },
        ],
        serpPreview: {
          title: "Waschbär Gebäudereinigung | Ihre Reinigungsfirma aus ...",
          url: "https://waschbaer-service.de",
          description: "Gebäudereinigung in Warendorf ✓ Top Service ✓ Sauberkeit für Gewerbe, Büro & Privat ✓ Ihre bärenstarke Reinigungsfirma. — Jetzt anfragen.",
        },
        h2h6Frequency: { h2: 3, h3: 12, h4: 0, h5: 0, h6: 18 },
      },
    },
  },
  M7: {
    sections: {
      uxConversion: {
        score: "C-",
        heading: "Die Seite hat gute Zutaten – aber kein Rezept",
        text: "Deine Website bietet eine solide Basis – doch ein Besucher entscheidet in den ersten 3 Sekunden ob er bleibt oder geht. Aktuell fehlt der rote Faden der diese Elemente in eine klare Anfrage verwandelt. Das Potenzial ist vorhanden – es wird nur noch nicht genutzt.",
        findings: [
          { problem: "Hero-Section", befund: "„Aus Liebe zur Reinheit\" löst keinen Painpoint – kein Grund direkt anzurufen", status: "warning" },
          { problem: "Wording & Positionierung", befund: "Beschreibt das Angebot statt Probleme zu lösen", status: "fail" },
          { problem: "Nutzerführung", befund: "Gute Elemente vorhanden aber nicht in einen klaren Funnel eingebettet", status: "fail" },
          { problem: "Google Reviews", befund: "Vorhanden aber nur als externer Link – nicht auf der Seite sichtbar", status: "fail" },
          { problem: "Social Proof", befund: "Kein Bewertungs-Widget, keine Kundenstimmen direkt sichtbar", status: "fail" },
          { problem: "Text- & Button-Ausrichtung", befund: "Inkonsistent – wirkt unprofessionell auf Mobile & Desktop", status: "warning" },
          { problem: "Leistungsseiten", befund: "Bilder vorhanden aber keine Beschreibung, keine Painpoints", status: "fail" },
          { problem: "Prozessbeschreibung", befund: "Versteckt auf Unterseite – wertvoller USP den kaum jemand sieht", status: "warning" },
          { problem: "CTA", befund: "Vorhanden aber generisch – „Kostenloses Angebot anfordern\" schafft keine Dringlichkeit", status: "warning" },
          { problem: "FAQ", befund: "Identisch auf jeder Seite – nicht seitenspezifisch", status: "fail" },
          { problem: "Inhabervorstellung", befund: "Vorhanden – echter Vertrauensfaktor", status: "ok" },
          { problem: "Navigation", befund: "Übersichtlich und klar strukturiert", status: "ok" },
        ],
        costText:
          "Ein Gewerbekunde der auf deiner Startseite landet sucht eine Antwort auf ein konkretes Problem – Reinigungskraft ausgefallen, neues Objekt übernommen, aktueller Anbieter unzuverlässig. Deine Seite sagt ihm nicht dass du genau dieses Problem löst. Sie beschreibt was du machst – aber nicht warum das für ihn relevant ist. Er scrollt, findet nichts das ihn abholt, und ruft beim nächsten an.",
        actions: [
          { title: "Hero-Section mit Painpoint-Botschaft ersetzen", detail: "„Aus Liebe zur Reinheit\" – Ihr bärenstarker Servicepartner — Empfehlung: „Zuverlässige Gebäudereinigung im Kreis Warendorf – fester Ansprechpartner, keine Ausfälle, Rückmeldung in 12 Stunden\"" },
          { title: "Google Reviews direkt auf der Startseite einbinden – nicht nur als Link" },
          { title: "CTA konkretisieren", detail: "Aktuell: „Kostenloses Angebot anfordern\" — Empfehlung: „Jetzt Termin vereinbaren – wir melden uns in 12 Stunden\"" },
          { title: "Prozessbeschreibung auf die Startseite holen", detail: "Das ist ein echter Vertrauenshebel der aktuell versteckt ist" },
          { title: "FAQ auf jeder Seite seitenspezifisch gestalten", detail: "Büroreinigung-FAQ: „Wie oft sollte ein Büro gereinigt werden?\", Treppenhausreinigung-FAQ: „Wer ist für die Treppenhausreinigung zuständig – Mieter oder Vermieter?\"" },
          { title: "Text- und Button-Ausrichtung auf Mobile & Desktop vereinheitlichen" },
        ],
        closingNote: "Die meisten dieser Änderungen sind redaktionell – kein technischer Aufwand, aber direkter Impact auf Anfragerate.",
      },
    },
  },
  M8: {
    sections: {
      seitenstrukturContent: {
        score: "D",
        heading: "Du hast die Struktur – aber Google sieht keine Substanz",
        text: "Stadtseiten und Dienstleistungsseiten existieren – aber sie sind inhaltlich zu dünn und zu ähnlich um bei Google für relevante Suchanfragen zu erscheinen. Dabei sind genau diese Seiten der entscheidende Hebel für regionale Sichtbarkeit im Kreis Warendorf.",
        findings: [
          { problem: "Alle Dienstleistungsseiten", befund: "Keine Painpoints, keine konkreten Beispiele, kein Nutzen kommuniziert", status: "fail" },
          { problem: "Alle Stadtseiten", befund: "Identischer Aufbau, austauschbares Wording, reines Keyword-Stuffing", status: "fail" },
          { problem: "FAQ", befund: "Exakt gleich auf jeder Seite – kein seitenspezifischer Mehrwert", status: "fail" },
          { problem: "Wortanzahl Unterseiten", befund: "Zu gering für rankingfähige lokale Service-Seiten", status: "fail" },
          { problem: "Bilder auf Leistungsseiten", befund: "Vorhanden aber ohne Alt-Text und ohne Beschreibung", status: "warning" },
          { problem: "Prozessbeschreibung", befund: "Gut ausgearbeitet aber auf versteckter Unterseite", status: "warning" },
          { problem: "Blog-Artikel", befund: "Kommerziell aufgebaut statt informativ – wirkt wie Keyword-Stuffing", status: "fail" },
          { problem: "Interne Verlinkung", befund: "Kaum vorhanden zwischen Leistungs- und Stadtseiten", status: "fail" },
        ],
        costText:
          "Google bewertet jede Seite einzeln. Eine Stadtseite die für jede Stadt fast identisch klingt und nur den Ortsnamen austauscht wird nicht als eigenständige relevante Seite eingestuft – sie konkurriert mit sich selbst und rankt für keine Stadt wirklich gut. Deine Büroreinigungsseite beschreibt was du machst – aber nicht warum jemand in Telgte oder Münster gerade dich beauftragen sollte statt dem Wettbewerber der eine ausgearbeitete Seite hat.",
        actions: [
          { title: "Jede Dienstleistungsseite mit einem spezifischen Painpoint-Block ausstatten", detail: "„Ihre Reinigungskraft fällt kurzfristig aus? Wir springen ein – ohne lange Einarbeitungszeit.\"" },
          { title: "Stadtseiten inhaltlich differenzieren", detail: "Statt: „Wir sind gerne Ihr Servicepartner in Telgte\" Besser: Lokalen Bezug herstellen, spezifische Gewerbegebiete oder Besonderheiten der Stadt nennen" },
          { title: "Interne Verlinkung aufbauen – Stadtseiten und Leistungsseiten gegenseitig verlinken" },
          { title: "Blog-Artikel informativ umschreiben", detail: "Statt: „Gebäudereinigung in Sassenberg – wir sind gerne Ihr Partner\" Besser: „Treppenhausreinigung – wer ist zuständig, Mieter oder Vermieter? Das sagt das Gesetz\"" },
        ],
        closingNote: "Das ist der zeitintensivste Part – aber der mit dem größten langfristigen Impact auf Rankings außerhalb von Warendorf.",
      },
    },
  },
  M9: {
    sections: {
      lokalesSeo: {
        score: "C",
        heading: "Für Warendorf bereits sichtbar – im Umland noch viel Potenzial",
        text: "Für „Gebäudereinigung Warendorf\" rankst du bereits auf Platz 2 – das ist eine starke Ausgangsbasis. Der nächste Hebel liegt im Kreis Warendorf: Münster, Telgte, Sassenberg, Ahlen. Genau dort suchen Gewerbetreibende und Hausverwaltungen – und dort bist du aktuell kaum sichtbar.",
        findings: [
          { problem: "Lokales Schema-Markup", befund: "Fehlt komplett – stärkstes Signal für lokale Suche", status: "fail" },
          { problem: "Identity-Schema", befund: "Fehlt – Google kann Unternehmen nicht eindeutig zuordnen", status: "fail" },
          { problem: "Google Reviews auf Website", befund: "Nur externer Link – keine direkte Einbindung", status: "fail" },
          { problem: "Stadtseiten Qualität", befund: "Vorhanden aber zu dünn für echte Rankings im Umland", status: "warning" },
          { problem: "Google Business-Profil", befund: "Vorhanden und verknüpft", status: "ok" },
          { problem: "NAP-Daten", befund: "Name, Adresse, Telefon konsistent", status: "ok" },
          { problem: "HWK-Mitgliedschaft", befund: "Vorhanden – wird aber nicht prominent kommuniziert", status: "warning" },
          { problem: "Regionale Keywords", befund: "In Title-Tag und Meta-Description vorhanden", status: "ok" },
        ],
        costText:
          "Platz 2 für Warendorf ist gut – aber Warendorf hat 38.000 Einwohner. Münster hat 320.000. Telgte, Sassenberg und Ahlen zusammen nochmal gut 80.000. Wer in diesen Städten nach einem Reinigungsdienst sucht findet dich aktuell kaum – obwohl du dort aktiv arbeitest und das Einzugsgebiet auf der Website steht. Ohne lokales Schema-Markup und ohne ausgearbeitete Stadtseiten verschenkst du den größten Wachstumshebel den du hast.",
        actions: [
          { title: "Lokales Schema-Markup implementieren – stärkstes technisches Signal für Google Maps" },
          { title: "Google Reviews direkt auf der Startseite einbinden", detail: "Nicht als Link – als sichtbares Widget mit Sternebewertung" },
          { title: "HWK-Mitgliedschaft prominent auf der Startseite platzieren", detail: "Das ist ein Vertrauenssignal das Wettbewerber ohne Mitgliedschaft nicht haben" },
          { title: "Stadtseiten für Münster, Telgte und Sassenberg inhaltlich ausbauen", detail: "Diese drei haben das höchste Suchvolumen im Einzugsgebiet" },
          { title: "Google Business-Profil mit allen Leistungen, Fotos und Posts befüllen" },
        ],
        closingNote: "Schema-Markup und Reviews sind in einem Tag umsetzbar. Stadtseiten-Ausbau ist der größte langfristige Hebel für Wachstum außerhalb von Warendorf.",
        schemaMarkupCaption: "So sieht ein Schema-Markup aus",
      },
    },
  },
  M10: {
    sections: {
      leistung: {
        score: "B",
        heading: "Server stark – Bilder bremsen alles aus",
        text: "An sich stimmt die technische Basis, der Server antwortet in ca. 0,5 Sekunden, HTTP/2 aktiv, Komprimierung läuft. Das Problem sind die Bilder – sie machen 6,52 MB von insgesamt 7,24 MB Seitengröße aus. Auf Mobile ein K.O.-Kriterium.",
        serverResponseTime: 0.3,
        contentLoadTime: 4.3,
        scriptLoadTime: 10.0,
        pageSizeMb: 7.24,
        resourceCounts: { html: 6, js: 6, css: 3, img: 19, other: 8, total: 47 },
        // Pie-Verteilung MB: img dominiert mit ~90%, Rest verteilt sich.
        pageSizeBreakdown: { html: 0.45, js: 0.15, css: 0.07, img: 6.52, other: 0.05 },
        findings: [],
        costText:
          "Über 60% deiner potenziellen Kunden suchen am Smartphone. 13 Sekunden bis der Inhalt sichtbar ist bedeutet: Die meisten sind längst weg. Google bestraft langsame mobile Seiten direkt im Ranking – das kostet dich gleichzeitig Besucher und Positionen.",
        actions: [
          { title: "Alle Bilder auf WebP komprimieren und unter 1 MB Gesamtgröße bringen" },
          { title: "Ungenutztes JavaScript entfernen und Skripte minimieren" },
          { title: "Bilder mit loading=\"lazy\" versehen – alles außer dem Hero-Bild" },
        ],
        closingNote: "Einmalige Maßnahme. Mobile Ladezeit danach unter 3 Sekunden realistisch.",
      },
    },
  },
  M11: {
    sections: {
      links: {
        score: "D",
        heading: "Gute Ansätze – aber Spam zieht die Domain runter",
        text:
          "Du hast bereits wertvolle Links von starken Quellen. Das Problem: Ein erheblicher Teil der Backlinks kommt von Spam-Seiten die deiner Domain aktiv schaden. Das neutralisiert die positiven Signale und bremst dein Ranking-Potenzial.",
        domainStrength: 13,
        pageStrength: 8,
        totalBacklinks: 202,
        referringDomains: 35,
        nofollow: 36,
        dofollow: 166,
        subnets: 19,
        ips: 19,
        govBacklinks: 0,
        findings: [],
        costText:
          "Die guten Links – HWK, Gelbe Seiten, ProvenExpert, dein-waf.de – sind echte Vertrauenssignale die Google positiv wertet. Aber Spam-Links von Seiten wie rankvance.info, rankongoogle.agency oder rankpilot.shop ziehen die Domain-Autorität aktiv runter. Google erkennt diese Muster und kann die gesamte Domain als weniger vertrauenswürdig einstufen. Das ist kein akutes Problem – aber ein langfristiges Risiko das angegangen werden sollte.",
        actions: [
          {
            title: "Spam-Links über Google Disavow Tool entwerten",
            detail:
              "Die Links von rankvance.info, rankongoogle.agency, rankpilot.shop und ähnlichen Seiten sollten in einer Disavow-Datei gemeldet werden",
          },
          {
            title: "Bestehende starke Links weiter ausbauen",
            detail: "ProvenExpert-Profil vollständig befüllen, HWK-Eintrag optimieren",
          },
          {
            title: "Neue qualitative Links gezielt aufbauen",
            detail: "Stadtportale im Kreis Warendorf, lokale Gewerbeverbände, Kooperationspartner",
          },
          {
            title: "Bestehende Kunden bitten die Website zu verlinken oder zu erwähnen",
          },
        ],
        closingNote:
          "Disavow ist einmalig in einem halben Tag erledigt. Link-Building ist langfristig – wer jetzt anfängt hat in 6 Monaten einen echten Vorsprung gegenüber Wettbewerbern die es nicht tun.",
      },
    },
  },
  M12: {
    phasenplan: {
      intro: "Nicht alles auf einmal – die richtige Reihenfolge entscheidet",
      phase1: {
        title: "Phase 1 – Sofortmaßnahmen (Woche 1-2)",
        entries: [
          { measure: "Alle Bilder auf WebP komprimieren", impact: "Mobile Ladezeit von 13s auf unter 3s" },
          { measure: "Identity-Schema & LocalBusiness-Schema implementieren", impact: "Google ordnet dich eindeutig ein" },
          { measure: "Google Reviews direkt auf Startseite einbinden", impact: "Sofortiger Vertrauensaufbau beim Besucher" },
          { measure: "Title-Tag auf 60 Zeichen kürzen", impact: "Vollständige Anzeige in Suchergebnissen" },
          { measure: "Spam-Links via Google Disavow entwerten", impact: "Domain-Autorität bereinigen" },
          { measure: "Ungenutztes JavaScript entfernen", impact: "Performance-Verbesserung Desktop" },
        ],
      },
      phase2: {
        title: "Phase 2 – Conversion & Sichtbarkeit (Monat 1)",
        entries: [
          { measure: "Hero-Section mit Painpoint-Botschaft ersetzen", impact: "Mehr Besucher werden zu Anfragen" },
          { measure: "CTA konkretisieren – „Jetzt Termin vereinbaren\"", impact: "Höhere Verbindlichkeit beim Klick" },
          { measure: "Prozessbeschreibung auf Startseite holen", impact: "Vertrauen direkt auf der Startseite" },
          { measure: "HWK-Mitgliedschaft prominent platzieren", impact: "Differenzierung gegenüber Wettbewerb" },
          { measure: "FAQ seitenspezifisch gestalten", impact: "Besseres Ranking + mehr Vertrauen" },
          { measure: "Keywords in H2/H3 einbauen", impact: "Bessere Einordnung durch Google" },
          { measure: "Alt-Texte für alle Bilder ergänzen", impact: "SEO + Barrierefreiheit" },
          { measure: "Interne Verlinkung aufbauen", impact: "Stärkt alle Unterseiten gleichzeitig" },
        ],
      },
      phase3: {
        title: "Phase 3 – Reichweite ausbauen (Monat 2-3)",
        entries: [
          { measure: "Stadtseiten für Münster, Telgte, Sassenberg ausbauen", impact: "Rankings außerhalb Warendorf" },
          { measure: "Dienstleistungsseiten inhaltlich ausbauen", impact: "Rankingfähiger Content pro Service" },
          { measure: "Blog-Artikel informativ umschreiben", impact: "Organischer Traffic durch Ratgeber-Content" },
          { measure: "Qualitative Backlinks aufbauen", impact: "Domain-Autorität nachhaltig stärken" },
          { measure: "Google Business Profil vollständig befüllen", impact: "Stärkere lokale Präsenz in Maps" },
          { measure: "Open Graph Tags ergänzen", impact: "Professionelles Social Sharing" },
        ],
      },
      afterPhase1: "Nach Phase 1: Technische Basis sauber, Mobile lädt unter 3 Sekunden, Google ordnet dich eindeutig ein.",
      afterPhase2: "Nach Phase 2: Startseite führt Besucher klar zum nächsten Schritt, Anfragerate steigt, erste Ranking-Verbesserungen sichtbar.",
      afterPhase3: "Nach Phase 3: Erste Rankings für Umland-Keywords, messbar mehr organischer Traffic, Domain-Autorität wächst kontinuierlich.",
    },
  },
  // M13: noch nicht erfasst. Pro Milestone hier ergaenzen wenn der Builder gebaut wird.
};

const ALL_MILESTONES: Milestone[] = ["M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12", "M13"];

function deepMerge(dst: Record<string, unknown>, src: Record<string, unknown>): void {
  for (const [k, v] of Object.entries(src)) {
    const existing = dst[k];
    if (
      v !== null &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      existing !== null &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      deepMerge(existing as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      dst[k] = v;
    }
  }
}

function main() {
  const [, , auditIdRaw, milestoneRaw] = process.argv;
  if (!auditIdRaw) {
    console.error("Usage: tsx scripts/seed-vasileios-audit.ts <auditId> [milestone]");
    console.error("       milestone: M5|M6|M7|M8|M9|M10|M11|M12|M13|all (default: all)");
    process.exit(1);
  }
  const auditId = auditIdRaw;
  const milestoneArg = (milestoneRaw ?? "all") as Milestone | "all";
  if (milestoneArg !== "all" && !ALL_MILESTONES.includes(milestoneArg)) {
    console.error(`milestone muss eines von ${ALL_MILESTONES.join("|")}|all sein, war: ${milestoneArg}`);
    process.exit(1);
  }

  const cwd = process.cwd();
  const basePath = resolve(cwd, "data/audits/m2-smoke.json");
  if (!existsSync(basePath)) {
    console.error(`FEHLT: ${basePath}`);
    process.exit(1);
  }
  const base = JSON.parse(readFileSync(basePath, "utf-8")) as Record<string, unknown>;
  const audit = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  audit.id = auditId;
  audit.url = "https://www.waschbaer-service.de";
  audit.projectName = "Waschbär Service";

  const milestones: Milestone[] = milestoneArg === "all" ? ALL_MILESTONES : [milestoneArg];
  const applied: string[] = [];
  const skipped: string[] = [];
  for (const m of milestones) {
    const patch = DATA[m];
    if (!patch) {
      skipped.push(m);
      continue;
    }
    deepMerge(audit, patch);
    applied.push(m);
  }

  const outPath = resolve(cwd, `data/audits/${auditId}.json`);
  writeFileSync(outPath, JSON.stringify(audit, null, 2), "utf-8");
  console.log(`Wrote ${outPath}`);
  console.log(`Applied milestones: ${applied.length ? applied.join(", ") : "(none)"}`);
  if (skipped.length) console.log(`Skipped (no data yet): ${skipped.join(", ")}`);
}

main();
