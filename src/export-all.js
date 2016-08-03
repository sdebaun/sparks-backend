import {generateEmailRecords} from './exporting'

generateEmailRecords(process.env.FIREBASE_HOST)
.then(rows => {
  rows.map(row => console.log(row))
  process.exit()
})
.catch(err => console.log(err))

