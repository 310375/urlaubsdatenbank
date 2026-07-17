"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type Tab = "start" | "liste" | "vorrat" | "belege" | "plan" | "analyse" | "mehr";
type Priority = "must" | "check" | "standard";
type ReceiptType = "Normaler Einkauf" | "Ergänzungskauf" | "Sonderkauf" | "Außendienst";
type StockStatus = "vorhanden" | "knapp" | "leer";

type ShoppingItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  priority: Priority;
  done: boolean;
  source: "manuell" | "standard" | "assistent" | "vorrat" | "wochenplan";
};

type StockItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  minimum: number;
  unit: string;
  standard: boolean;
};

type Receipt = {
  id: number;
  date: string;
  market: string;
  amount: number;
  type: ReceiptType;
  note: string;
  fileName?: string;
};

type Meal = {
  id: number;
  day: string;
  meal: string;
  servings: number;
};

type FamilyMember = {
  id: number;
  name: string;
  role: string;
};

type Vacation = {
  startDate: string;
  endDate: string;
  destination: string;
};

type WeatherData = {
  temperature: number;
  weatherCode: number;
  maxTemperature: number;
  precipitationProbability: number;
  updatedAt: string;
};

type AppData = {
  budget: number;
  shopping: ShoppingItem[];
  stock: StockItem[];
  receipts: Receipt[];
  meals: Meal[];
  family: FamilyMember[];
  vacation: Vacation;
};

const categories = [
  "Obst & Gemüse",
  "Molkerei",
  "Brot & Frühstück",
  "Fleisch & Wurst",
  "Getränke",
  "Snacks",
  "Vorrat",
  "Haushalt & Drogerie",
  "Verpflegung unterwegs"
];

const units = ["Stück", "Packung", "Flasche", "Kiste", "kg", "g", "l", "ml", "Glas"];

const seed: AppData = {
  budget: 700,
  shopping: [
    { id: 1, name: "Milch", category: "Molkerei", quantity: 2, unit: "Packung", priority: "standard", done: false, source: "standard" },
    { id: 2, name: "Griechischer Joghurt", category: "Molkerei", quantity: 1, unit: "Packung", priority: "standard", done: false, source: "standard" },
    { id: 3, name: "Nutella", category: "Brot & Frühstück", quantity: 1, unit: "Glas", priority: "standard", done: false, source: "standard" },
    { id: 4, name: "Äpfel", category: "Obst & Gemüse", quantity: 1, unit: "kg", priority: "check", done: false, source: "standard" },
    { id: 5, name: "Bananen", category: "Obst & Gemüse", quantity: 1, unit: "kg", priority: "check", done: false, source: "standard" },
    { id: 6, name: "Wasser", category: "Getränke", quantity: 2, unit: "Kiste", priority: "must", done: false, source: "standard" }
  ],
  stock: [
    { id: 1, name: "Nudeln", category: "Vorrat", quantity: 3, minimum: 2, unit: "Packung", standard: true },
    { id: 2, name: "Reis", category: "Vorrat", quantity: 2, minimum: 1, unit: "Packung", standard: true },
    { id: 3, name: "Sonnenblumenöl", category: "Vorrat", quantity: 1, minimum: 1, unit: "Flasche", standard: true },
    { id: 4, name: "Spülmaschinentabs", category: "Haushalt & Drogerie", quantity: 0, minimum: 1, unit: "Packung", standard: true },
    { id: 5, name: "Nutella", category: "Brot & Frühstück", quantity: 1, minimum: 1, unit: "Glas", standard: true },
    { id: 6, name: "Wasser", category: "Getränke", quantity: 1, minimum: 2, unit: "Kiste", standard: true }
  ],
  receipts: [
    { id: 1, date: "2026-07-03", market: "Lidl", amount: 134, type: "Normaler Einkauf", note: "Wocheneinkauf" },
    { id: 2, date: "2026-07-05", market: "Imker", amount: 12, type: "Normaler Einkauf", note: "2 Gläser Honig" },
    { id: 3, date: "2026-07-10", market: "Sonstige", amount: 228.72, type: "Normaler Einkauf", note: "Bereits erfasste Juli Einkäufe" },
    { id: 4, date: "2026-07-17", market: "Penny", amount: 117.16, type: "Normaler Einkauf", note: "Wocheneinkauf" },
    { id: 5, date: "2026-07-17", market: "Netto", amount: 16.71, type: "Ergänzungskauf", note: "Snacks und Grillkäse" }
  ],
  meals: [
    { id: 1, day: "Montag", meal: "Nudeln mit Tomatensoße", servings: 4 },
    { id: 2, day: "Samstag", meal: "Grillen", servings: 4 }
  ],
  family: [
    { id: 1, name: "Olaf", role: "Erwachsener" },
    { id: 2, name: "Anna", role: "Erwachsene" },
    { id: 3, name: "Matilda", role: "Kind" },
    { id: 4, name: "Jakob", role: "Kind" }
  ],
  vacation: {
    startDate: "",
    endDate: "",
    destination: ""
  }
};

