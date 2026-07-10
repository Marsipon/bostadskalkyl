import {
  DEED_FIXED_FEE,
  DEED_RATE,
  DEFAULT_BROKER_FEE_FIXED,
  DEFAULT_BROKER_FEE_MODE,
  DEFAULT_BROKER_FEE_RATE,
  DEFAULT_DEED_PERCENT,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_STAMP_DUTY_PERCENT,
  DOWN_PAYMENT_RATE,
  LOW_MARGIN_THRESHOLD,
  MAX_LOAN_TO_VALUE,
  PRICE_EXPLORE_STEPS,
  PRICE_SLIDER_MAX_FACTOR,
  PRICE_SLIDER_MIN_FACTOR,
  STAMP_DUTY_FIXED_FEE,
  STAMP_DUTY_RATE
} from './constants.js';
import { sanitizeNumber } from './utils.js';

function roundCurrency(value) {
  return Math.round(sanitizeNumber(value));
}

function toRate(percent, fallbackRate) {
  const normalizedPercent = sanitizeNumber(percent);
  if (normalizedPercent > 0) {
    return normalizedPercent / 100;
  }
  return fallbackRate;
}

function createExplanation({
  id,
  title,
  value,
  formula,
  inputs,
  assumptions = [],
  resultLabel = title,
  description = '',
  equation = '',
  references = [],
  learnMore = ''
}) {
  return {
    id,
    title,
    value,
    formula,
    resultLabel,
    inputs,
    assumptions,
    description,
    equation,
    references,
    learnMore
  };
}

function getStatusMeta(status) {
  if (status === 'short') {
    return { label: 'Saknar kapital', icon: '✕' };
  }
  if (status === 'tight') {
    return { label: 'Tight', icon: '⚠' };
  }
  return { label: 'Bra marginal', icon: '✓' };
}

export function calculateMortgage(loans = []) {
  return roundCurrency(loans.reduce((sum, loan) => sum + sanitizeNumber(loan.amount), 0));
}

export function calculateBrokerFee(
  marketValue,
  brokerFeePercent = DEFAULT_BROKER_FEE_RATE,
  brokerFeeMode = DEFAULT_BROKER_FEE_MODE,
  brokerFeeFixed = DEFAULT_BROKER_FEE_FIXED
) {
  const normalizedMarketValue = sanitizeNumber(marketValue);
  const normalizedMode = brokerFeeMode === 'fixed' ? 'fixed' : 'percent';

  if (normalizedMode === 'fixed') {
    return roundCurrency(sanitizeNumber(brokerFeeFixed));
  }

  return roundCurrency(normalizedMarketValue * (sanitizeNumber(brokerFeePercent) / 100));
}

export function calculateEquity(marketValue, totalMortgage) {
  return roundCurrency(sanitizeNumber(marketValue) - sanitizeNumber(totalMortgage));
}

export function calculateSaleCosts(brokerFee, saleTax = 0, otherCosts = 0) {
  return roundCurrency(sanitizeNumber(brokerFee) + sanitizeNumber(saleTax) + sanitizeNumber(otherCosts));
}

export function calculateSaleProceeds(marketValue, totalMortgage, saleCosts) {
  return roundCurrency(
    sanitizeNumber(marketValue) - sanitizeNumber(totalMortgage) - sanitizeNumber(saleCosts)
  );
}

export function calculateDownPayment(price, downPaymentPercent = DEFAULT_DOWN_PAYMENT_PERCENT) {
  return roundCurrency(sanitizeNumber(price) * toRate(downPaymentPercent, DOWN_PAYMENT_RATE));
}

export function calculateStampDuty(price, stampDutyPercent = DEFAULT_STAMP_DUTY_PERCENT) {
  const normalizedPrice = sanitizeNumber(price);
  const stampDutyRate = toRate(stampDutyPercent, STAMP_DUTY_RATE);
  return normalizedPrice > 0 ? roundCurrency(normalizedPrice * stampDutyRate + STAMP_DUTY_FIXED_FEE) : 0;
}

