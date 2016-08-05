
declare module "sendgrid" {
  interface Email {
    addTo(to:string):void
    subject:string
    from:string
    html:string
    addFilter(filter:string, name:string, value:any):void
    addSubstitution(name:string, value:any):void
    setSendAt(sendAt:Date):void
    setFromName(name:string):void
  }

  interface EmailStatic {
    new():Email
  }

  interface SendGrid {
    send(email:any, callback:(err:any, json:any) => void): void
    Email:EmailStatic
  }

  type sendgrid = (key:string) => SendGrid

  var sg: sendgrid
  export = sg
}
