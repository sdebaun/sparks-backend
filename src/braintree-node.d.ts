
declare module "braintree-node" {
  interface Gateway {
  }

  interface Options {
  }

  type braintree = (options:Options) => Gateway

  var b: braintree
  export = b
}
