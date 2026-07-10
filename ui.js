import { APP_NAME } from './constants.js';
import {
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatIntegerInput,
  formatLoanToValue,
  formatPercent,
  formatPercentInput
} from './utils.js';

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

function renderTextField({ id, label, value, field, type = 'text', hint = '' }) {
  const safeId = escapeHtml(id);
  const safeHintId = `${safeId}-hint`;

  return `
    <label class="field" for="${safeId}">
      <span class="field__label">${escapeHtml(label)}</span>
      <input
        class="field__input"
        id="${safeId}"
        name="${safeId}"
        type="${escapeHtml(type)}"
        autocomplete="off"
        value="${escapeHtml(value)}"
        data-field="${escapeHtml(field)}"
        data-kind="string"
        aria-describedby="${hint ? safeHintId : ''}"
      >
      ${hint ? `<span class="field__hint" id="${safeHintId}">${escapeHtml(hint)}</span>` : ''}
    </label>
  `;
}

function renderPercentField({ id, label, value, field, hint = '', className = 'js-percent-input' }) {
  const safeId = escapeHtml(id);
  const safeHintId = `${safeId}-hint`;

  return `
    <label class="field" for="${safeId}">
      <span class="field__label">${escapeHtml(label)}</span>
      <div class="field__percent-wrap">
        <input
          class="field__input ${escapeHtml(className)}"
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

function formatExplanationValue(step, input) {
  if (input.unit === '%') {
    return formatPercent(input.value);
  }

  if (step.id === 'loanToValue' && input.name !== 'Pris') {
    return formatCurrency(input.value);
  }

  return formatCurrency(input.value);
}


function formatAssumptionValue(assumption) {
  if (typeof assumption.value === 'string') {
    return escapeHtml(assumption.value);
  }

  if (assumption.unit === '%') {
    return formatPercent(assumption.value);
  }

  return formatCurrency(assumption.value);
}

function renderExplanationStep(step) {
  const value = step.id === 'loanToValue' ? formatLoanToValue(step.value) : formatCurrency(step.value);
  const assumptions = step.assumptions?.length
    ? `
      <ul class="explanation-list">
        ${step.assumptions.map((assumption) => `
          <li><strong>${escapeHtml(assumption.label)}</strong>: ${formatAssumptionValue(assumption)}</li>
        `).join('')}
      </ul>
    `
    : '<p class="section-copy">Inga extra antaganden för detta steg.</p>';

  const descriptionHtml = step.description
    ? `<p class="section-copy"><em>${escapeHtml(step.description)}</em></p>`
    : '';

  const equationHtml = step.equation
    ? `<p class="section-copy"><strong>Ekvation:</strong> <code>${escapeHtml(step.equation)}</code></p>`
    : '';

  const learnMoreHtml = step.learnMore
    ? `<p class="section-copy"><strong>💡 Tips:</strong> ${escapeHtml(step.learnMore)}</p>`
    : '';

  return `
    <details class="details explanation-step">
      <summary>
        <span>${escapeHtml(step.title)}</span>
        <strong>${value}</strong>
      </summary>
      ${descriptionHtml}
      <p class="section-copy"><strong>Formel:</strong> ${escapeHtml(step.formula)}</p>
      ${equationHtml}
      <p class="section-copy">Så räknades det ut:</p>
      <ul class="explanation-list">
        ${step.inputs.map((input) => `
          <li>
            <span>${escapeHtml(input.operator || '=')} ${escapeHtml(input.name)}</span>
            <strong>${formatExplanationValue(step, input)}</strong>
          </li>
        `).join('')}
        <li class="explanation-list__result">
          <span>= ${escapeHtml(step.resultLabel)}</span>
          <strong>${value}</strong>
        </li>
      </ul>
      <p class="section-copy">Källa/antagande:</p>
      ${assumptions}
      ${learnMoreHtml}
    </details>
  `;
}

function renderPriceExplore(results) {
  const items = results.priceExplore?.samples ?? [];
  if (!items.length) {
    return '';
  }

  return `
    <section class="card" aria-labelledby="price-explore-heading">
      <div class="section-header">
        <div>
          <h2 class="section-title" id="price-explore-heading">Utforska pris</h2>
          <p class="section-copy">Vilket pris klarar du med nuvarande antaganden?</p>
        </div>
      </div>
      <div class="field__hint">Intervall: ${formatCurrency(results.priceExplore.min)} – ${formatCurrency(results.priceExplore.max)}</div>
      <dl class="metric-list">
        ${items.map((item) => renderMetric(
          `${item.statusIcon} ${formatCurrency(item.price)}`,
          item.status === 'short' ? `${item.statusLabel} (${formatCurrency(item.capitalMissing)} saknas)` : `${item.statusLabel} (${formatCurrency(item.capitalSurplus)} kvar)`
        )).join('')}
      </dl>
    </section>
  `;
}

export function renderResultPanel(results) {
  const statusText = results.status === 'short' ? '❌ NEJ' : '✅ JA';
  const amountText = results.status === 'short'
    ? formatCurrency(results.capitalMissing)
    : formatCurrency(results.capitalSurplus);
  const bodyText = results.status === 'short'
    ? `Du saknar ${amountText} för att hålla dig inom 85 % belåningsgrad.`
    : results.status === 'tight'
      ? `Affären går ihop med ungefär ${amountText} över.`
      : `Du får ungefär ${amountText} över efter affären.`;

  const chain = results.explanation?.chain ?? [];
  const steps = results.explanation?.steps ?? {};

  return `
    <section class="card result-card result-card--${results.status}" data-role="result-panel" aria-labelledby="result-heading">
      <div class="result-card__badge">Kan du köpa?</div>
      <h2 class="section-title" id="result-heading">${statusText}</h2>
      <p class="result-card__amount">${amountText}</p>
      <p class="result-card__body">${bodyText}</p>
      <details class="details" open>
        <summary>Förklaring: Hur räknade den fram det?</summary>
        <div class="explanation-chain">
          ${chain.map((stepId) => (steps[stepId] ? renderExplanationStep(steps[stepId]) : '')).join('')}
        </div>
      </details>
    </section>
  `;
}

function renderSharedCalculationCard(sharedPrompt) {
  if (!sharedPrompt) {
    return '';
  }

  return `
    <section class="card shared-card" aria-labelledby="shared-heading">
      <div class="section-header">
        <div>
          <h2 class="section-title" id="shared-heading">Delad kalkyl</h2>
          <p class="section-copy">${escapeHtml(sharedPrompt.name)}</p>
        </div>
      </div>
      <div class="button-row button-row--two">
        <button class="button" type="button" data-action="save-shared-calculation">Spara som min kalkyl</button>
        <button class="button button--ghost" type="button" data-action="discard-shared-calculation">Fortsätt utan att spara</button>
      </div>
    </section>
  `;
}

export function renderApp({ calculations, activeCalculation, results, shareUrl, sharedPrompt }) {
  const activeState = activeCalculation.state;
  const assumptions = activeState.assumptions;
  const priceSliderMin = results.priceExplore?.min ?? 0;
  const priceSliderMax = results.priceExplore?.max ?? Math.max(priceSliderMin + 1, activeState.newHome.price || 1);

  return `
    <div class="app-shell">
      <header class="app-header">
        <p class="app-header__eyebrow">Helt offline • Inget konto • Ingen backend</p>
        <h1>${APP_NAME}</h1>
        <p class="app-header__intro">Mobile-first beslutsstöd för köp och försäljning av bostäder i Sverige.</p>
      </header>

      <main class="app-main">
        ${renderSharedCalculationCard(sharedPrompt)}

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
          </div>
          <details class="details">
            <summary>Visa historiska värden</summary>
            <div class="field-stack">
              ${renderField({ id: 'original-loan', label: 'Ursprungligt lån', value: activeState.currentHome.originalLoan, field: 'currentHome.originalLoan' })}
              ${renderTextField({ id: 'purchase-date', label: 'Inköpsdatum', value: activeState.currentHome.purchaseDate, field: 'currentHome.purchaseDate', type: 'date' })}
              ${renderField({ id: 'renovations', label: 'Renoveringar', value: activeState.currentHome.renovations, field: 'currentHome.renovations' })}
              ${renderField({ id: 'amortized-amount', label: 'Amorterat belopp', value: activeState.currentHome.amortizedAmount, field: 'currentHome.amortizedAmount' })}
            </div>
          </details>
          <div class="section-header section-header--tight">
            <h3 class="subsection-title">Bolån</h3>
            <p class="loan-total">Totalt: <strong data-role="loan-total">${formatCurrency(results.totalMortgage)}</strong></p>
          </div>
          <div class="field-stack">
            ${renderLoans(activeState.currentHome.loans)}
          </div>
          <button class="button button--ghost button--full" type="button" data-action="add-loan">+ Lägg till lån</button>
        </section>

        <section class="card" aria-labelledby="sale-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="sale-heading">Försäljning</h2>
              <p class="section-copy">Ange vad du tror att nuvarande bostad säljs för och vilka kostnader som tillkommer.</p>
            </div>
          </div>
          <div class="field-stack">
            ${renderField({ id: 'sale-price', label: 'Förväntat försäljningspris', value: activeState.sale.expectedPrice, field: 'sale.expectedPrice' })}
            ${renderField({ id: 'sale-tax', label: 'Eventuell skatt', value: activeState.sale.tax, field: 'sale.tax' })}
            ${renderField({ id: 'sale-other-costs', label: 'Övriga kostnader', value: activeState.sale.otherCosts, field: 'sale.otherCosts' })}
          </div>
          <dl class="metric-list">
            ${renderMetric('Mäklararvode', formatCurrency(results.brokerFee))}
            ${renderMetric('Försäljningskostnader totalt', formatCurrency(results.saleCosts))}
            ${renderMetric('Tillgängligt kapital', formatCurrency(results.saleProceeds))}
          </dl>
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
            <label class="field" for="new-price-slider">
              <span class="field__label">Prisreglage</span>
              <input
                class="field__range js-range-input"
                id="new-price-slider"
                type="range"
                min="${priceSliderMin}"
                max="${priceSliderMax}"
                step="10000"
                value="${Math.min(Math.max(activeState.newHome.price || priceSliderMin, priceSliderMin), priceSliderMax)}"
                data-field="newHome.price"
              >
              <span class="field__hint">${formatCurrency(priceSliderMin)} – ${formatCurrency(priceSliderMax)}</span>
            </label>
            ${renderField({ id: 'existing-deeds', label: 'Befintliga pantbrev', value: activeState.newHome.existingDeeds, field: 'newHome.existingDeeds' })}
            ${renderField({ id: 'renovation-cost', label: 'Renoveringskostnad', value: activeState.newHome.renovationCost, field: 'newHome.renovationCost' })}
            ${renderField({ id: 'other-costs', label: 'Övriga kostnader', value: activeState.newHome.otherCosts, field: 'newHome.otherCosts' })}
          </div>
        </section>

        <section class="card" aria-labelledby="assumptions-heading">
          <div class="section-header">
            <div>
              <h2 class="section-title" id="assumptions-heading">Antaganden</h2>
              <p class="section-copy">Justera antaganden och se effekten direkt.</p>
            </div>
          </div>
          <div class="field-stack">
            ${renderPercentField({ id: 'down-payment-percent', label: 'Kontantinsats', value: assumptions.downPaymentPercent, field: 'assumptions.downPaymentPercent' })}
            <label class="field" for="down-payment-slider">
              <span class="field__label">Kontantinsatsreglage (10–50 %)</span>
              <input
                class="field__range js-percent-range"
                id="down-payment-slider"
                type="range"
                min="10"
                max="50"
                step="0.5"
                value="${Math.min(Math.max(assumptions.downPaymentPercent, 10), 50)}"
                data-field="assumptions.downPaymentPercent"
              >
            </label>
            ${renderPercentField({ id: 'stamp-duty-percent', label: 'Lagfart', value: assumptions.stampDutyPercent, field: 'assumptions.stampDutyPercent' })}
            ${renderPercentField({ id: 'deed-percent', label: 'Pantbrev', value: assumptions.deedPercent, field: 'assumptions.deedPercent' })}
            <label class="field" for="broker-mode">
              <span class="field__label">Mäklararvode: regel</span>
              <select class="field__input field__input--select" id="broker-mode" data-field="assumptions.brokerFeeMode" data-kind="string">
                <option value="percent" ${assumptions.brokerFeeMode === 'percent' ? 'selected' : ''}>Procent av försäljningspris</option>
                <option value="fixed" ${assumptions.brokerFeeMode === 'fixed' ? 'selected' : ''}>Fast belopp</option>
              </select>
            </label>
            ${assumptions.brokerFeeMode === 'fixed'
              ? renderField({ id: 'broker-fee-fixed', label: 'Mäklararvode (kr)', value: assumptions.brokerFeeFixed, field: 'assumptions.brokerFeeFixed' })
              : renderPercentField({ id: 'broker-fee-percent', label: 'Mäklararvode (%)', value: assumptions.brokerFeePercent, field: 'assumptions.brokerFeePercent' })}
          </div>
        </section>

        ${renderPriceExplore(results)}

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
