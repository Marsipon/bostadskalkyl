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

function createExplanation({ id, title, value, formula, inputs, assumptions = [], resultLabel = title }) {
  return {
    id,
    title,
    value,
    formula,
    resultLabel,
    inputs,
    assumptions
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
      inputs: [
        { name: 'Pris', value: normalizedPrice, operator: '=' },
        { name: 'Kontantinsats', value: downPaymentPercent, unit: '%', operator: '×' }
      ],
      assumptions: [{ label: 'Kontantinsats', value: downPaymentPercent, unit: '%' }]
    }),
    requiredOwnCash: createExplanation({
      id: 'requiredOwnCash',
      title: 'Krävt eget kapital',
      value: roundCurrency(requiredOwnCash),
      formula: 'Totalkostnad - maxlån (85 % av pris)',
      inputs: [
        { name: 'Totalkostnad', value: totalCost, operator: '=' },
        { name: 'Maxlån', value: maxLoan, operator: '-' }
      ],
      assumptions: [{ label: 'Max belåningsgrad', value: MAX_LOAN_TO_VALUE * 100, unit: '%' }]
    }),
    requiredLoan: createExplanation({
      id: 'requiredLoan',
      title: 'Nytt bolån',
      value: roundCurrency(requiredLoan),
      formula: 'Totalkostnad - likvid efter försäljning',
      inputs: [
        { name: 'Totalkostnad', value: totalCost, operator: '=' },
        { name: 'Likvid efter försäljning', value: normalizedSaleProceeds, operator: '-' }
      ]
    }),
    loanToValue: createExplanation({
      id: 'loanToValue',
      title: 'Belåningsgrad',
      value: loanToValue,
      formula: 'Nytt bolån / pris',
      inputs: [
        { name: 'Nytt bolån', value: roundCurrency(requiredLoan), operator: '=' },
        { name: 'Pris', value: normalizedPrice, operator: '/' }
      ]
    }),
    totalCost: createExplanation({
      id: 'totalCost',
      title: 'Totalkostnad för ny bostad',
      value: totalCost,
      formula: 'Pris + renovering + övrigt + lagfart + pantbrev',
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
      ]
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
      inputs: [
        { name: 'Marknadsvärde', value: sanitizeNumber(currentHome.marketValue), operator: '=' },
        { name: 'Totalt bolån idag', value: totalMortgage, operator: '-' }
      ]
    }),
    saleProceeds: createExplanation({
      id: 'saleProceeds',
      title: 'Likvid efter försäljning',
      value: saleProceeds,
      formula: 'Försäljningspris - bolån - försäljningskostnader',
      inputs: [
        { name: 'Försäljningspris', value: salePrice, operator: '=' },
        { name: 'Totalt bolån idag', value: totalMortgage, operator: '-' },
        { name: 'Försäljningskostnader', value: saleCosts, operator: '-' }
      ],
      assumptions: [
        brokerFeeMode === 'fixed'
          ? { label: 'Mäklararvode (fast)', value: brokerFeeFixed }
          : { label: 'Mäklararvode', value: brokerFeePercent, unit: '%' }
      ]
    }),
    saleCosts: createExplanation({
      id: 'saleCosts',
      title: 'Försäljningskostnader',
      value: saleCosts,
      formula: 'Mäklararvode + skatt + övriga försäljningskostnader',
      inputs: [
        { name: 'Mäklararvode', value: brokerFee, operator: '=' },
        { name: 'Skatt', value: saleTax, operator: '+' },
        { name: 'Övriga kostnader', value: saleOtherCosts, operator: '+' }
      ],
      assumptions: [
        brokerFeeMode === 'fixed'
          ? { label: 'Mäklararvode (fast)', value: brokerFeeFixed }
          : { label: 'Mäklararvode', value: brokerFeePercent, unit: '%' }
      ]
    }),
    brokerFee: createExplanation({
      id: 'brokerFee',
      title: 'Mäklararvode',
      value: brokerFee,
      formula: brokerFeeMode === 'fixed' ? 'Fast arvode' : 'Försäljningspris × mäklararvode %',
      inputs: brokerFeeMode === 'fixed'
        ? [{ name: 'Fast arvode', value: brokerFeeFixed, operator: '=' }]
        : [
          { name: 'Försäljningspris', value: salePrice, operator: '=' },
          { name: 'Mäklararvode', value: brokerFeePercent, unit: '%', operator: '×' }
        ],
      assumptions: [{ label: 'Regel', value: brokerFeeMode === 'fixed' ? 'Fast belopp' : 'Procent av försäljningspris' }]
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