export function calculateBrokerNet(
  marketValue,
  totalMortgage,
  brokerFeePercent,
  saleTax = 0,
  saleOtherCosts = 0,
  brokerFeeMode = DEFAULT_BROKER_FEE_MODE,
  brokerFeeFixed = DEFAULT_BROKER_FEE_FIXED
) {
  const brokerFee = calculateBrokerFee(marketValue, brokerFeePercent, brokerFeeMode, brokerFeeFixed);
  const saleCosts = calculateSaleCosts(brokerFee, saleTax, saleOtherCosts);
  const saleProceeds = calculateSaleProceeds(marketValue, totalMortgage, saleCosts);
  return { brokerFee, saleCosts, saleProceeds };
}

export function calculatePantbrev(requiredLoan, existingDeeds, deedPercent = DEFAULT_DEED_PERCENT) {
  const normalizedLoan = sanitizeNumber(requiredLoan);
  const normalizedExistingDeeds = sanitizeNumber(existingDeeds);
  const deedRate = toRate(deedPercent, DEED_RATE);
  const newDeeds = Math.max(0, normalizedLoan - normalizedExistingDeeds);
  const cost = newDeeds > 0 ? roundCurrency(newDeeds * deedRate + DEED_FIXED_FEE) : 0;

  return {
    newDeeds: roundCurrency(newDeeds),
    cost
  };
}

export function calculateMaxLoan(price) {
  return roundCurrency(sanitizeNumber(price) * MAX_LOAN_TO_VALUE);
}

export function calculateLoanToValue(loanAmount, price) {
  const normalizedPrice = sanitizeNumber(price);

  if (normalizedPrice <= 0) {
    return 0;
  }

  return sanitizeNumber(loanAmount) / normalizedPrice;
}

export function calculateRemainingCapital(saleProceeds, requiredOwnCash) {
  return roundCurrency(sanitizeNumber(saleProceeds) - sanitizeNumber(requiredOwnCash));
}

function createPriceExplore({
  currentMarketValue,
  activePrice,
  renovationCost,
  otherCosts,
  existingDeeds,
  saleProceeds,
  assumptions
}) {
  const baseline = Math.max(1, sanitizeNumber(currentMarketValue), sanitizeNumber(activePrice));
  const min = roundCurrency(baseline * PRICE_SLIDER_MIN_FACTOR);
  const max = roundCurrency(baseline * PRICE_SLIDER_MAX_FACTOR);
  const span = Math.max(1, max - min);

  const samples = Array.from({ length: PRICE_EXPLORE_STEPS }, (_, index) => {
    const progress = PRICE_EXPLORE_STEPS === 1 ? 0 : index / (PRICE_EXPLORE_STEPS - 1);
    const samplePrice = roundCurrency(min + span * progress);
    const sample = calculatePurchasePlan({
      price: samplePrice,
      renovationCost,
      otherCosts,
      existingDeeds,
      saleProceeds,
      assumptions,
      currentMarketValue,
      includeExplore: false
    });
    const statusMeta = getStatusMeta(sample.status);

    return {
      price: samplePrice,
      status: sample.status,
      statusLabel: statusMeta.label,
      statusIcon: statusMeta.icon,
      capitalSurplus: sample.capitalSurplus,
      capitalMissing: sample.capitalMissing
    };
  });

  return {
    min,
    max,
    samples
  };
}

