import braintree from 'braintree-node'

export default function(cfg) {
  let gateway

  this.add('role:gateway,cmd:generateClientToken', async function() {
    return await gateway.generateClientToken()
  })

  this.add('role:gateway,cmd:createTransaction', async function({amount, nonce}) {
    const result = await gateway.createTransaction({
      amount,
      paymentMethodNonce: nonce,
    }, {
      submitForSettlement: true,
    })

    console.log('braintree result:', result.success, result.transaction.status)

    return result
  })

  this.add('init:braintree', function() {
    gateway = braintree({
      environment: cfg.BT_ENVIRONMENT,
      merchantId: cfg.BT_MERCHANT_ID,
      publicKey: cfg.BT_PUBLIC_KEY,
      privateKey: cfg.BT_PRIVATE_KEY,
    })
  })

  return 'braintree'
}
