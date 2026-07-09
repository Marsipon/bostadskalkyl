import { APP_NAME } from './constants.js';
import { escapeHtml, formatCurrency, formatDateTime, formatIntegerInput, formatLoanToValue, formatPercentInput } from './utils.js';

function renderMetric(label, value) {
  return `
    <div class="metric-row">
      <dt>${label}</dt>
      <dd>${value}</dd>
    </div>
  `;
}

function renderField({ id, label, value, hint = '', field, inputMode = 'numeric' }) {
  const safeId = escapeHtml(id);
  const safeHintId = `${safeId}-hint`;

  return `
    <label class="field" for="${safeId}">
      <span class="field__label">${escapeHtml(label)}</span>
      <input
        class="field__input js-number-input"
        id="${safeId}"
        name="${safeId}"
        type="text"
        inputmode="${inputMode}"
        autocomplete="off"
        placeholder="0"
        value="${formatIntegerInput(value)}"
        data-field="${escapeHtml(field)}"
        aria-describedby="${hint ? safeHintId : ''}"
      >
      ${hint ? `<span class="field__hint" id="${safeHintId}">${escapeHtml(hint)}</span>` : ''}
    </label>
  `;
}

function renderPercentField({ id, label, value, field, hint = '' }) {
  const safeId = escapeHtml(id);
  const safeHintId = `${safeId}-hint`;

  return `
    <label class="field" for="${safeId}">
      <span class="field__label">${escapeHtml(label)}</span>
      <div class="field__percent-wrap">
        <input
          class="field__input js-percent-input"
          id="${safeId}"
          name="${safeId}"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0"
          value="${formatPercentInput(value)}"
          data-field="${escapeHtml(field)}"
          aria-describedby="${hint ? safeHintId : ''}"
        >
        <span class="field__suffix">%</span>
      </div>
      ${hint ? `<span class="field__hint" id="${safeHintId}">${escapeHtml(hint)}</span>` : ''}
    </label>
  `;
}

function renderLoans(loans) {
  return loans.map((loan, index) => `
    <div class="loan-row">
      <label class="field" for="loan-${escapeHtml(loan.id)}">
        <span class="field__label">Lån ${index + 1}</span>
        <input
          class="field__input js-loan-input"
          id="loan-${escapeHtml(loan.id)}"
          name="loan-${escapeHtml(loan.id)}"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="0"
          value="${formatIntegerInput(loan.amount)}"
          data-loan-id="${escapeHtml(loan.id)}"
        >
      </label>
      <button
        class="button button--ghost button--icon"
        type="button"
        data-action="remove-loan"
        data-loan-id="${escapeHtml(loan.id)}"
        aria-label="Ta bort lån ${index + 1}"
      >
        ×
      </button>
    </div>
  `).join('');
}

export function renderResultPanel(results) {
  const statusText = results.status === 'short'
    ? 'Du saknar kapital'
    : results.status === 'tight'
      ? 'Du ligger nära gränsen'
      : 'Du har råd';
  const amountText = results.status === 'short'
    ? formatCurrency(results.capitalMissing)
    : formatCurrency(results.capitalSurplus);
  const bodyText = results.status === 'short'
    ? `Du behöver minst ${amountText} extra för att hålla dig inom 85 % belåningsgrad.`
    : results.status === 'tight'
      ? `Affären går ihop med ungefär ${amountText} kvar som marginal.`
      : `Du får ungefär ${amountText} över efter affären.`;

  return `
    <section class="card result-card result-card--${results.status}" data-role="result-panel" aria-labelledby="result-heading">
      <div class="result-card__badge">Resultat</div>
      <h2 class="section-title" id="result-heading">${statusText}</h2>
      <p class="result-card__amount">${amountText}</p>
      <p class="result-card__body">${bodyText}</p>
      <details class="details">
        <summary>Visa detaljer</summary>
        <dl class="metric-list">
          ${renderMetric('Likvid efter försäljning', formatCurrency(results.saleProceeds))}
          ${renderMetric('Eget kapital', formatCurrency(results.equity))}
          ${renderMetric('Totalt bolån idag', formatCurrency(results.totalMortgage))}
          ${renderMetric('Nytt bolån', formatCurrency(results.requiredLoan))}
          ${renderMetric('Belåningsgrad', formatLoanToValue(results.loanToValue))}
          ${renderMetric('Kontantinsats (15 %)', formatCurrency(results.downPayment))}
          ${renderMetric('Kapital som krävs', formatCurrency(results.requiredOwnCash))}
          ${renderMetric('Lagfart', formatCurrency(results.stampDuty))}
          ${renderMetric('Nya pantbrev', formatCurrency(results.pantbrev.newDeeds))}
          ${renderMetric('Pantbrevskostnad', formatCurrency(results.pantbrev.cost))}
          ${renderMetric('Mäklararvode', formatCurrency(results.brokerFee))}
          ${renderMetric('Totalkostnad för nya bostaden', formatCurrency(results.totalCost))}
        </dl>
      </details>
    </section>
  `;
}

