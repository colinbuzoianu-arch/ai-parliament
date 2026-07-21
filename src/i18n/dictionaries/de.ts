import type { Dictionary } from "./en";

export const de = {
  common: {
    backToHome: "← zurück zum KI-Parlament",
  },
  explainer: {
    title: "KI-Parlament",
    tagline: "Neun Denktraditionen. Drei Phasen. Kein erzwungener Konsens.",
    intro:
      "Dies ist eine experimentelle Beratungs-Engine von World Legal Service. Es ist keine " +
      "einzelne KI, die Ihnen eine Antwort gibt — es sind neun unabhängige Agenten, von denen " +
      "jeder strikt aus der Lehre eines historischen Denkers argumentiert und eine reale " +
      "politische Frage in drei sichtbaren Phasen durcharbeitet. Nichts wird geglättet: Sie " +
      "sehen, wo Übereinstimmung besteht, wo nicht, und warum.",
    whyHeading: "Warum diese neun Denker",
    whyIntro:
      "Jeder Agent ist an einen Denker gebunden, der aus einer Position realer materieller " +
      "Kosten heraus argumentierte — Armut, Gefängnis, Exil oder der Verzicht auf Einkommen " +
      "und Komfort — um seines Denkens willen. Das ist keine Sentimentalität; es ist ein " +
      "Filter gegen Ideen, die davon geprägt sind, was bequem oder gewinnbringend zu " +
      "vertreten war.",
    thinkers: {
      spinoza: "argumentiert aus kausaler Notwendigkeit, nicht aus Gefühl oder Tradition",
      weil: "Pflicht vor Rechten; benennt, wer die Kosten trägt, nicht nur, wer den Anspruch hält",
      solzhenitsyn: "lehnt jede Politik ab, die verlangt, wer die Kosten trägt, zu opfern oder zu verschweigen",
      ibnrushd: "verlangt, dass ein Vorschlag strenger, autoritätsunabhängiger Argumentation standhält",
      gandhi: "beurteilt den Prozess, nicht nur das Ziel — ein gutes Ergebnis durch Zwang ist ein Versagen",
      boethius: "trennt das, was den Mächtigen zusteht, von dem, was tatsächlich richtig ist",
      kropotkin: "fragt, ob eine kleinere, freiwillige Lösung anstelle von Machtzentralisierung funktionieren könnte",
      gramsci: 'fragt, wessen Interessen als "neutral" oder "gesunder Menschenverstand" bezeichnet werden',
      diogenes: "erkennt einem Vorschlag keine Legitimität zu, nur weil er autoritär oder konventionell ist",
    },
    howHeading: "Wie eine Beratung abläuft",
    phases: [
      {
        name: "Unabhängiges Argumentieren",
        text:
          "Jeder Agent erhält den Fall allein, ohne die Positionen der anderen zu kennen, und " +
          "erstellt vier festgelegte Stufen: Einordnung, doktrinäre Analyse, eine Prognose " +
          "(geschrieben und fixiert vor dem Urteil) und das Urteil selbst.",
      },
      {
        name: "Kreuzverhör",
        text:
          "Die Agenten sehen die Positionen der anderen und können sie revidieren — müssen " +
          "aber klar angeben, ob eine Änderung durch Argumente oder durch sozialen " +
          "Konvergenzdruck bedingt ist.",
      },
      {
        name: "Gemeinsames Urteil",
        text:
          "Ein separater Synthesizer ohne eigene Doktrin erstellt eine Mehrheitsposition und " +
          "listet jede abweichende Meinung namentlich auf. Konsens wird niemals erzwungen.",
      },
    ],
    whatYouCanDoLabel: "Was Sie hier tun können:",
    whatYouCanDo:
      "Beispiel-Fälle durchsehen oder eine eigene politische oder projektbezogene Frage " +
      "einreichen und eine Live-Beratung entstehen sehen.",
    disclaimerLabel: "Was dies nicht ist",
    disclaimerBody:
      "Rechts- oder Politikberatung. Dies ist ein experimentelles Forschungs-Sandbox im " +
      "Rahmen der WLS-Arbeit zu KI-Governance und Rechenschaftspflicht. Urteile stellen ein " +
      "Sprachmodell dar, das als historische Position argumentiert, nicht die tatsächlichen " +
      "Ansichten der Denker, und ersetzen keine institutionelle Prüfung. Eingereichte Fälle " +
      "werden nirgends öffentlich veröffentlicht oder aufgelistet, aber dies ist ein " +
      "Forschungs-Sandbox und kein sicherer Speicher — geben Sie keine vertraulichen " +
      "Informationen ein.",
  },
  footer: {
    initiative: "Eine Initiative von World Legal Service",
  },
  resultTabs: {
    tabIndependent: "Unabhängiges Argumentieren",
    tabCrossExamination: "Kreuzverhör",
    tabJointVerdict: "Gemeinsames Urteil",
    howToRead:
      "So ist das zu lesen: Phase 1 ist vollständig unabhängig — jeder Agent argumentiert für " +
      "sich, ohne Einblick in die anderen. Phase 2 und Phase 3 laufen live für die für diesen " +
      "Durchlauf ausgewählten Agenten.",
    majorityPosition: "Mehrheitsposition",
    supportedBy: "Unterstützt von:",
    disagreementMap: "Uneinigkeitskarte",
    fullSynthesis: "Vollständige Synthese / abweichende Meinungen",
  },
  disagreementMap: {
    doctrine: "Doktrin",
    finalVerdict: "Endgültiges Urteil",
    reasoningRoute: "Argumentationsweg",
    sameConclusion: "⚠ Gleiche Schlussfolgerung, unterschiedliche Begründung:",
  },
  agentCard: {
    framing: "Einordnung",
    doctrinalAnalysis: "Doktrinäre Analyse",
    forecast: "Prognose",
    verdict: "Urteil",
    changeJustification: "Begründung der Änderung",
    objective: "Zielvorgabe",
    projectedOutcome: "Erwartetes Ergebnis",
    confidence: "Konfidenz",
    revised: "revidiert",
    held: "beibehalten",
    approve: "Zustimmung",
    reject: "Ablehnung",
  },
  page: {
    liveNote: "Dies führt sofort eine Live-Beratung durch. Um die Sandbox erschwinglich zu halten, wählen Sie bis zu {max} Agenten für einen neuen Fall.",
    tryAnExample: "Beispiel ausprobieren",
    titleLabel: "Titel",
    titlePlaceholder: "z. B. Umwidmung einer Überschwemmungsfläche für Wohnbebauung",
    briefLabel: "Fallbeschreibung",
    briefPlaceholder: "Beschreiben Sie die Politik oder das Projekt, über das die Agenten beraten sollen...",
    agentsLabel: "Agenten",
    submitAndRun: "Einreichen und starten",
    runningDeliberation: "Beratung läuft...",
    submitAnotherCase: "← einen weiteren Fall einreichen",
    choosePanel: "Gremium auswählen",
    runDeliberation: "Beratung starten",
    runningLiveDeliberation: "Live-Beratung läuft...",
    phase1Note:
      "Unabhängiges Argumentieren (Phase 1) ist für jeden Agenten in diesem Fall vorab " +
      "berechnet. Kreuzverhör und das gemeinsame Urteil laufen live, für Ihr gewähltes " +
      "Gremium, gerade jetzt.",
    phaseStatus: {
      1: "Die Agenten prüfen den Fall unabhängig voneinander…",
      2: "Gegenseitige Befragung der Positionen…",
      3: "Ein gemeinsames Urteil wird erreicht…",
    },
    phase2HintRerun: "Position nach der Live-Kreuzverhör-Phase.",
    errors: {
      phase1Failed: "Phase 1 fehlgeschlagen",
      phase2Failed: "Phase 2 fehlgeschlagen",
      phase3Failed: "Phase 3 fehlgeschlagen",
      submissionFailed: "Einreichung fehlgeschlagen",
      somethingWrong: "Etwas ist schiefgelaufen",
    },
  },
  permalink: {
    noResults: "Dieser Fall wurde noch nicht beraten — keine Ergebnisse verfügbar.",
    phase2Hint: "Zuletzt erfasste Position nach dem Kreuzverhör.",
  },
} satisfies Dictionary;
