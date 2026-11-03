# Registro Implementazioni

In questo file sono documentate le implementazioni completate e le idee future per l'applicazione web.

---

## ✅ Implementazioni Completate

1. **Svuotamento Piano Settimanale (`/clear_plan`)**:
   - Aggiunto pulsante "Svuota Piano" per cancellare con un solo click i pasti e le porzioni dei 5 giorni visualizzati nel planner.

2. **Segnalazione Calorie Giornaliere Già Registrate**:
   - Se le calorie del giorno odierno sono già state inserite, l'interfaccia mostra un avviso giallo di attenzione e converte il pulsante di invio in "Aggiorna".

3. **Miglioramento Visualizzazione Porzioni e Rimozione Auto-Scroll**:
   - Visualizzazione del badge del moltiplicatore di porzione (es. `×1.20`) direttamente nelle celle del piano settimanale.
   - Elenco chiaro e ordinato degli ingredienti pesati al click della cella.
   - Eliminato lo scorrimento automatico forzato della pagina verso il basso durante l'ispezione della tabella.

4. **Esclusione Pasto dall'Ottimizzatore PuLP**:
   - Aggiunto flag `exclude` nella gestione dei template pasti (`/save_full_meal_template`).
   - Badge "Escluso" nella lista pasti del planner.
   - Il solver PuLP ignora automaticamente tutti i pasti con flag `exclude=True`.

5. **Refactoring Architetturale e Pulizia Codice**:
   - Transizione a Flask Application Factory con moduli (`core/`, `services/`, `routes/`).
   - Riorganizzazione dell'ottimizzatore PuLP in passaggi modulari.
   - Design System CSS modernizzato con CSS Variables, bordi arrotondati, box metrici e supporto responsive.

---

## 💡 Idee per Implementazioni Future

- Supporto a profili utente multipli o autenticazione persistente con database SQL opzionale.
- Esportazione del piano settimanale in formato PDF o lista della spesa stampabile.
- Grafico interattivo dell'apporto dei macronutrienti (proteine, carboidrati, grassi) su base settimanale.
