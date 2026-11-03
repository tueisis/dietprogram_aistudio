# Diet Planning & Optimization Web App (React + TypeScript)

Applicazione web moderna e reattiva per la gestione della dieta personale, monitoraggio del trend del peso corporeo, pianificazione dei pasti e ottimizzazione automatica dei costi con programmazione vincolata.

---

## 🏗️ Architettura del Software

Il progetto è stato riscritto interamente come Single-Page Application (SPA) in **React 18** con **TypeScript** e **Vite**:

```text
src/
├── components/          # Componenti riutilizzabili dell'interfaccia
│   ├── Navbar.tsx       # Barra di navigazione a schede con pulsante esportazione ZIP
│   ├── SetupBanner.tsx  # Banner persistenza memoria, importazione ed esportazione
│   └── WeightChart.tsx  # Grafico SVG reattivo dell'andamento del peso corporeo
├── screens/             # Viste principali corrispondenti alle sezioni dell'app
│   ├── MainScreen.tsx   # Dashboard principale, peso, calorie, fabbisogno e grafico
│   ├── FoodScreen.tsx   # Diario alimentare giornaliero e calcolo calorie in tempo reale
│   ├── HistoryScreen.tsx# Storico pasti consumati e costruttore Pasti Rapidi
│   ├── PlannerScreen.tsx# Piano alimentare 5 giorni, porzioni, swap e gestione template
│   ├── DatabaseScreen.tsx# Gestione database alimenti con modifica inline e codici colore
│   └── ConstraintsScreen.tsx# Configurazione vincoli nutrizionali minimi e massimi
├── services/            # Logica di calcolo e servizi di dominio
│   ├── analytics.ts     # Regressione lineare del peso, trend e fabbisogno calorico
│   ├── nutrition.ts     # Calcolo calorie, macronutrienti, porzioni e costi alimentari
│   ├── optimizer.ts     # Solver di ottimizzazione vincolata con porzioni dinamiche
│   └── storage.ts       # Gestore memoria localStorage e import/export archivi ZIP
├── constants.ts         # Costanti di dominio, categorie pasti e dataset iniziale
├── types.ts             # Tipi e interfacce TypeScript dell'applicazione
├── App.tsx              # Componente principale e coordinatore dello stato
├── index.css            # Design System scuro moderno con variabili CSS
└── main.tsx             # Entry point React
```

---

## 📖 Funzionalità Portate

1. **Scheda Principale (`/`)**:
   - Registrazione peso (kg) e calorie (kcal).
   - Avviso visivo quando le calorie sono già registrate oggi con pulsante adattivo "Aggiorna".
   - Pulsante "Usa X kcal dal diario" per sincronizzare automaticamente le calorie ingerite oggi.
   - Grafico interattivo dell'andamento del peso corporeo con griglia e tooltip.
   - Analisi e statistiche: Trend (Dimagrimento/Aumento/Stazionario), Variazione giornaliera stimata (kg/giorno e kcal/giorno), Introito calorico medio e Fabbisogno calorico stimato.
   - Scheda riepilogativa dei pasti pianificati per oggi (Colazione, Pranzo, Cena, Merenda).

2. **Diario Alimentare (`/food`)**:
   - Registrazione alimenti consumati oggi con quantità in ettogrammi (hg).
   - Anteprima in tempo reale delle calorie prima dell'inserimento.
   - Lista dinamica dei cibi salvati nel database con filtro di ricerca rapida.
   - Calcolo istantaneo del totale calorie e proteine della giornata.
   - Modale rapido per inserire il valore nutrizionale per ingredienti nuovi non ancora a database.

3. **Storico Pasti (`/history`)**:
   - Consultazione dello storico giornaliero dei pasti consumati.
   - Creazione di **Pasti Rapidi** selezionando con doppio click gli alimenti dalla lista.
   - Assegnazione categorie multiple (Colazione, Pranzo, Cena, Merenda).

4. **Piano Settimanale (`/planner`)**:
   - Finestra scorrevole di 5 giorni con pulsanti « e » e ritorno a oggi.
   - Griglia dei pasti (Colazione, Pranzo, Cena, Merenda).
   - Click singolo per visualizzare la distinta degli ingredienti pesati e moltiplicatore di porzione (es. $\times 1.25$).
   - Click sull'intestazione del giorno per visualizzare il riepilogo nutrizionale (kcal, proteine, carboidrati, grassi).
   - Doppio click su una cella per associare un Pasto Rapido, inserire un pasto manuale o svuotare la cella.
   - Icona blocco note per trascrivere un pasto pianificato direttamente nel diario di oggi con le porzioni scalate.
   - **Ottimizzatore vincolato**: risolve la scelta dei pasti e moltiplicatori di porzione $[0.5 - 1.8]$ per riempire gli slot vuoti rispettando i vincoli giornalieri e minimizzando la spesa.
   - Gestione pasti integrata: editor completo per ingredienti, categorie ed esclusione automatica dall'ottimizzatore.
   - Modalità "Scambia Pasti" e pulsante "Svuota Piano".

5. **Database Alimenti (`/database`)**:
   - Tabella degli alimenti con valori nutrizionali per 1 hg (kcal, proteine, carboidrati, grassi) e prezzo (€).
   - Modifica inline tramite click sulle celle. La rinomina dell'alimento aggiorna automaticamente tutti i pasti salvati.
   - Segnalazione visiva per cibi usati nei pasti privi di prezzo o di nutrienti soggetti a vincoli.

6. **Vincoli Nutrizionali (`/constraints`)**:
   - Impostazione di minimi e massimi per Calorie, Proteine, Carboidrati e Grassi applicati dall'ottimizzatore.

7. **Backup & Portabilità (`Dati_Dieta.zip`)**:
   - Esportazione ed importazione completa di archivi `.zip` e file `.json` compatibili con la versione originale.
