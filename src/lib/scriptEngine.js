/* istanbul ignore file */
const MLNumber = require('@mojaloop/ml-number')
const Transaction = require('../../src/domain/transactions/index')
const BigNumber = require('bignumber.js')

const getTransferFromCentralLedger = async (transferId) => {
  const entity = await Transaction.getById(transferId)
  if (entity) {
    const transferObject = await Transaction.getTransactionObject(entity[0].value)
    return transferObject
  }
}

const execute = async function (script, payload) {
  const transfer = await getTransferFromCentralLedger(payload.id)
  const ledgerEntries = []

  const sandbox = {
    payload,
    log: function (message) {
      console.log(message)
    },
    transfer,
    multiply (number1, number2, decimalPlaces) {
      const result = new MLNumber(number1).multiply(number2).toFixed(decimalPlaces, BigNumber.ROUND_HALF_UP)
      return result
    },
    getExtensionValue (list, key) {
      return list.find((extension) => {
        return extension.key === key
      }).value
    },
    addLedgerEntry: function (transferId, ledgerAccountTypeId, ledgerEntryTypeId, amount, currency, payerFspId, payeeFspId) {
      ledgerEntries.push({
        transferId,
        ledgerAccountTypeId,
        ledgerEntryTypeId,
        amount,
        currency,
        payerFspId,
        payeeFspId
      })
    }
  }

  try {
    script.runInNewContext(sandbox, { timeout: 100 })

    return { ledgerEntries }
  } catch (err) {
    console.error('Error in user script')
    console.error(err)
  }
}

module.exports = {
  execute
}
