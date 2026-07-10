import { formatCurrency, escapeHtml } from './utils.js';

/**
 * Represents an explanation for a calculation result
 * @param {string} resultId - Unique identifier for the result
 * @param {string} title - Human-readable title of the result
 * @param {string} formula - Formula description
 * @param {Array} inputs - Array of calculation inputs
 * @param {number} result - The calculated result value
 * @param {string} description - Optional description of what this result means
 * @returns {Object} Explanation object with all details
 */
export function createResultExplanation(resultId, title, formula, inputs, result, description = '') {
  return {
    resultId,
    title,
    formula,
    inputs, // Array of {operator, name, value}
    result,
    description
  };
}

/**
 * Renders clickable currency value
 * @param {number} value - The currency value to display
 * @param {string} resultId - Unique identifier for this result
 * @param {string} className - Additional CSS class name
 * @returns {string} HTML string for clickable value
 */
export function renderClickableValue(value, resultId, className = '') {
  const formattedValue = formatCurrency(value);
  return `
    <span 
      class="result-value ${className}" 
      data-result-id="${escapeHtml(resultId)}"
      role="button"
      tabindex="0"
      title="Klicka för att se hur detta räknades ut"
    >
      ${formattedValue}
    </span>
  `;
}

/**
 * Renders an explanation modal/popover
 * @param {Object} explanation - The explanation object with formula and inputs
 * @returns {string} HTML string for the explanation modal
 */
export function renderExplanationModal(explanation) {
  const formulaHtml = `
    <div class="explanation-formula">
      ${explanation.inputs.map((input) => `
        <div class="explanation-formula__line">
          <span class="explanation-formula__operator">${escapeHtml(input.operator || '=')}</span>
          <span class="explanation-formula__value">${escapeHtml(input.name)}: ${formatValueForExplanation(input.value)}</span>
        </div>
      `).join('')}
      <div class="explanation-formula__line explanation-formula__result">
        <span class="explanation-formula__operator">=</span>
        <span class="explanation-formula__value">${escapeHtml(explanation.title)}: ${formatCurrency(explanation.result)}</span>
      </div>
    </div>
  `;

  const descriptionHtml = explanation.description
    ? `<p class="section-copy"><em>${escapeHtml(explanation.description)}</em></p>`
    : '';

  return `
    <div class="explanation-modal" data-modal-for="${escapeHtml(explanation.resultId)}">
      <div class="explanation-modal__content">
        <button class="explanation-modal__close" type="button" aria-label="Stäng förklaring">
          ✕
        </button>
        <h2 class="section-title">${escapeHtml(explanation.title)}</h2>
        <p class="section-copy">
          <strong>${formatCurrency(explanation.result)}</strong>
        </p>
        ${descriptionHtml}
        <h3 class="subsection-title">Så räknades det ut:</h3>
        ${formulaHtml}
      </div>
    </div>
  `;
}

/**
 * Helper to format values in explanations
 */
function formatValueForExplanation(value) {
  if (typeof value === 'string') {
    return escapeHtml(value);
  }
  if (typeof value === 'number') {
    return formatCurrency(value);
  }
  return String(value);
}

/**
 * Get explanation for a specific result
 * @param {string} resultId - The ID of the result to explain
 * @param {Object} results - The full results object with calculation data
 * @returns {Object|null} Explanation object or null if no explanation exists
 */
export function getExplanationForResult(resultId, results) {
  // Map result IDs to their explanations
  const explanations = {
    capitalSurplus: createResultExplanation(
      'capitalSurplus',
      'Eget kapital kvar',
      'Försäljningsintäkter - (Lånebeloppet + Kostnader)',
      [
        { operator: '+', name: 'Försäljningsintäkter', value: results.saleProceeds || 0 },
        { operator: '-', name: 'Lånebeloppet', value: results.totalMortgage || 0 },
        { operator: '-', name: 'Transaktionskostnader', value: results.totalCost || 0 },
      ],
      results.capitalSurplus || 0,
      'Detta är pengarna som blir över efter att du köpt den nya bostaden och betalat av den gamla.'
    ),
    downPayment: createResultExplanation(
      'downPayment',
      'Kontantinsats (kr)',
      'Köpeskilling × (Kontantinsats %)',
      [
        { operator: '×', name: 'Köpeskilling', value: results.newHome?.price || 0 },
        { operator: '×', name: 'Kontantinsats %', value: results.downPaymentPercent || 0 },
      ],
      results.downPayment || 0,
      'Kontantinsatsen är den del av bostaden som du betalar själv utan lån.'
    ),
    requiredLoan: createResultExplanation(
      'requiredLoan',
      'Lånebeloppet',
      'Köpeskilling - Kontantinsats',
      [
        { operator: '', name: 'Köpeskilling', value: results.newHome?.price || 0 },
        { operator: '-', name: 'Kontantinsats', value: results.downPayment || 0 },
      ],
      results.requiredLoan || 0,
      'Lånebeloppet är det belopp som banken lånar ut för att du ska kunna köpa bostaden.'
    ),
    totalCost: createResultExplanation(
      'totalCost',
      'Transaktionskostnader',
      'Lagfart + Pantbrev + Mäklararvode',
      [
        { operator: '+', name: 'Lagfart', value: results.stampDuty || 0 },
        { operator: '+', name: 'Pantbrev', value: results.pantbrev?.cost || 0 },
        { operator: '+', name: 'Mäklararvode', value: results.brokerFee || 0 },
      ],
      results.totalCost || 0,
      'Detta är de kostnader som uppstår när du köper en ny bostad och säljer den gamla.'
    ),
  };

  return explanations[resultId];
}