export function calculatePurchasePlan({
  price = 0,
  renovationCost = 0,
  otherCosts = 0,
  existingDeeds = 0,
  saleProceeds = 0,
  assumptions = {},
  currentMarketValue = 0,
  includeExplore = true
}) {
  const normalizedPrice = sanitizeNumber(price);
  const normalizedRenovationCost = sanitizeNumber(renovationCost);
  const normalizedOtherCosts = sanitizeNumber(otherCosts);
  const normalizedSaleProceeds = sanitizeNumber(saleProceeds);
  const normalizedExistingDeeds = sanitizeNumber(existingDeeds);
  const downPaymentPercent = sanitizeNumber(assumptions.downPaymentPercent) || DEFAULT_DOWN_PAYMENT_PERCENT;
  const stampDutyPercent = sanitizeNumber(assumptions.stampDutyPercent) || DEFAULT_STAMP_DUTY_PERCENT;
  const deedPercent = sanitizeNumber(assumptions.deedPercent) || DEFAULT_DEED_PERCENT;
  const stampDuty = calculateStampDuty(normalizedPrice, stampDutyPercent);

  let pantbrev = { newDeeds: 0, cost: 0 };
  let requiredLoan = 0;
  let totalCost = 0;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    totalCost = roundCurrency(
      normalizedPrice + normalizedRenovationCost + normalizedOtherCosts + stampDuty + pantbrev.cost
    );
    requiredLoan = Math.max(0, totalCost - normalizedSaleProceeds);

    const nextPantbrev = calculatePantbrev(requiredLoan, normalizedExistingDeeds, deedPercent);
    if (nextPantbrev.newDeeds === pantbrev.newDeeds && nextPantbrev.cost === pantbrev.cost) {
      pantbrev = nextPantbrev;
      totalCost = roundCurrency(
        normalizedPrice + normalizedRenovationCost + normalizedOtherCosts + stampDuty + pantbrev.cost
      );
      requiredLoan = Math.max(0, totalCost - normalizedSaleProceeds);
      break;
    }

    pantbrev = nextPantbrev;
  }

  const maxLoan = calculateMaxLoan(normalizedPrice);
  const loanToValue = calculateLoanToValue(requiredLoan, normalizedPrice);
  const downPayment = calculateDownPayment(normalizedPrice, downPaymentPercent);
  const requiredOwnCash = Math.max(0, totalCost - maxLoan);
  const remainingCapital = calculateRemainingCapital(normalizedSaleProceeds, requiredOwnCash);
  const capitalMissing = Math.max(0, requiredLoan - maxLoan);
  const capitalSurplus = Math.max(0, remainingCapital);
  const status = capitalMissing > 0 ? 'short' : capitalSurplus <= LOW_MARGIN_THRESHOLD ? 'tight' : 'good';

  const explanations = {
    downPayment: createExplanation({
      id: 'downPayment',
      title: 'Kontantinsats',
      value: downPayment,
      formula: 'Pris × kontantinsats %',
      equation: 'Pris × downPaymentPercent = Kontantinsats',
      description: 'Kontantinsatsen är det egna kapital du måste sätta in för att köpa bostaden. Den beräknas som en procent av köpeskillingen.',
      inputs: [
        { name: 'Pris', value: normalizedPrice, operator: '=' },
        { name: 'Kontantinsats', value: downPaymentPercent, unit: '%', operator: '×' }
      ],
      assumptions: [{ label: 'Kontantinsats', value: downPaymentPercent, unit: '%' }],
      learnMore: 'Högre kontantinsats minskar belåningsgraden och kan ge bättre lånevillkor.'
    }),
    requiredOwnCash: createExplanation({
      id: 'requiredOwnCash',
      title: 'Krävt eget kapital',
      value: roundCurrency(requiredOwnCash),
      formula: 'Totalkostnad - maxlån (85 % av pris)',
      equation: 'Totalkostnad - (Pris × 0.85) = Krävt eget kapital',
      description: 'Det minsta eget kapital du behöver för att hålla dig inom 85% belåningsgrad.',
      inputs: [
        { name: 'Totalkostnad', value: totalCost, operator: '=' },
        { name: 'Maxlån', value: maxLoan, operator: '-' }
      ],
      assumptions: [{ label: 'Max belåningsgrad', value: MAX_LOAN_TO_VALUE * 100, unit: '%' }],
      learnMore: 'Svenska banker lånar normalt inte mer än 85% av köpeskillingen utan extraordinär försäkring.'
    }),
    requiredLoan: createExplanation({
      id: 'requiredLoan',
      title: 'Nytt bolån',
      value: roundCurrency(requiredLoan),
      formula: 'Totalkostnad - likvid efter försäljning',
      equation: 'Totalkostnad - Likvid = Nytt bolån',
      description: 'Det totala belopp du behöver låna för att genomföra köpet.',
      inputs: [
        { name: 'Totalkostnad', value: totalCost, operator: '=' },
        { name: 'Likvid efter försäljning', value: normalizedSaleProceeds, operator: '-' }
      ],
      learnMore: 'Detta är summan av alla kostnader minus det du får in från försäljningen av din nuvarande bostad.'
    }),
    loanToValue: createExplanation({
      id: 'loanToValue',
      title: 'Belåningsgrad',
      value: loanToValue,
      formula: 'Nytt bolån / pris',
      equation: 'Nytt bolån / Pris = Belåningsgrad',
      description: 'Visar hur stor del av köpeskillingen som är lånad. Långivare kräver ofta att denna ligger under 85%.',
      inputs: [
        { name: 'Nytt bolån', value: roundCurrency(requiredLoan), operator: '=' },
        { name: 'Pris', value: normalizedPrice, operator: '/' }
      ],
      learnMore: 'En låg belåningsgrad är attraktivt för långivare och kan ge bättre räntevillkor.'
    }),
    totalCost: createExplanation({
      id: 'totalCost',
      title: 'Totalkostnad för ny bostad',
      value: totalCost,
      formula: 'Pris + renovering + övrigt + lagfart + pantbrev',
      equation: 'Pris + Renovering + Övrigt + Lagfart + Pantbrev = Totalkostnad',
      description: 'Alla kostnader förknippade med köpet av den nya bostaden.',
      inputs: [
        { name: 'Pris', value: normalizedPrice, operator: '=' },
        { name: 'Renovering', value: normalizedRenovationCost, operator: '+' },
        { name: 'Övriga kostnader', value: normalizedOtherCosts, operator: '+' },
        { name: 'Lagfart', value: stampDuty, operator: '+' },
        { name: 'Pantbrevskostnad', value: pantbrev.cost, operator: '+' }
      ],
      assumptions: [
        { label: 'Lagfart', value: stampDutyPercent, unit: '%' },
        { label: 'Pantbrev', value: deedPercent, unit: '%' }
      ],
      learnMore: 'Inkluderar köpeskillingen plus alla utgifter för övergång av fastigheten.'
    })
  };

  const result = {
    totalCost,
    stampDuty,
    downPayment,
    maxLoan,
    requiredLoan: roundCurrency(requiredLoan),
    loanToValue,
    requiredOwnCash: roundCurrency(requiredOwnCash),
    remainingCapital,
    capitalMissing: roundCurrency(capitalMissing),
    capitalSurplus: roundCurrency(capitalSurplus),
    status,
    pantbrev,
    explanations
  };

  if (includeExplore) {
    result.priceExplore = createPriceExplore({
      currentMarketValue,
      activePrice: normalizedPrice,
      renovationCost: normalizedRenovationCost,
      otherCosts: normalizedOtherCosts,
      existingDeeds: normalizedExistingDeeds,
      saleProceeds: normalizedSaleProceeds,
      assumptions
    });
  }

  return result;
}

