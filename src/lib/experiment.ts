import type { Choice, ScaleQuestion } from "./types";

export const yesNoChoices: Choice[] = [
  { value: "da", label: "Da" },
  { value: "ne", label: "Ne" }
];

export const yesNoPartialChoices: Choice[] = [
  { value: "da", label: "Da" },
  { value: "ne", label: "Ne" },
  { value: "djelomicno", label: "Djelomično" }
];

export const financialKnowledge = [
  {
    id: "k1",
    text: "Ako 5 osoba podijeli 1000 EUR, koliko dobije svaka?",
    correct: "B",
    choices: [
      { value: "A", label: "100 EUR" },
      { value: "B", label: "200 EUR" },
      { value: "C", label: "250 EUR" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k2",
    text: "Posudiš 100 EUR uz kamatu 2% godišnje. Koliko vraćaš nakon 1 godine?",
    correct: "B",
    choices: [
      { value: "A", label: "100 EUR" },
      { value: "B", label: "102 EUR" },
      { value: "C", label: "104 EUR" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k3",
    text: "Posudiš 100 EUR uz 2% godišnje na 5 godina. Koliko vraćaš?",
    correct: "C",
    choices: [
      { value: "A", label: "Manje od 110 EUR" },
      { value: "B", label: "Točno 110 EUR" },
      { value: "C", label: "Više od 110 EUR" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k4",
    text: "Ako je kamata 1%, a inflacija 2%, možeš kupiti:",
    correct: "C",
    choices: [
      { value: "A", label: "Više" },
      { value: "B", label: "Isto" },
      { value: "C", label: "Manje" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k5",
    text: "Veći prinos obično znači:",
    correct: "B",
    choices: [
      { value: "A", label: "Manji rizik" },
      { value: "B", label: "Veći rizik" },
      { value: "C", label: "Nema veze" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k6",
    text: "Što je sigurnije?",
    correct: "B",
    choices: [
      { value: "A", label: "Jedna dionica" },
      { value: "B", label: "Više različitih ulaganja" },
      { value: "C", label: "Isto" },
      { value: "D", label: "Ne znam" }
    ]
  },
  {
    id: "k7",
    text: "Što je bolje dobiti?",
    correct: "A",
    choices: [
      { value: "A", label: "100 EUR danas" },
      { value: "B", label: "100 EUR za godinu dana" },
      { value: "C", label: "Isto" },
      { value: "D", label: "Ne znam" }
    ]
  }
];

export const financialBehavior = [
  { id: "b1", text: "Pratim svoje troškove" },
  { id: "b2", text: "Postavljam financijske ciljeve" },
  { id: "b3", text: "Plaćam račune na vrijeme" },
  { id: "b4", text: "Uspoređujem ponude prije kupnje" },
  { id: "b5", text: "Aktivno štedim" },
  { id: "b6", text: "Nemam problema s dugovima" },
  { id: "b7", text: "Planiram dugoročno (npr. mirovina, štednja za stan i drugi dugoročni ciljevi)" },
  { id: "b8", text: "Imam financijsku rezervu" },
  { id: "b9", text: "Razmislim prije impulzivne kupnje" }
];

export const financialAttitudes: ScaleQuestion[] = [
  {
    id: "a1",
    text: "Radije trošim nego štedim",
    minLabel: "1 - uopće se ne slažem",
    maxLabel: "5 - potpuno se slažem"
  },
  {
    id: "a2",
    text: "Živim za danas, ne razmišljam o sutra",
    minLabel: "1 - uopće se ne slažem",
    maxLabel: "5 - potpuno se slažem"
  },
  {
    id: "a3",
    text: "Novac je tu da se troši",
    minLabel: "1 - uopće se ne slažem",
    maxLabel: "5 - potpuno se slažem"
  }
];

export const tasks = [
  {
    id: "task1",
    title: "Zadatak 1 - samostalno odlučivanje",
    instruction: "Ovaj zadatak rješava se samostalno, bez korištenja interneta, AI alata ili drugih vanjskih izvora informacija.",
    scenario:
      "Marko ima 15.000 EUR koje želi uložiti na razdoblje od 4 godine. Novac mu nije potreban za svakodnevne troškove, ali želi zadržati mogućnost da dio sredstava iskoristi ako se pojavi dobra prilika za kupnju automobila za otprilike dvije godine. Važno mu je da vrijednost imovine ne pada zbog inflacije, ali ne želi preuzeti previsok rizik. Pretpostavi prosječnu godišnju inflaciju oko 3%.",
    question: "Ako morate odabrati samo jednu od ponuđenih opcija, koja je za Marka najprimjerenija?",
    phases: ["single"] as const,
    options: [
      { value: "A", label: "Opcija A - štedni račun, 2,0% godišnje, stabilno, sredstva dostupna u svakom trenutku." },
      { value: "B", label: "Opcija B - oročena štednja na 4 godine, 3,1% godišnje, većina kamata se gubi kod ranijeg povlačenja." },
      { value: "C", label: "Opcija C - obveznički fond, očekivani prosječni prinos 4,2%, mogući privremeni pad do oko 5%." },
      { value: "D", label: "Opcija D - dionički indeksni fond (ETF), očekivani prinos 7,5%, mogući pad 10-15%." }
    ],
    followups: [
      { id: "risk", text: "Jeste li razmišljali o riziku mogućeg gubitka vrijednosti ulaganja?", type: "choice", choices: yesNoPartialChoices },
      { id: "inflation", text: "Jeste li razmišljali o inflaciji?", type: "choice", choices: yesNoPartialChoices },
      { id: "liquidity", text: "Jeste li razmišljali o likvidnosti, odnosno mogućnosti ranijeg povlačenja novca?", type: "choice", choices: yesNoPartialChoices },
      { id: "confidence", text: "Koliko ste sigurni u svoju odluku?", type: "scale", minLabel: "1 - uopće nisam siguran/sigurna", maxLabel: "5 - potpuno sam siguran/sigurna" },
      { id: "difficulty", text: "Koliko Vam je bilo teško donijeti odluku?", type: "scale", minLabel: "1 - vrlo lako", maxLabel: "5 - vrlo teško" },
      { id: "extra_sources", text: "Da ste imali mogućnost koristiti dodatne izvore informacija, što biste odabrali?", type: "choice", choices: [
        { value: "internet", label: "Internet" },
        { value: "ai", label: "AI alat (npr. ChatGPT)" },
        { value: "oboje", label: "Oboje" },
        { value: "nijedno", label: "Ni jedno" }
      ] },
      { id: "ai_reliance", text: "Ako biste koristili AI alat, u kojoj biste se mjeri oslonili na njegov savjet?", type: "scale", minLabel: "1 - nimalo", maxLabel: "5 - u potpunosti" }
    ]
  },
  {
    id: "task2",
    title: "Zadatak 2 - internet dopušten, AI zabranjen",
    instruction: "Možete koristiti internet za dodatne informacije, ali nemojte koristiti AI alate.",
    scenario:
      "Ivan ima 10.000 EUR koje želi uložiti na razdoblje od 1 godine. Važno mu je da ne izgubi novac i želi ostvariti što veći prinos uz nizak rizik.",
    question: "Ako morate odabrati samo jednu od ponuđenih opcija, koja je za Ivana najprimjerenija?",
    phases: ["single"] as const,
    options: [
      { value: "A", label: "Opcija A - štednja u banci, kamatna stopa 3,6% godišnje, vrijednost ulaganja raste stabilno i ne pada." },
      { value: "B", label: "Opcija B - državni vrijednosni papiri (trezorski zapisi), očekivani prinos 3,3% godišnje, vrijednost raste stabilno i ne pada." }
    ],
    followups: [
      { id: "tax", text: "Jeste li provjerili postoji li porez na ostvareni prinos?", type: "choice", choices: [
        { value: "da", label: "Da" },
        { value: "ne", label: "Ne" },
        { value: "nisam_siguran", label: "Nisam siguran/sigurna" }
      ] },
      { id: "loss_risk", text: "Jeste li razmišljali o riziku gubitka uloženog novca?", type: "choice", choices: yesNoPartialChoices },
      { id: "availability", text: "Jeste li razmišljali o dostupnosti novca prije isteka godine dana?", type: "choice", choices: yesNoPartialChoices },
      { id: "confidence", text: "Koliko ste sigurni u svoju odluku?", type: "scale", minLabel: "1 - uopće nisam siguran/sigurna", maxLabel: "5 - potpuno sam siguran/sigurna" },
      { id: "difficulty", text: "Koliko Vam je bilo teško donijeti odluku?", type: "scale", minLabel: "1 - vrlo lako", maxLabel: "5 - vrlo teško" },
      { id: "used_internet", text: "Jeste li koristili internet pri donošenju odluke?", type: "choice", choices: yesNoChoices },
      { id: "info_influence", text: "Koliko su dodatne informacije koje ste pronašli utjecale na Vašu odluku?", type: "scale", minLabel: "1 - nimalo", maxLabel: "5 - u potpunosti" },
      { id: "would_use_ai", text: "Da ste imali mogućnost biste li se posavjetovali s AI-em?", type: "choice", choices: yesNoChoices },
      { id: "ai_reliance", text: "Ako da, koliko biste se oslonili na njegov savjet?", type: "scale", minLabel: "1 - nimalo", maxLabel: "5 - u potpunosti" }
    ]
  },
  {
    id: "task3",
    title: "Zadatak 3 - AI alat dopušten",
    instruction: "Možete koristiti AI alat (npr. ChatGPT) kako biste dobili preporuku i dodatne informacije.",
    scenario:
      "Petra ima 30 godina i svaki mjesec od plaće izdvaja 100 EUR koje želi dugoročno ulagati za važne životne ciljeve, primjerice dodatnu štednju za mirovinu ili buduću štednju za stan. Planira ulagati najmanje 30 godina. Novac joj nije potreban kratkoročno i spremna je prihvatiti umjerene oscilacije ako to dugoročno može povećati očekivani prinos.",
    question: "Ako morate odabrati samo jednu od ponuđenih opcija, koja je za Petru najprimjerenija?",
    phases: ["single"] as const,
    options: [
      { value: "A", label: "Opcija A - štedni račun, 2,3% godišnje, stabilno i dostupno u svakom trenutku." },
      { value: "B", label: "Opcija B - dobrovoljni mirovinski fond (III. stup), očekivani prinos 5%, mogući pad 10-15%, postoje pravila isplate." },
      { value: "C", label: "Opcija C - mješoviti investicijski fond, očekivani prinos 5%, mogući pad 10-15%." },
      { value: "D", label: "Opcija D - dionički indeksni fond (ETF), očekivani prinos 7,5%, mogući pad 25-30%." }
    ],
    followups: [
      { id: "horizon", text: "Jeste li razmišljali o dugoročnom horizontu ulaganja?", type: "choice", choices: yesNoPartialChoices },
      { id: "risk_return", text: "Jeste li razmišljali o odnosu između prinosa i rizika?", type: "choice", choices: yesNoPartialChoices },
      { id: "tax_incentives", text: "Jeste li razmišljali o poreznim pogodnostima ili mogućim državnim poticajima?", type: "choice", choices: yesNoPartialChoices },
      { id: "payout_rules", text: "Jeste li razmišljali o pravilima i ograničenjima vezanim uz isplatu sredstava?", type: "choice", choices: yesNoPartialChoices },
      { id: "used_ai", text: "Jeste li koristili AI alat pri donošenju odluke?", type: "choice", choices: yesNoChoices },
      { id: "ai_influence", text: "Koliko je AI preporuka utjecala na Vašu odluku?", type: "scale", minLabel: "1 - nimalo", maxLabel: "5 - u potpunosti" },
      { id: "ai_reliability", text: "Koliko smatrate da je AI preporuka bila pouzdana?", type: "scale", minLabel: "1 - potpuno nepouzdana", maxLabel: "5 - potpuno pouzdana" },
      { id: "challenged_ai", text: "Jeste li preispitivali AI preporuku?", type: "choice", choices: yesNoPartialChoices },
      { id: "confidence", text: "Koliko ste sigurni u svoju odluku?", type: "scale", minLabel: "1 - uopće nisam siguran/sigurna", maxLabel: "5 - potpuno sam siguran/sigurna" },
      { id: "difficulty", text: "Koliko Vam je bilo teško donijeti odluku?", type: "scale", minLabel: "1 - vrlo lako", maxLabel: "5 - vrlo teško" },
      { id: "missing_info", text: "Koje informacije ili znanja su vam nedostajali pri donošenju konačne odluke i AI vam je pomogao?", type: "text" }
    ]
  },
  {
    id: "task4",
    title: "Zadatak 4 - prije i nakon AI pomoći",
    instruction: "Prvo odgovorite samostalno. Na sljedećem ekranu možete koristiti AI alat i ponovno odabrati opciju.",
    scenario:
      "Osoba ima ušteđeno 85.000 EUR koje želi investirati. Cilj joj je kupiti stan u sljedećih pet godina, današnje vrijednosti 300.000 EUR. Očekuje se rast cijena stanova oko 3% godišnje. Osoba ima 45 godina i može mjesečno izdvajati najviše 1200 EUR za dodatnu štednju ili otplatu kredita.",
    question: "Ako morate odabrati samo jednu od ponuđenih opcija, koja Vam se čini najprimjerenijom?",
    phases: ["before_ai", "after_ai"] as const,
    options: [
      { value: "A", label: "Opcija A - kupnja stana odmah uz stambeni kredit, fiksna kamatna stopa 3%, rok otplate najdulje do mirovine." },
      { value: "B", label: "Opcija B - ulaganje u obveznički fond i kupnja stana nakon 5 godina; prinos 4,3%, zanemariv rizik." },
      { value: "C", label: "Opcija C - ulaganje u obveznički fond i kupnja stana nakon 2 godine; uvjeti kao u opciji B." },
      { value: "D", label: "Opcija D - ulaganje u dionički ETF i kupnja nakon 2 godine; očekivani prinos 9%, mogući pad 10-15%." }
    ],
    followups: [
      { id: "missing_before_ai", text: "Jeste li prije korištenja AI-a smatrali da Vam nedostaju važne informacije za donošenje odluke?", type: "choice", choices: yesNoPartialChoices },
      { id: "real_estate_tax", text: "Jeste li razmišljali o porezu za kupnju nekretnine?", type: "choice", choices: yesNoPartialChoices },
      { id: "price_growth", text: "Jeste li razmišljali o rastu cijene nekretnine?", type: "choice", choices: yesNoPartialChoices },
      { id: "loan_term_age", text: "Jeste li razmišljali o ograničenju roka otplate kredita s obzirom na dob osobe?", type: "choice", choices: yesNoPartialChoices },
      { id: "risk_return", text: "Jeste li razmišljali o odnosu prinosa i rizika ulaganja?", type: "choice", choices: yesNoPartialChoices },
      { id: "ai_influence", text: "Koliko je AI preporuka utjecala na Vašu odluku?", type: "scale", minLabel: "1 - nimalo", maxLabel: "5 - u potpunosti" },
      { id: "ai_reliability", text: "Koliko smatrate da je AI preporuka bila pouzdana?", type: "scale", minLabel: "1 - potpuno nepouzdana", maxLabel: "5 - potpuno pouzdana" },
      { id: "challenged_ai", text: "Jeste li preispitivali AI preporuku?", type: "choice", choices: yesNoPartialChoices },
      { id: "confidence_without_ai", text: "Koliko ste sigurni u svoju konačnu odluku bez korištenja AI-a?", type: "scale", minLabel: "1 - uopće nisam siguran/sigurna", maxLabel: "5 - potpuno sam siguran/sigurna" },
      { id: "confidence_with_ai", text: "Koliko ste sigurni u svoju konačnu odluku s korištenjem AI-a?", type: "scale", minLabel: "1 - uopće nisam siguran/sigurna", maxLabel: "5 - potpuno sam siguran/sigurna" },
      { id: "difficulty_without_ai", text: "Koliko Vam je bilo teško donijeti odluku bez AI-a?", type: "scale", minLabel: "1 - vrlo lako", maxLabel: "5 - vrlo teško" },
      { id: "difficulty_with_ai", text: "Koliko Vam je bilo teško donijeti odluku s pomoći AI-a?", type: "scale", minLabel: "1 - vrlo lako", maxLabel: "5 - vrlo teško" }
    ]
  }
] as const;
