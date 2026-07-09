import {
  DEED_FIXED_FEE,
  DEED_RATE,
  DEFAULT_BROKER_FEE_RATE,
  DOWN_PAYMENT_RATE,
  LOW_MARGIN_THRESHOLD,
  MAX_LOAN_TO_VALUE,
  STAMP_DUTY_FIXED_FEE,
  STAMP_DUTY_RATE
} from './constants.js';
import { sanitizeNumber } from './utils.js';

function roundCurrency(value) {
  return Math.round(sanitizeNumber(value));
}

export function calculateMortgage(loans = []) {
  return roundCurrency(loans.reduce((sum, loan) => sum + sanitizeNumber(loan.amount), 0));
}

export function calculateBrokerFee(marketValue, brokerFeePercent = DEFAULT_BROKER_FEE_RATE) {
  return roundCurrency(sanitizeNumber(marketValue) * (sanitizeNumber(brokerFeePercent) / 100));
}

export function calculateEquity(marketValue, totalMortgage) {
  return roundCurrency(sanitizeNumber(marketValue) - sanitizeNumber(totalMortgage));
}

export function calculateSaleProceeds(marketValue, totalMortgage, brokerFee) {
  return roundCurrency(
    sanitizeNumber(marketValue) - sanitizeNumber(totalMortgage) - sanitizeNumber(brokerFee)
  );
}

export function calculateDownPayment(price) {
  return roundCurrency(sanitizeNumber(price) * DOWN_PAYMENT_RATE);
}

export function calculateStampDuty(price) {
  const normalizedPrice = sanitizeNumber(price);
  return normalizedPrice > 0 ? roundCurrency(normalizedPrice * STAMP_DUTY_RATE + STAMP_DUTY_FIXED_FEE) : 0;
}

export function calculateBrokerNet(marketValue, totalMortgage, brokerFeePercent) {
  const brokerFee = calculateBrokerFee(marketValue, brokerFeePercent);
  const saleProceeds = calculateSaleProceeds(marketValue, totalMortgage, brokerFee);
  return { brokerFee, saleProceeds };
}

export function calculatePantbrev(requiredLoan, existingDeeds) {
  const normalizedLoan = sanitizeNumber(requiredLoan);
  const normalizedExistingDeeds = sanitizeNumber(existingDeeds);
  const newDeeds = Math.max(0, normalizedLoan - normalizedExistingDeeds);
  const cost = newDeeds > 0 ? roundCurrency(newDeeds * DEED_RATE + DEED_FIXED_FEE) : 0;

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

export function calculatePurchasePlan({
  price = 0,
  renovationCost = 0,
  otherCosts = 0,
  existingDeeds = 0,
  saleProceeds = 0
}) {
  const normalizedPrice = sanitizeNumber(price);
  const normalizedRenovationCost = sanitizeNumber(renovationCost);
  const normalizedOtherCosts = sanitizeNumber(otherCosts);
  const normalizedSaleProceeds = sanitizeNumber(saleProceeds);
  const stampDuty = calculateStampDuty(normalizedPrice);

  let pantbrev = { newDeeds: 0, cost: 0 };
  let requiredLoan = 0;
  let totalCost = 0;

  for (let iteration = 0; iteration < 5; iteration += 1) {
    totalCost = roundCurrency(
      normalizedPrice + normalizedRenovationCost + normalizedOtherCosts + stampDuty + pantbrev.cost
    );
    requiredLoan = Math.max(0, totalCost - normalizedSaleProceeds);

    const nextPantbrev = calculatePantbrev(requiredLoan, existingDeeds);
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
  const downPayment = calculateDownPayment(normalizedPrice);
  const requiredOwnCash = Math.max(0, totalCost - maxLoan);
  const remainingCapital = calculateRemainingCapital(normalizedSaleProceeds, requiredOwnCash);
  const capitalMissing = Math.max(0, requiredLoan - maxLoan);
  const capitalSurplus = Math.max(0, remainingCapital);
  const status = capitalMissing > 0 ? 'short' : capitalSurplus <= LOW_MARGIN_THRESHOLD ? 'tight' : 'good';

  return {
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
    pantbrev
  };
}

export function calculateScenario(state) {
  const currentHome = state?.currentHome ?? {};
  const newHome = state?.newHome ?? {};
  const totalMortgage = calculateMortgage(currentHome.loans);
  const equity = calculateEquity(currentHome.marketValue, totalMortgage);
  const { brokerFee, saleProceeds } = calculateBrokerNet(
    currentHome.marketValue,
    totalMortgage,
    currentHome.brokerFeePercent
  );
  const purchasePlan = calculatePurchasePlan({
    price: newHome.price,
    renovationCost: newHome.renovationCost,
    otherCosts: newHome.otherCosts,
    existingDeeds: newHome.existingDeeds,
    saleProceeds
  });

  return {
    totalMortgage,
    equity,
    brokerFee,
    saleProceeds,
    ...purchasePlan
  };
}