export function calculateScenario(state) {
  const currentHome = state?.currentHome ?? {};
  const sale = state?.sale ?? {};
  const newHome = state?.newHome ?? {};
  const assumptions = state?.assumptions ?? {};
  const brokerFeeMode = assumptions.brokerFeeMode === 'fixed' ? 'fixed' : 'percent';
  const brokerFeePercent = sanitizeNumber(assumptions.brokerFeePercent) || sanitizeNumber(currentHome.brokerFeePercent) || DEFAULT_BROKER_FEE_RATE;
  const brokerFeeFixed = sanitizeNumber(assumptions.brokerFeeFixed) || DEFAULT_BROKER_FEE_FIXED;
  const salePrice = sanitizeNumber(sale.expectedPrice) || sanitizeNumber(currentHome.marketValue);
  const saleTax = sanitizeNumber(sale.tax);
  const saleOtherCosts = sanitizeNumber(sale.otherCosts);

  const totalMortgage = calculateMortgage(currentHome.loans);
  const equity = calculateEquity(currentHome.marketValue, totalMortgage);
  const { brokerFee, saleCosts, saleProceeds } = calculateBrokerNet(
    salePrice,
    totalMortgage,
    brokerFeePercent,
    saleTax,
    saleOtherCosts,
    brokerFeeMode,
    brokerFeeFixed
  );
  const purchasePlan = calculatePurchasePlan({
    price: newHome.price,
    renovationCost: newHome.renovationCost,
    otherCosts: newHome.otherCosts,
    existingDeeds: newHome.existingDeeds,
    saleProceeds,
    assumptions,
    currentMarketValue: currentHome.marketValue
  });

  const explanations = {
    equity: createExplanation({
      id: 'equity',
      title: 'Eget kapital',
      value: equity,
      formula: 'Nuvarande bostadsvärde - bolån',
      equation: 'Marknadsvärde - Totalt bolån = Eget kapital',
      description: 'Det värde du äger av din nuvarande bostad efter att du betalar av dina lån.',
      inputs: [
        { name: 'Marknadsvärde', value: sanitizeNumber(currentHome.marketValue), operator: '=' },
        { name: 'Totalt bolån idag', value: totalMortgage, operator: '-' }
      ],
      learnMore: 'Ditt eget kapital är skillnaden mellan vad bostaden är värd och vad du är skyldig på den.'
    }),
    saleProceeds: createExplanation({
      id: 'saleProceeds',
      title: 'Likvid efter försäljning',
      value: saleProceeds,
      formula: 'Försäljningspris - bolån - försäljningskostnader',
      equation: 'Försäljningspris - Totalt bolån - Försäljningskostnader = Likvid',
      description: 'Pengarna du får när du säljer din nuvarande bostad, efter att ha betalt av lånen och mäklararvoden.',
      inputs: [
        { name: 'Försäljningspris', value: salePrice, operator: '=' },
        { name: 'Totalt bolån idag', value: totalMortgage, operator: '-' },
        { name: 'Försäljningskostnader', value: saleCosts, operator: '-' }
      ],
      assumptions: [
        brokerFeeMode === 'fixed'
          ? { label: 'Mäklararvode (fast)', value: brokerFeeFixed }
          : { label: 'Mäklararvode', value: brokerFeePercent, unit: '%' }
      ],
      learnMore: 'Denna likvid kan du använda som eget kapital eller kontantinsats för att köpa en ny bostad.'
    }),
    saleCosts: createExplanation({
      id: 'saleCosts',
      title: 'Försäljningskostnader',
      value: saleCosts,
      formula: 'Mäklararvode + skatt + övriga försäljningskostnader',
      equation: 'Mäklararvode + Skatt + Övriga kostnader = Försäljningskostnader',
      description: 'Alla kostnader du måste betala när du säljer din nuvarande bostad.',
      inputs: [
        { name: 'Mäklararvode', value: brokerFee, operator: '=' },
        { name: 'Skatt', value: saleTax, operator: '+' },
        { name: 'Övriga kostnader', value: saleOtherCosts, operator: '+' }
      ],
      assumptions: [
        brokerFeeMode === 'fixed'
          ? { label: 'Mäklararvode (fast)', value: brokerFeeFixed }
          : { label: 'Mäklararvode', value: brokerFeePercent, unit: '%' }
      ],
      learnMore: 'Mäklaren tar normalt 2-3% av försäljningspriset, plus eventuell skatt på vinsten om den är stor.'
    }),
    brokerFee: createExplanation({
      id: 'brokerFee',
      title: 'Mäklararvode',
      value: brokerFee,
      formula: brokerFeeMode === 'fixed' ? 'Fast arvode' : 'Försäljningspris × mäklararvode %',
      equation: brokerFeeMode === 'fixed' ? 'Fast belopp' : 'Försäljningspris × mäklararvode% = Mäklararvode',
      description: 'Ersättning till fastighetsmäklaren för att sälja din nuvarande bostad.',
      inputs: brokerFeeMode === 'fixed'
        ? [{ name: 'Fast arvode', value: brokerFeeFixed, operator: '=' }]
        : [
          { name: 'Försäljningspris', value: salePrice, operator: '=' },
          { name: 'Mäklararvode', value: brokerFeePercent, unit: '%', operator: '×' }
        ],
      assumptions: [{ label: 'Regel', value: brokerFeeMode === 'fixed' ? 'Fast belopp' : 'Procent av försäljningspris' }],
      learnMore: 'Du kan förhandla om mäklarens provision. De flesta tar 2-3% av försäljningspriset.'
    }),
    ...purchasePlan.explanations
  };

  return {
    salePrice,
    totalMortgage,
    equity,
    brokerFee,
    saleCosts,
    saleProceeds,
    ...purchasePlan,
    explanation: {
      assumptions: {
        downPaymentPercent: sanitizeNumber(assumptions.downPaymentPercent) || DEFAULT_DOWN_PAYMENT_PERCENT,
        stampDutyPercent: sanitizeNumber(assumptions.stampDutyPercent) || DEFAULT_STAMP_DUTY_PERCENT,
        deedPercent: sanitizeNumber(assumptions.deedPercent) || DEFAULT_DEED_PERCENT,
        brokerFeeMode,
        brokerFeePercent,
        brokerFeeFixed
      },
      chain: ['saleCosts', 'saleProceeds', 'equity', 'downPayment', 'requiredOwnCash', 'requiredLoan', 'loanToValue'],
      steps: explanations
    }
  };
}