const money = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);

const dateText = (value: string) =>
  value ? new Date(`${value}T12:00`).toLocaleDateString("de-DE") : "";

function stockStatus(item: StockItem): StockStatus {
  if (item.quantity <= 0) return "leer";
  if (item.quantity <= item.minimum) return "knapp";
  return "vorhanden";
}

function migrate(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return seed;
  const source = raw as Partial<AppData> & {
    items?: ShoppingItem[];
  };
  return {
    budget: typeof source.budget === "number" ? source.budget : seed.budget,
    shopping: Array.isArray(source.shopping)
      ? source.shopping
      : Array.isArray(source.items)
        ? source.items.map((item) => ({
            ...item,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? "Stück",
            source: item.source ?? "manuell"
          }))
        : seed.shopping,
    stock: Array.isArray(source.stock)
      ? source.stock.map((item) => ({
          ...item,
          quantity: item.quantity ?? (("status" in item && item.status === "leer") ? 0 : 1),
          minimum: item.minimum ?? 1,
          unit: item.unit ?? "Stück"
        }))
      : seed.stock,
    receipts: Array.isArray(source.receipts) ? source.receipts : seed.receipts,
    meals: Array.isArray(source.meals) ? source.meals : seed.meals,
    family: Array.isArray(source.family) ? source.family : seed.family,
    vacation: source.vacation && typeof source.vacation === "object"
      ? {
          startDate: source.vacation.startDate ?? "",
          endDate: source.vacation.endDate ?? "",
          destination: source.vacation.destination ?? ""
        }
      : seed.vacation
  };
}

