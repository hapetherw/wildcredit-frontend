import numeral from "numeral";
import {BigNumber} from "bignumber.js";

export function formatPercentage(value) {

	if (isNaN(value) || !isFinite(value)) {
	  return 'N/A'
	}

	let formattedValue = this.formatNumber(value)

	return `${formattedValue}%`

}

export function formatNumber(n, precision = 2, fixedWidth = false) {
	if (isNaN(n)) {
		return '...'
	}
	// https://github.com/adamwdraper/Numeral-js/issues/512
	if (n != 0 && n < 1e-6) {
		return '<0.01'
	}

	let threshold = new BigNumber(1).dividedBy(10 ** precision)
	if (n == 0 || n >= threshold) {
		return numeral(n).format(precisionToFormat(precision, fixedWidth))
	} else {
		return `<${numeral(threshold).format(precisionToFormat(precision, fixedWidth))}`
	}
}

function precisionToFormat(precision, fixedWidth) {
	let format = "0,0"

	if (precision > 0) {
		if (fixedWidth) {
			format = "0,0."
		} else {
			format = "0,0.["
		}

		for(let i = 0; i < precision; i++) {
			format += "0"
		}

		if (!fixedWidth) {
			format += "]"
		}

	}

	return `${format}`
}

export function parseNaN(value) {
	return isNaN(value) ? 0 : value
}

export function moneyFormat(value, decimals = 2) {

	if (isNaN(value)) {
		return '...'
	}

	let threshold = new BigNumber(1).dividedBy(10 ** 2)

	if (value == 0 || value >= threshold) {
		return Math.abs(Number(value)) >= 1.0e+9

		? round(Math.abs(Number(value)) / 1.0e+9, decimals) + "B"
		: Math.abs(Number(value)) >= 1.0e+6

		? round(Math.abs(Number(value)) / 1.0e+6, decimals) + "M"
		: Math.abs(Number(value)) >= 1.0e+3

		? round(Math.abs(Number(value)) / 1.0e+3, decimals) + "k"
		: round(Math.abs(Number(value)), decimals);
	} else {
		return `<${numeral(threshold).format(precisionToFormat(decimals, false))}`
	}
}

function round(num, decimals) {
  return +(Math.round(num + `e+${decimals}`) + `e-${decimals}`)
}

export function formatDecimalLimit(decimals) {
	return new BigNumber(1).dividedBy(10 ** decimals).toString(10).substr(1)
}
