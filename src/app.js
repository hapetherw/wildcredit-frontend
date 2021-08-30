import "core-js/stable";
import "regenerator-runtime/runtime";
import '@riotjs/hot-reload'
import { component, install } from 'riot'

import Main from './components/main/index.riot'
import { formatDecimalLimit, formatNumber, formatPercentage, moneyFormat } from "./common/helpers/NumberFormatting";

install(c => {
    c.formatNumber = formatNumber
    c.formatPercentage = formatPercentage
    c.moneyFormat = moneyFormat

    c.formatSafetyRatio= function(r) {
        if (formatNumber(r) == 1.0) {
            return '-'
        } else if (r.isGreaterThan(99)) {
            return '>99'
        } else {
            return formatNumber(r)
        }
    }

    c.activateFullFeatures = function() {
        return false
    }

    c.xWildEnabled = function() {
        return true
    }

    c.farmingEnabled = function () {
        return true
    }

    c.formatDecimalLimit = formatDecimalLimit
})

component(Main)(document.getElementById('app'), {})