const recipeRules: Record<string, Array<[string, string, number, string]>> = {
  grillen: [
    ["Grillkohle", "Haushalt & Drogerie", 1, "Packung"],
    ["Senf", "Vorrat", 1, "Flasche"],
    ["Ketchup", "Vorrat", 1, "Flasche"],
    ["Bratwurst", "Fleisch & Wurst", 2, "Packung"],
    ["Grillkäse", "Molkerei", 2, "Packung"],
    ["Baguette", "Brot & Frühstück", 2, "Stück"]
  ],
  burger: [
    ["Burgerbrötchen", "Brot & Frühstück", 1, "Packung"],
    ["Hackfleisch", "Fleisch & Wurst", 1, "kg"],
    ["Zwiebeln", "Obst & Gemüse", 3, "Stück"],
    ["Tomaten", "Obst & Gemüse", 4, "Stück"],
    ["Salat", "Obst & Gemüse", 1, "Stück"]
  ],
  frühstück: [
    ["Milch", "Molkerei", 2, "Packung"],
    ["Joghurt", "Molkerei", 1, "Packung"],
    ["Aufschnitt", "Fleisch & Wurst", 2, "Packung"],
    ["Toastbrot", "Brot & Frühstück", 1, "Packung"],
    ["Äpfel", "Obst & Gemüse", 1, "kg"]
  ],
  besuch: [
    ["Kaffee", "Vorrat", 1, "Packung"],
    ["Kekse", "Snacks", 2, "Packung"],
    ["Mineralwasser", "Getränke", 1, "Kiste"],
    ["Saft", "Getränke", 2, "Flasche"]
  ]
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("start");
  const [data, setData] = useState<AppData>(seed);
  const [loaded, setLoaded] = useState(false);
  const [dialog, setDialog] = useState<null | "shopping" | "stock" | "receipt" | "meal" | "family" | "vacation">(null);
  const [assistantText, setAssistantText] = useState("");
  const [assistantInfo, setAssistantInfo] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherStatus, setWeatherStatus] = useState("Standort noch nicht freigegeben.");

  useEffect(() => {
    const keys = ["einkaufsheld-v14", "einkaufsheld-v13", "einkaufsheld-v12", "einkaufsheld-v03"];
    const raw = keys.map((key) => localStorage.getItem(key)).find(Boolean);
    try {
      setData(migrate(JSON.parse(raw ?? "null")));
    } catch {
      setData(seed);
    }
    const storedWeather = localStorage.getItem("einkaufsheld-weather");
    if (storedWeather) {
      try { setWeather(JSON.parse(storedWeather)); } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem("einkaufsheld-v14", JSON.stringify(data));
  }, [data, loaded]);

  useEffect(() => {
    if (weather) localStorage.setItem("einkaufsheld-weather", JSON.stringify(weather));
  }, [weather]);

  const monthReceipts = useMemo(
    () => data.receipts.filter((item) => item.date.startsWith("2026-07")),
    [data.receipts]
  );
  const total = monthReceipts.reduce((sum, item) => sum + item.amount, 0);
  const remaining = data.budget - total;
  const budgetPercent = data.budget ? Math.min(100, Math.round((total / data.budget) * 100)) : 0;
  const sortedReceipts = [...data.receipts].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const openShopping = data.shopping.filter((item) => !item.done);
  const lowStock = data.stock.filter((item) => stockStatus(item) !== "vorhanden");
  const completed = data.shopping.filter((item) => item.done).length;
  const shoppingPercent = data.shopping.length ? Math.round((completed / data.shopping.length) * 100) : 0;
  const today = new Date();
  const vacationStart = data.vacation.startDate ? new Date(`${data.vacation.startDate}T00:00:00`) : null;
  const vacationEnd = data.vacation.endDate ? new Date(`${data.vacation.endDate}T23:59:59`) : null;
  const vacationActive = Boolean(vacationStart && vacationEnd && today >= vacationStart && today <= vacationEnd);
  const daysUntilVacation = vacationStart
    ? Math.ceil((vacationStart.getTime() - today.getTime()) / 86400000)
    : null;

  const markets = Object.entries(
    monthReceipts.reduce<Record<string, number>>((result, receipt) => {
      result[receipt.market] = (result[receipt.market] ?? 0) + receipt.amount;
      return result;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const maxMarket = Math.max(...markets.map(([, value]) => value), 1);

  function go(next: Tab) {
    setTab(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addShoppingItem(name: string, category: string, quantity: number, unit: string, priority: Priority, source: ShoppingItem["source"]) {
    const normalized = name.toLocaleLowerCase("de-DE");
    setData((current) => {
      const existing = current.shopping.find((item) => item.name.toLocaleLowerCase("de-DE") === normalized && !item.done);
      if (existing) {
        return {
          ...current,
          shopping: current.shopping.map((item) =>
            item.id === existing.id ? { ...item, quantity: Math.max(item.quantity, quantity), priority } : item
          )
        };
      }
      return {
        ...current,
        shopping: [...current.shopping, { id: Date.now() + Math.random(), name, category, quantity, unit, priority, done: false, source }]
      };
    });
  }

  function handleShopping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addShoppingItem(
      String(form.get("name") ?? "").trim(),
      String(form.get("category") ?? categories[0]),
      Number(form.get("quantity") ?? 1),
      String(form.get("unit") ?? "Stück"),
      String(form.get("priority") ?? "check") as Priority,
      "manuell"
    );
    setDialog(null);
  }

  function handleStock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      stock: [...current.stock, {
        id: Date.now(),
        name,
        category: String(form.get("category") ?? categories[0]),
        quantity: Number(form.get("quantity") ?? 0),
        minimum: Number(form.get("minimum") ?? 1),
        unit: String(form.get("unit") ?? "Stück"),
        standard: form.get("standard") === "on"
      }]
    }));
    setDialog(null);
  }

  function handleReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    setData((current) => ({
      ...current,
      receipts: [...current.receipts, {
        id: Date.now(),
        market: String(form.get("market") ?? "").trim(),
        date: String(form.get("date") ?? ""),
        amount: Number(form.get("amount") ?? 0),
        type: String(form.get("type") ?? "Normaler Einkauf") as ReceiptType,
        note: String(form.get("note") ?? "").trim(),
        fileName: file instanceof File && file.size > 0 ? file.name : undefined
      }]
    }));
    setDialog(null);
  }

  function handleMeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const meal = String(form.get("meal") ?? "").trim();
    if (!meal) return;
    setData((current) => ({
      ...current,
      meals: [...current.meals, {
        id: Date.now(),
        day: String(form.get("day") ?? "Montag"),
        meal,
        servings: Number(form.get("servings") ?? 4)
      }]
    }));
    setDialog(null);
  }

  function handleFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      family: [...current.family, { id: Date.now(), name, role: String(form.get("role") ?? "Familie") }]
    }));
    setDialog(null);
  }

  function handleVacation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setData((current) => ({
      ...current,
      vacation: {
        startDate: String(form.get("startDate") ?? ""),
        endDate: String(form.get("endDate") ?? ""),
        destination: String(form.get("destination") ?? "").trim()
      }
    }));
    setDialog(null);
  }

  function prepareVacation() {
    [
      ["Wasser", "Getränke", 1, "Kiste"],
      ["Snacks", "Verpflegung unterwegs", 4, "Packung"],
      ["Taschentücher", "Haushalt & Drogerie", 1, "Packung"],
      ["Feuchttücher", "Haushalt & Drogerie", 1, "Packung"],
      ["Sonnencreme", "Haushalt & Drogerie", 1, "Flasche"]
    ].forEach(([name, category, quantity, unit]) =>
      addShoppingItem(name, category, Number(quantity), unit, "check", "assistent")
    );
    setAssistantInfo("Reiseartikel wurden ergänzt. Kurz haltbare Mengen bitte vor dem Einkauf prüfen.");
    go("liste");
  }

  function requestWeather() {
    if (!navigator.geolocation) {
      setWeatherStatus("Standortabfrage wird von diesem Gerät nicht unterstützt.");
      return;
    }

    setWeatherStatus("Standort wird ermittelt …");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,precipitation_probability_max&timezone=auto&forecast_days=3`;
          const response = await fetch(url);
          if (!response.ok) throw new Error("Weather request failed");
          const result = await response.json();
          const nextWeather: WeatherData = {
            temperature: Number(result.current?.temperature_2m ?? 0),
            weatherCode: Number(result.current?.weather_code ?? 0),
            maxTemperature: Number(result.daily?.temperature_2m_max?.[0] ?? 0),
            precipitationProbability: Number(result.daily?.precipitation_probability_max?.[0] ?? 0),
            updatedAt: new Date().toISOString()
          };
          setWeather(nextWeather);
          setWeatherStatus("Wetter am aktuellen Standort");
        } catch {
          setWeatherStatus("Wetterdaten konnten nicht geladen werden.");
        }
      },
      () => setWeatherStatus("Standort wurde nicht freigegeben."),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 900000 }
    );
  }

  function addWeatherSuggestions() {
    if (!weather) return;
    if (weather.maxTemperature >= 28) {
      addShoppingItem("Wasser", "Getränke", 2, "Kiste", "must", "assistent");
      addShoppingItem("Eis", "Snacks", 1, "Packung", "check", "assistent");
      addShoppingItem("Obst", "Obst & Gemüse", 1, "kg", "check", "assistent");
    }
    if (weather.precipitationProbability >= 60) {
      addShoppingItem("Taschentücher", "Haushalt & Drogerie", 1, "Packung", "check", "assistent");
    }
    setAssistantInfo("Wetterabhängige Vorschläge wurden geprüft und ergänzt.");
    go("liste");
  }

  function runAssistant() {
    const text = assistantText.toLocaleLowerCase("de-DE");
    let additions: Array<[string, string, number, string]> = [];

    Object.entries(recipeRules).forEach(([keyword, values]) => {
      if (text.includes(keyword)) additions = additions.concat(values);
    });

    const direct: Array<[string[], [string, string, number, string]]> = [
      [["milch ist leer", "milch leer"], ["Milch", "Molkerei", 2, "Packung"]],
      [["nutella ist leer", "nutella leer"], ["Nutella", "Brot & Frühstück", 1, "Glas"]],
      [["wasser ist leer", "wasser leer"], ["Wasser", "Getränke", 2, "Kiste"]],
      [["aufschnitt ist leer", "aufschnitt leer"], ["Aufschnitt", "Fleisch & Wurst", 2, "Packung"]],
      [["toilettenpapier ist leer", "klopapier ist leer"], ["Toilettenpapier", "Haushalt & Drogerie", 1, "Packung"]]
    ];
    direct.forEach(([terms, item]) => {
      if (terms.some((term) => text.includes(term))) additions.push(item);
    });

    if (text.includes("urlaub") || text.includes("reise")) {
      additions.push(
        ["Wasser", "Getränke", 1, "Kiste"],
        ["Snacks", "Verpflegung unterwegs", 4, "Packung"],
        ["Feuchttücher", "Haushalt & Drogerie", 1, "Packung"]
      );
    }

    if (!additions.length) {
      setAssistantInfo("Keine Regel erkannt. Beispiel: „Milch ist leer und Samstag grillen wir.“");
      return;
    }

    additions.forEach(([name, category, quantity, unit]) =>
      addShoppingItem(name, category, quantity, unit, "check", "assistent")
    );
    setAssistantInfo(`${additions.length} Vorschläge wurden übernommen.`);
    setAssistantText("");
  }

  function addLowStockToList() {
    lowStock.forEach((item) =>
      addShoppingItem(
        item.name,
        item.category,
        Math.max(item.minimum - item.quantity, 1),
        item.unit,
        stockStatus(item) === "leer" ? "must" : "check",
        "vorrat"
      )
    );
    go("liste");
  }

  function addMealIngredients(meal: Meal) {
    const key = Object.keys(recipeRules).find((rule) => meal.meal.toLocaleLowerCase("de-DE").includes(rule));
    if (!key) {
      setAssistantInfo(`Für „${meal.meal}“ ist noch keine Zutatenregel hinterlegt.`);
      go("start");
      return;
    }
    recipeRules[key].forEach(([name, category, quantity, unit]) =>
      addShoppingItem(name, category, quantity, unit, "check", "wochenplan")
    );
    go("liste");
  }

  function completeShopping() {
    const purchased = data.shopping.filter((item) => item.done);
    setData((current) => ({
      ...current,
      stock: current.stock.map((stockItem) => {
        const bought = purchased.find((item) => item.name.toLocaleLowerCase("de-DE") === stockItem.name.toLocaleLowerCase("de-DE"));
        return bought ? { ...stockItem, quantity: stockItem.quantity + bought.quantity } : stockItem;
      }),
      shopping: current.shopping.filter((item) => !item.done)
    }));
  }

  function exportJson() {
    download("Einkaufsheld_Datensicherung.json", JSON.stringify(data, null, 2), "application/json");
  }

  function exportCsv() {
    const rows = [
      ["Datum", "Markt", "Betrag", "Art", "Notiz"],
      ...sortedReceipts.map((receipt) => [
        receipt.date,
        receipt.market,
        receipt.amount.toFixed(2).replace(".", ","),
        receipt.type,
        receipt.note
      ])
    ];
    download(
      "Einkaufsheld_Einkaeufe.csv",
      "\ufeff" + rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n"),
      "text/csv"
    );
  }

  function download(name: string, content: string, type: string) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type }));
    link.download = name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setData(migrate(JSON.parse(await file.text())));
    } catch {
      alert("Die Datei konnte nicht gelesen werden.");
    }
  }

  return (
    <>
      <header className="topbar">
        <div className="topbarInner">
          <div>
            <p className="eyebrow light">Familien Einkaufsmanager</p>
            <h1>Einkaufsheld <span>1.0</span></h1>
            <p className="subline">Planen · Einkaufen · Vorrat · Budget</p>
          </div>
          <button className="roundButton" onClick={() => setDialog("receipt")}>+</button>
        </div>
      </header>

      <main>
        {tab === "start" && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h2>Guten Abend, Olaf</h2>
                <p>Der Juli liegt aktuell bei {money(total)}.</p>
              </div>
              <span className={`status ${remaining >= 0 ? "good" : "bad"}`}>
                {remaining >= 0 ? `${money(remaining)} verfügbar` : `${money(Math.abs(remaining))} über Budget`}
              </span>
            </section>

            <section className="card hero">
              <div>
                <span className="muted">Ausgaben Juli 2026</span>
                <strong className="heroValue">{money(total)}</strong>
                <small>{monthReceipts.length} Einkäufe erfasst</small>
              </div>
              <div className="ring" style={{ background: `conic-gradient(var(--accent) 0 ${budgetPercent}%, #e2e8e3 ${budgetPercent}% 100%)` }}>
                <strong>{budgetPercent} %</strong>
              </div>
            </section>

            <div className="metricGrid">
              <article className="card metric"><span>Offene Artikel</span><strong>{openShopping.length}</strong><small>Einkaufsliste</small></article>
              <article className="card metric"><span>Vorrat prüfen</span><strong>{lowStock.length}</strong><small>knapp oder leer</small></article>
              <article className="card metric"><span>Wochenplan</span><strong>{data.meals.length}</strong><small>geplante Essen</small></article>
            </div>

            <section className="quickGrid">
              <button onClick={() => setDialog("receipt")}><span>＋</span><strong>Beleg erfassen</strong><small>Markt und Betrag</small></button>
              <button onClick={() => go("liste")}><span>☑</span><strong>Einkaufsliste</strong><small>{openShopping.length} offen</small></button>
              <button onClick={() => go("vorrat")}><span>▦</span><strong>Vorrat</strong><small>{lowStock.length} prüfen</small></button>
              <button onClick={() => go("plan")}><span>▣</span><strong>Wochenplan</strong><small>Essen planen</small></button>
            </section>

            <section className="card assistant">
              <div className="sectionHead"><div><p className="eyebrow">Mitdenkfunktion</p><h2>Einkaufsassistent</h2></div><span className="spark">✦</span></div>
              <textarea rows={3} value={assistantText} onChange={(event) => setAssistantText(event.target.value)} placeholder="Milch ist leer und am Samstag grillen wir." />
              <button className="primary full" onClick={runAssistant}>Einkauf automatisch ergänzen</button>
              {assistantInfo && <p className="assistantInfo">{assistantInfo}</p>}
            </section>

            {(data.vacation.startDate || data.vacation.endDate) && (
              <section className={`card vacationCard ${vacationActive ? "activeVacation" : ""}`}>
                <div>
                  <p className="eyebrow">{vacationActive ? "Urlaubsmodus aktiv" : "Urlaub geplant"}</p>
                  <h2>{data.vacation.destination || "Reise"}</h2>
                  <p>
                    {dateText(data.vacation.startDate)} bis {dateText(data.vacation.endDate)}
                    {!vacationActive && daysUntilVacation !== null && daysUntilVacation >= 0 ? ` · in ${daysUntilVacation} Tagen` : ""}
                  </p>
                  <small>{vacationActive ? "Einkauf auf Reisebedarf und geringe Frischemengen ausrichten." : "Kurz haltbare Vorräte vor Abreise reduzieren."}</small>
                </div>
                <button className="secondary" onClick={prepareVacation}>Reise vorbereiten</button>
              </section>
            )}

            <section className="card weatherCard">
              <div className="sectionHead">
                <div><p className="eyebrow">Standort und Wetter</p><h2>{weather ? `${Math.round(weather.temperature)} °C · ${weatherLabel(weather.weatherCode)}` : "Lokales Wetter"}</h2></div>
                <button onClick={requestWeather}>{weather ? "Aktualisieren" : "Standort freigeben"}</button>
              </div>
              <p className="muted">{weatherStatus}</p>
              {weather && (
                <div className="weatherDetails">
                  <span>Maximum heute <strong>{Math.round(weather.maxTemperature)} °C</strong></span>
                  <span>Regenrisiko <strong>{Math.round(weather.precipitationProbability)} %</strong></span>
                  <button className="secondary" onClick={addWeatherSuggestions}>Einkauf ans Wetter anpassen</button>
                </div>
              )}
            </section>

            {lowStock.length > 0 && (
              <section className="card warningCard">
                <div><p className="eyebrow">Vorratswarnung</p><h2>{lowStock.length} Artikel nachkaufen</h2><p>{lowStock.slice(0, 4).map((item) => item.name).join(", ")}</p></div>
                <button className="secondary" onClick={addLowStockToList}>Übernehmen</button>
              </section>
            )}

            <section className="card">
              <div className="sectionHead"><h2>Ausgaben nach Markt</h2><button onClick={() => go("analyse")}>Details</button></div>
              {markets.map(([market, value]) => (
                <div className="bar" key={market}>
                  <div className="barMeta"><span>{market}</span><strong>{money(value)}</strong></div>
                  <div className="barTrack"><div className="barFill" style={{ width: `${(value / maxMarket) * 100}%` }} /></div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "liste" && (
          <>
            <PageHead eyebrow="Wocheneinkauf" title="Einkaufsliste" action="Artikel hinzufügen" onAction={() => setDialog("shopping")} />
            <section className="card progress">
              <div><strong>{completed} von {data.shopping.length} erledigt</strong><span>{shoppingPercent} %</span></div>
              <div className="barTrack"><div className="barFill" style={{ width: `${shoppingPercent}%` }} /></div>
            </section>

            {[...new Set(data.shopping.map((item) => item.category))].map((category) => (
              <section className="category" key={category}>
                <h3>{category}</h3>
                {data.shopping.filter((item) => item.category === category).map((item) => (
                  <div className={`shoppingRow ${item.done ? "done" : ""}`} key={item.id}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={(event) => setData((current) => ({
                        ...current,
                        shopping: current.shopping.map((candidate) =>
                          candidate.id === item.id ? { ...candidate, done: event.target.checked } : candidate
                        )
                      }))}
                    />
                    <div><strong>{item.name}</strong><small>{item.quantity} {item.unit} · {sourceText(item.source)}</small></div>
                    <span className={`badge ${item.priority}`}>{priorityText(item.priority)}</span>
                    <button className="deleteButton" onClick={() => setData((current) => ({ ...current, shopping: current.shopping.filter((candidate) => candidate.id !== item.id) }))}>×</button>
                  </div>
                ))}
              </section>
            ))}

            {completed > 0 && <button className="primary full finishButton" onClick={completeShopping}>Abgehakte Artikel in den Vorrat übernehmen</button>}
          </>
        )}

        {tab === "vorrat" && (
          <>
            <PageHead eyebrow="Haushalt" title="Vorratsmanager" action="Artikel hinzufügen" onAction={() => setDialog("stock")} />
            <section className="stockSummary">
              <div><strong>{data.stock.filter((item) => stockStatus(item) === "vorhanden").length}</strong><span>Vorhanden</span></div>
              <div><strong>{data.stock.filter((item) => stockStatus(item) === "knapp").length}</strong><span>Knapp</span></div>
              <div><strong>{data.stock.filter((item) => stockStatus(item) === "leer").length}</strong><span>Leer</span></div>
            </section>
            <section className="card">
              {data.stock.map((item) => {
                const status = stockStatus(item);
                return (
                  <div className="stockRow" key={item.id}>
                    <div className="stockMain">
                      <strong>{item.name}</strong>
                      <small>{item.category} · Mindestbestand {item.minimum} {item.unit}</small>
                    </div>
                    <div className="counter">
                      <button onClick={() => setData((current) => ({ ...current, stock: current.stock.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: Math.max(0, candidate.quantity - 1) } : candidate) }))}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => setData((current) => ({ ...current, stock: current.stock.map((candidate) => candidate.id === item.id ? { ...candidate, quantity: candidate.quantity + 1 } : candidate) }))}>+</button>
                    </div>
                    <span className={`stockBadge ${status}`}>{statusText(status)}</span>
                  </div>
                );
              })}
            </section>
            <button className="primary full" onClick={addLowStockToList}>Knapp und leer zur Einkaufsliste</button>
          </>
        )}

        {tab === "belege" && (
          <>
            <PageHead eyebrow="Einkäufe" title="Kassenbons" action="Neuer Beleg" onAction={() => setDialog("receipt")} />
            <section className="card">
              {sortedReceipts.map((receipt) => (
                <div className="receiptRow" key={receipt.id}>
                  <div className="marketIcon">{receipt.market.slice(0, 2).toUpperCase()}</div>
                  <div><strong>{receipt.market}</strong><small>{dateText(receipt.date)} · {receipt.type}{receipt.fileName ? ` · ${receipt.fileName}` : ""}</small></div>
                  <strong>{money(receipt.amount)}</strong>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "plan" && (
          <>
            <PageHead eyebrow="Familienplanung" title="Wochenplan" action="Essen hinzufügen" onAction={() => setDialog("meal")} />
            <section className="card">
              {data.meals.map((meal) => (
                <div className="mealRow" key={meal.id}>
                  <div className="day">{meal.day.slice(0, 2)}</div>
                  <div><strong>{meal.meal}</strong><small>{meal.servings} Portionen</small></div>
                  <button className="secondary" onClick={() => addMealIngredients(meal)}>Zutaten</button>
                  <button className="deleteButton" onClick={() => setData((current) => ({ ...current, meals: current.meals.filter((candidate) => candidate.id !== meal.id) }))}>×</button>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === "analyse" && (
          <>
            <PageHead eyebrow="Haushaltscontrolling" title="Auswertung" />
            <div className="twoColumns">
              <article className="card metric"><span>Normaler Haushalt</span><strong>{money(monthReceipts.filter((item) => !["Sonderkauf", "Außendienst"].includes(item.type)).reduce((sum, item) => sum + item.amount, 0))}</strong><small>Juli</small></article>
              <article className="card metric"><span>Sonderkäufe</span><strong>{money(monthReceipts.filter((item) => ["Sonderkauf", "Außendienst"].includes(item.type)).reduce((sum, item) => sum + item.amount, 0))}</strong><small>separat</small></article>
            </div>
            <section className="card">
              <h2>Marktverteilung</h2>
              {markets.map(([market, value]) => (
                <div className="bar" key={market}>
                  <div className="barMeta"><span>{market}</span><strong>{money(value)}</strong></div>
                  <div className="barTrack"><div className="barFill" style={{ width: `${(value / maxMarket) * 100}%` }} /></div>
                </div>
              ))}
            </section>
            <section className={`card budgetInsight ${remaining < 0 ? "danger" : ""}`}>
              <p className="eyebrow">Budget</p>
              <h2>{remaining >= 0 ? "Budget aktuell im Rahmen" : "Budget überschritten"}</h2>
              <p>{remaining >= 0 ? `Noch ${money(remaining)} verfügbar.` : `${money(Math.abs(remaining))} über dem Monatsbudget.`}</p>
            </section>
          </>
        )}

        {tab === "mehr" && (
          <>
            <PageHead eyebrow="Einstellungen" title="Einkaufsheld" />
            <section className="card formCard">
              <label>Monatsbudget<input type="number" min="0" step="10" value={data.budget} onChange={(event) => setData((current) => ({ ...current, budget: Number(event.target.value) }))} /></label>
            </section>
            <section className="card">
              <div className="sectionHead">
                <div><p className="eyebrow">Abwesenheit</p><h2>Urlaubszeitraum</h2></div>
                <button onClick={() => setDialog("vacation")}>{data.vacation.startDate ? "Ändern" : "Eintragen"}</button>
              </div>
              {data.vacation.startDate ? (
                <div className="vacationSummary">
                  <strong>{data.vacation.destination || "Urlaub"}</strong>
                  <span>{dateText(data.vacation.startDate)} bis {dateText(data.vacation.endDate)}</span>
                  <button className="textDanger" onClick={() => setData((current) => ({ ...current, vacation: seed.vacation }))}>Zeitraum löschen</button>
                </div>
              ) : <p className="muted">Noch kein Urlaub eingetragen.</p>}
            </section>

            <section className="card">
              <div className="sectionHead"><div><p className="eyebrow">Familie</p><h2>{data.family.length} Personen</h2></div><button onClick={() => setDialog("family")}>Person hinzufügen</button></div>
              {data.family.map((member) => <div className="familyRow" key={member.id}><strong>{member.name}</strong><span>{member.role}</span></div>)}
            </section>
            <section className="card">
              <h2>Daten und Excel</h2>
              <p className="muted bodyText">Sicherung lokal exportieren oder auf einem anderen Gerät importieren.</p>
              <div className="buttonRow">
                <button className="secondary" onClick={exportJson}>JSON sichern</button>
                <button className="secondary" onClick={exportCsv}>CSV für Excel</button>
                <label className="secondary fileButton">JSON importieren<input type="file" accept="application/json" onChange={importJson} /></label>
              </div>
            </section>
            <section className="card infoCard">
              <p className="eyebrow">Einkaufsheld 1.0</p>
              <h2>Funktionsstand 1.4</h2>
              <p>Dashboard, Einkaufsliste, Vorrat, Belege, Wochenplan, Familie und Auswertung arbeiten lokal auf diesem Gerät.</p>
            </section>
          </>
        )}
      </main>

      <nav className="bottomNav">
        {[
          ["start", "⌂", "Start"],
          ["liste", "☑", "Liste"],
          ["vorrat", "▦", "Vorrat"],
          ["belege", "▤", "Belege"],
          ["plan", "▣", "Plan"],
          ["analyse", "◔", "Analyse"],
          ["mehr", "⚙", "Mehr"]
        ].map(([key, icon, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => go(key as Tab)}><span>{icon}</span>{label}</button>
        ))}
      </nav>

      {dialog && (
        <Modal title={dialogTitle(dialog)} onClose={() => setDialog(null)}>
          {dialog === "shopping" && <ShoppingForm onSubmit={handleShopping} />}
          {dialog === "stock" && <StockForm onSubmit={handleStock} />}
          {dialog === "receipt" && <ReceiptForm onSubmit={handleReceipt} />}
          {dialog === "meal" && <MealForm onSubmit={handleMeal} />}
          {dialog === "family" && <FamilyForm onSubmit={handleFamily} />}
          {dialog === "vacation" && <VacationForm onSubmit={handleVacation} vacation={data.vacation} />}
        </Modal>
      )}
    </>
  );
}

function PageHead({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return <div className="pageHead"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action && <button className="primary" onClick={onAction}>{action}</button>}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="overlay" onMouseDown={onClose}><div className="modal" onMouseDown={(event) => event.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button onClick={onClose}>×</button></div>{children}</div></div>;
}

function ShoppingForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="formCard" onSubmit={onSubmit}><label>Artikel<input name="name" required /></label><label>Kategorie<select name="category">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><div className="formGrid"><label>Menge<input name="quantity" type="number" min="1" defaultValue="1" /></label><label>Einheit<select name="unit">{units.map((item) => <option key={item}>{item}</option>)}</select></label></div><label>Priorität<select name="priority"><option value="must">Dringend</option><option value="check">Bestand prüfen</option><option value="standard">Standardartikel</option></select></label><button className="primary full">Speichern</button></form>;
}

function StockForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="formCard" onSubmit={onSubmit}><label>Artikel<input name="name" required /></label><label>Kategorie<select name="category">{categories.map((item) => <option key={item}>{item}</option>)}</select></label><div className="formGrid"><label>Bestand<input name="quantity" type="number" min="0" defaultValue="1" /></label><label>Mindestbestand<input name="minimum" type="number" min="0" defaultValue="1" /></label></div><label>Einheit<select name="unit">{units.map((item) => <option key={item}>{item}</option>)}</select></label><label className="checkLabel"><input name="standard" type="checkbox" /> Standardartikel</label><button className="primary full">Speichern</button></form>;
}

function ReceiptForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="formCard" onSubmit={onSubmit}><label>Markt<input name="market" required /></label><div className="formGrid"><label>Datum<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Betrag<input name="amount" type="number" min="0.01" step="0.01" required /></label></div><label>Art<select name="type"><option>Normaler Einkauf</option><option>Ergänzungskauf</option><option>Sonderkauf</option><option>Außendienst</option></select></label><label>Notiz<textarea name="note" rows={3} /></label><label>Foto oder PDF<input name="file" type="file" accept="image/*,application/pdf" /></label><button className="primary full">Speichern</button></form>;
}

function MealForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="formCard" onSubmit={onSubmit}><label>Tag<select name="day">{["Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag","Sonntag"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Gericht oder Anlass<input name="meal" required placeholder="z. B. Grillen" /></label><label>Portionen<input name="servings" type="number" min="1" defaultValue="4" /></label><button className="primary full">Speichern</button></form>;
}

function FamilyForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="formCard" onSubmit={onSubmit}><label>Name<input name="name" required /></label><label>Rolle<select name="role"><option>Erwachsener</option><option>Erwachsene</option><option>Kind</option><option>Gast</option></select></label><button className="primary full">Speichern</button></form>;
}

function priorityText(value: Priority) {
  return value === "must" ? "Dringend" : value === "check" ? "Prüfen" : "Standard";
}
function sourceText(value: ShoppingItem["source"]) {
  const values = { manuell: "manuell", standard: "Standardartikel", assistent: "Assistent", vorrat: "Vorrat", wochenplan: "Wochenplan" };
  return values[value];
}
function statusText(value: StockStatus) {
  return value === "vorhanden" ? "Vorhanden" : value === "knapp" ? "Knapp" : "Leer";
}
function dialogTitle(value: "shopping" | "stock" | "receipt" | "meal" | "family" | "vacation") {
  const titles = { shopping: "Artikel hinzufügen", stock: "Vorratsartikel hinzufügen", receipt: "Beleg erfassen", meal: "Essen planen", family: "Person hinzufügen", vacation: "Urlaubszeitraum" };
  return titles[value];
}


function VacationForm({ onSubmit, vacation }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; vacation: Vacation }) {
  return (
    <form className="formCard" onSubmit={onSubmit}>
      <label>Reiseziel oder Anlass<input name="destination" defaultValue={vacation.destination} placeholder="z. B. Dänemark" /></label>
      <div className="formGrid">
        <label>Abreise<input name="startDate" type="date" defaultValue={vacation.startDate} required /></label>
        <label>Rückkehr<input name="endDate" type="date" defaultValue={vacation.endDate} required /></label>
      </div>
      <button className="primary full">Speichern</button>
    </form>
  );
}

function weatherLabel(code: number) {
  if (code === 0) return "klar";
  if ([1, 2, 3].includes(code)) return "bewölkt";
  if ([45, 48].includes(code)) return "Nebel";
  if ([51, 53, 55, 56, 57].includes(code)) return "Nieselregen";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Regen";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Schnee";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  return "wechselhaft";
}