export function renderApp({ calculations, activeCalculation, results, shareUrl }) {
  const activeState = activeCalculation.state;

  return `
    <div class="app-shell">
      <header class="app-header">
        <p class="app-header__eyebrow">Helt offline • Inget konto • Ingen backend</p>
        <h1>${APP_NAME}</h1>
        <p class="app-header__intro">Mobile-first beslutsstöd för köp och försäljning av bostäder i Sverige.</p>
      </header>

      <main class="app-main">
        <section class="card" aria-labelledby="scenarios-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="scenarios-heading">▼ Mina kalkyler</h2>
              <p class="section-copy">Aktiv senast uppdaterades ${escapeHtml(formatDateTime(activeCalculation.updatedAt))}</p>
            </div>
          </div>
          <label class="field" for="active-calculation">
            <span class="field__label">Aktiv kalkyl</span>
            <select class="field__input field__input--select" id="active-calculation" data-action="change-calculation" aria-label="Välj aktiv kalkyl">
              ${calculations.map((calculation) => `
                <option value="${escapeHtml(calculation.id)}" ${calculation.id === activeCalculation.id ? 'selected' : ''}>${escapeHtml(calculation.name)}</option>
              `).join('')}
            </select>
          </label>
          <div class="button-row">
            <button class="button" type="button" data-action="rename-calculation">Byt namn</button>
            <button class="button" type="button" data-action="duplicate-calculation">Duplicera</button>
            <button class="button button--ghost" type="button" data-action="delete-calculation">Ta bort</button>
          </div>
        </section>

        ${renderResultPanel(results)}

        <section class="card" aria-labelledby="current-home-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="current-home-heading">Nuvarande bostad</h2>
              <p class="section-copy">Ange bostadens värde, historik och alla lånedelar.</p>
            </div>
          </div>
          <div class="field-stack">
            ${renderField({ id: 'market-value', label: 'Marknadsvärde', value: activeState.currentHome.marketValue, field: 'currentHome.marketValue' })}
            ${renderField({ id: 'purchase-price', label: 'Inköpspris (valfritt)', value: activeState.currentHome.purchasePrice, field: 'currentHome.purchasePrice' })}
            ${renderPercentField({ id: 'broker-fee', label: 'Mäklararvode', value: activeState.currentHome.brokerFeePercent, field: 'currentHome.brokerFeePercent', hint: 'Procentsats av försäljningspriset.' })}
          </div>
          <div class="section-header section-header--tight">
            <h3 class="subsection-title">Bolån</h3>
            <p class="loan-total">Totalt: <strong data-role="loan-total">${formatCurrency(results.totalMortgage)}</strong></p>
          </div>
          <div class="field-stack">
            ${renderLoans(activeState.currentHome.loans)}
          </div>
          <button class="button button--ghost button--full" type="button" data-action="add-loan">+ Lägg till lån</button>
        </section>

        <section class="card" aria-labelledby="new-home-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="new-home-heading">Ny bostad</h2>
              <p class="section-copy">Fyll i pris och kostnader för att se om affären håller.</p>
            </div>
          </div>
          <div class="field-stack">
            ${renderField({ id: 'new-price', label: 'Pris', value: activeState.newHome.price, field: 'newHome.price' })}
            ${renderField({ id: 'existing-deeds', label: 'Befintliga pantbrev', value: activeState.newHome.existingDeeds, field: 'newHome.existingDeeds' })}
            ${renderField({ id: 'renovation-cost', label: 'Renoveringskostnad', value: activeState.newHome.renovationCost, field: 'newHome.renovationCost' })}
            ${renderField({ id: 'other-costs', label: 'Övriga kostnader', value: activeState.newHome.otherCosts, field: 'newHome.otherCosts' })}
          </div>
        </section>

        <section class="card" aria-labelledby="share-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="share-heading">Dela och säkerhetskopiera</h2>
              <p class="section-copy">Scenariot kan delas via URL eller sparas som JSON på din enhet.</p>
            </div>
          </div>
          <label class="field" for="share-url">
            <span class="field__label">Dela via länk</span>
            <input class="field__input" id="share-url" value="${escapeHtml(shareUrl)}" readonly data-role="share-url" aria-label="Delningslänk">
          </label>
          <div class="button-row">
            <button class="button" type="button" data-action="share-calculation">📤 Dela</button>
            <button class="button" type="button" data-action="export-calculation">Exportera</button>
            <button class="button button--ghost" type="button" data-action="trigger-import">Importera</button>
          </div>
          <input class="visually-hidden" type="file" id="import-file" accept="application/json" data-action="import-file" aria-label="Importera kalkyl från JSON-fil">
        </section>
      </main>

      <div class="action-bar" aria-label="Snabbåtgärder">
        <button class="button button--primary button--full" type="button" data-action="new-calculation">＋ Ny kalkyl</button>
        <button class="button button--secondary button--full" type="button" data-action="share-calculation">📤 Dela</button>
      </div>

      <div class="visually-hidden" aria-live="polite" data-role="live-region"></div>
    </div>
  `;
}
