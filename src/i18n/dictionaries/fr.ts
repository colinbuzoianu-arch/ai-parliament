import type { Dictionary } from "./en";

export const fr = {
  common: {
    backToHome: "← retour au Parlement IA",
  },
  explainer: {
    title: "Parlement IA",
    tagline: "Neuf traditions de pensée. Trois phases. Aucun consensus forcé.",
    intro:
      "Ceci est un moteur de délibération expérimental conçu par World Legal Service. Ce " +
      "n'est pas une seule IA qui vous donne une réponse — ce sont neuf agents indépendants, " +
      "chacun raisonnant strictement selon la doctrine d'un penseur historique, traitant une " +
      "véritable question politique en trois étapes visibles. Rien n'est lissé : vous voyez " +
      "où ils sont d'accord, où ils ne le sont pas, et pourquoi.",
    whyHeading: "Pourquoi ces neuf penseurs",
    whyIntro:
      "Chaque agent est lié à un penseur ayant raisonné depuis une position de coût matériel " +
      "réel — pauvreté, emprisonnement, exil ou renoncement au revenu et au confort — pour " +
      "l'amour de sa pensée. Ce n'est pas du sentimentalisme ; c'est un filtre contre les " +
      "idées façonnées par ce qui était commode ou rentable à soutenir.",
    thinkers: {
      spinoza: "raisonne à partir de la nécessité causale, non du sentiment ou de la tradition",
      weil: "l'obligation avant les droits ; nomme qui supporte le coût, pas seulement qui détient la revendication",
      solzhenitsyn: "refuse toute politique exigeant de sacrifier ou de mentir sur qui en supporte le coût",
      ibnrushd: "exige qu'une proposition résiste à un raisonnement rigoureux, indépendant de toute autorité",
      gandhi: "juge le processus, pas seulement le but — un bon résultat obtenu par la coercition est un échec",
      boethius: "sépare ce qui est dû aux puissants de ce qui est réellement juste",
      kropotkin: "demande si un arrangement plus petit et volontaire pourrait fonctionner au lieu de centraliser le pouvoir",
      gramsci: 'demande à qui profite le fait qu\'une chose soit qualifiée de "neutre" ou de "bon sens"',
      diogenes: "n'accorde aucune légitimité à une proposition simplement parce qu'elle est autoritaire ou conventionnelle",
    },
    howHeading: "Comment se déroule une délibération",
    phases: [
      {
        name: "Raisonnement indépendant",
        text:
          "Chaque agent reçoit le cas seul, sans connaître les positions des autres, et " +
          "produit quatre étapes verrouillées : cadrage, analyse doctrinale, une prévision " +
          "(rédigée et verrouillée avant le verdict), et le verdict lui-même.",
      },
      {
        name: "Contre-examen",
        text:
          "Les agents voient les positions des autres et peuvent les réviser — mais doivent " +
          "indiquer clairement si un changement est motivé par l'argumentation ou par une " +
          "pression sociale vers la convergence.",
      },
      {
        name: "Verdict commun",
        text:
          "Un synthétiseur distinct, sans doctrine propre, produit une position majoritaire " +
          "et énumère chaque dissidence nommément. Le consensus n'est jamais forcé.",
      },
    ],
    whatYouCanDoLabel: "Ce que vous pouvez faire ici :",
    whatYouCanDo:
      "soumettre votre propre question de politique publique ou de projet et observer une " +
      "délibération se former en direct.",
    disclaimerLabel: "Ce que cet outil n'est pas",
    disclaimerBody:
      "Un conseil juridique ou politique. Il s'agit d'un sandbox de recherche expérimental " +
      "lié aux travaux de WLS sur la gouvernance et la responsabilité de l'IA. Les verdicts " +
      "représentent un modèle de langage raisonnant en tant que position historique, non les " +
      "opinions réelles des penseurs, et ne remplacent pas un examen institutionnel. Les cas " +
      "soumis ne sont publiés ni répertoriés nulle part publiquement, mais il s'agit d'un " +
      "sandbox de recherche, pas d'un stockage sécurisé — ne soumettez aucune information " +
      "confidentielle.",
  },
  footer: {
    initiative: "Une initiative de World Legal Service",
  },
  resultTabs: {
    tabIndependent: "Raisonnement indépendant",
    tabCrossExamination: "Contre-examen",
    tabJointVerdict: "Verdict commun",
    howToRead:
      "Comment lire ceci : la phase 1 est entièrement indépendante — chaque agent raisonne " +
      "seul, sans visibilité sur les autres. Les phases 2 et 3 se déroulent en direct pour " +
      "les agents sélectionnés pour cette exécution.",
    majorityPosition: "Position majoritaire",
    supportedBy: "Soutenue par :",
    disagreementMap: "Carte des désaccords",
    fullSynthesis: "Synthèse complète / dissidences",
  },
  disagreementMap: {
    doctrine: "Doctrine",
    finalVerdict: "Verdict final",
    reasoningRoute: "Cheminement du raisonnement",
    sameConclusion: "⚠ Même conclusion, raisonnement différent :",
  },
  agentCard: {
    framing: "Cadrage",
    doctrinalAnalysis: "Analyse doctrinale",
    forecast: "Prévision",
    verdict: "Verdict",
    changeJustification: "Justification du changement",
    objective: "Objectif",
    projectedOutcome: "Résultat prévu",
    confidence: "Confiance",
    revised: "révisé",
    held: "maintenu",
    approve: "Approuve",
    reject: "Rejette",
  },
  page: {
    liveNote: "Ceci lance une délibération en direct immédiatement. Pour que le sandbox reste abordable, choisissez jusqu'à {max} agents pour un nouveau cas.",
    tryAnExample: "Essayer un exemple",
    titleLabel: "Titre",
    titlePlaceholder: "p. ex. Reclassement d'une zone inondable pour le logement",
    briefLabel: "Description du cas",
    briefPlaceholder: "Décrivez la politique ou le projet sur lequel les agents doivent délibérer...",
    agentsLabel: "Agents",
    submitAndRun: "Soumettre et lancer",
    runningDeliberation: "Délibération en cours...",
    submitAnotherCase: "← soumettre un autre cas",
    choosePanel: "Choisir le panel",
    runDeliberation: "Lancer la délibération",
    runningLiveDeliberation: "Délibération en direct en cours...",
    phase1Note:
      "Le raisonnement indépendant (phase 1) est précalculé pour chaque agent de ce cas. Le " +
      "contre-examen et le verdict commun se déroulent en direct, pour le panel choisi, dès " +
      "maintenant.",
    phaseStatus: {
      1: "Les agents examinent le cas de manière indépendante…",
      2: "Contre-examen des positions respectives…",
      3: "Élaboration d'un verdict commun…",
    },
    phase2HintRerun: "Position finale après le contre-examen en direct.",
    errors: {
      phase1Failed: "Échec de la phase 1",
      phase2Failed: "Échec de la phase 2",
      phase3Failed: "Échec de la phase 3",
      submissionFailed: "Échec de la soumission",
      somethingWrong: "Une erreur s'est produite",
    },
  },
  permalink: {
    noResults: "Ce cas n'a pas encore été délibéré — aucun résultat à afficher.",
    phase2Hint: "Position finale enregistrée après le contre-examen.",
  },
} satisfies Dictionary;
