import braintree from 'braintree-node'

export default function(cfg) {
  let gateway

  this.add('role:braintree,cmd:generateClientToken', async function() {
    const clientToken = await gateway.generateClientToken()
    return {clientToken}
  })

  this.add('role:braintree,cmd:createTransaction', async function({amount, nonce}) {
    return await gateway.createTransaction({
      amount,
      paymentMethodNonce: nonce,
    }, {
      submitForSettlement: true,
    })
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