/**
 * Calculate maximum house price given target capital remaining
 * Backwards calculation from goal
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.targetCapital - Desired remaining capital after purchase
 * @param {number} params.saleProceeds - Total cash available from current sale
 * @param {number} params.downPaymentPercent - Down payment percentage (0-100)
 * @param {number} params.stampDutyPercent - Stamp duty percentage (0-100)
 * @param {number} params.deedPercent - Deed percentage (0-100)
 * @param {number} params.brokerFeePercent - Broker fee percentage (0-100)
 * @returns {number} Maximum house price affordable with target capital goal (0 if calculation invalid)
 */
/**
 * Calculate maximum house price affordable given a goal remaining capital
 * after selling old home and buying new one.
 * 
 * Broker fee for old home sale is already deducted from saleProceeds,
 * so we only include purchase costs (stamp duty and deed) for the new home.
 */
export function calculateMaxPriceFromGoal({ targetCapital, saleProceeds, downPaymentPercent, stampDutyPercent, deedPercent }) {
  const downPaymentRate = toRate(downPaymentPercent, DOWN_PAYMENT_RATE);
  
  // Available capital for down payment and costs
  // targetCapital = saleProceeds - existingMortgage - totalCosts - (newPrice * downPaymentRate)
  // Solving for newPrice:
  // newPrice = (saleProceeds - existingMortgage - targetCapital) / (downPaymentRate + costRate)
  
  // Convert all percentages to decimal rates
  // Note: brokerFee applies to OLD home sale (already in saleProceeds), not new purchase
  const costRate = (stampDutyPercent / 100) + (deedPercent / 100);
  const denominator = downPaymentRate + costRate;
  
  // Edge case: if denominator is 0 or negative, we cannot calculate a valid price
  // Return 0 to indicate no valid purchase price can be calculated
  if (denominator <= 0) {
    return 0;
  }
  
  const availableCapital = Math.max(0, saleProceeds - targetCapital);
  const maxPrice = availableCapital / denominator;
  
  return roundCurrency(maxPrice);
}

/**
 * Calculate minimum sale price needed to reach goal
 * 
 * Formula: If you need X cash after paying broker fees:
 *   salePrice * (1 - brokerFeeRate) = totalNeeded
 *   salePrice = totalNeeded / (1 - brokerFeeRate)
 */
export function calculateMinSalePriceFromGoal({ targetCapital, newDownPayment, totalCostsForNew, existingMortgage }) {
  // targetCapital = saleProceedsFromOld - brokerFeeOnSale - capitalGainsTax
  // For simplicity: we estimate only broker fee, ignore tax
  // We need: salePrice * (1 - brokerFeeRate) >= targetCapital + newDownPayment + newCosts + existingMortgage
  
  // Estimate: needed cash = target + new down payment + new costs + pay off existing
  const neededCash = targetCapital + newDownPayment + totalCostsForNew;
  
  // If we have existing mortgage to pay off, add it
  const totalNeeded = neededCash + existingMortgage;
  
  // Typical broker fee for selling is ~2%
  const brokerFeeRate = 0.02;
  
  // To get totalNeeded after paying broker fees: salePrice * (1 - 0.02) = totalNeeded
  const minSalePrice = totalNeeded / (1 - brokerFeeRate);
  
  return roundCurrency(minSalePrice);
}
