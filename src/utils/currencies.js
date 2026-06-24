import cc from 'currency-codes';
import getSymbolFromCurrency from 'currency-symbol-map';

export const CURRENCIES = cc.data.map(curr => {
  const symbol = getSymbolFromCurrency(curr.code) || curr.code;
  return {
    code: curr.code,
    symbol: symbol,
    label: `${curr.currency} (${symbol})`
  };
});
