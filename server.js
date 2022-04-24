const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const { google, composer_v1 } = require('googleapis')
const keys = require('./keys.json')

const app = express()
const jsonParser = bodyParser.json()

const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key, 
    ['https://www.googleapis.com/auth/spreadsheets']
)

client.authorize(function(err, tokens) {
    if(err) {
        console.log(err)
        return
    }
    else {
        console.log('Connected')
    }
})

const gSApi = google.sheets({version:'v4', auth: client}) 

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

 
async function startDbAndServer() {
        
    await app.listen(3000);
    console.log("listening on port 3000");
}
async function getAll(req, res) {
    var outPut = {} // JSON object for the final output
    var array = {} // JSON object to store all key value pairs
 
    const opt = { 
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: 'A1:E'
    }
    var getData = await gSApi.spreadsheets.values.get(opt) // wait for data retrieval
    if (getData) {
        var allData = getData.data.values // get all data as array of arrays
        outPut["result"] = 200 // success code
        for (let i = 0; i < allData.length; i++) {
            if (i == allData.length - 1) { // prevent index out of range
                break
            }
            // convert each key value pair into a JSON object, discard the fist row
            array[JSON.stringify(allData[i + 1][0])] = JSON.stringify(allData[i + 1][1]) 
        }
        outPut["data"] = array
        console.log(outPut)
        // response with JSON object of outPut
        res.send(JSON.stringify(outPut))
    }
    else {
        outPut["result"] = 500
        outPut["description"] = "something went wrong"
        console.log(outPut)
    }
}

async function addTo(req, res) {
    var updateFlag = 0 // a flag to distinguish if we need to update or insert new
    const userKey = req.body // extract the key from body
    var rowCounter = 0 // counter keeps track of which row we need to update or insert
    var resArray = [[]]
    resArray[0].push(userKey["firstName"]) // array stores the key value pair we need to update or insert
    resArray[0].push(userKey["lastName"])
    console.log(resArray)
    // rowOpt get the first column for checking if a key already exists
    const rowOpt = {  
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: 'A2:A100'
    }
    // appendOpt append a new key value pair at the first empty row
    const appendOpt = {
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: 'A2:B',
        valueInputOption: 'USER_ENTERED',
        resource: { values: resArray }
      
        
    }
    // essentially the same range as appenOpt but updateOpt is for updating existing row
    var updateOpt = {
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range : 'A2:B', // this range is subject to change
        valueInputOption: 'USER_ENTERED',
        resource: { values: resArray }

    }
    // first get all the keys, check if the new key alreay exists
    var getData = await gSApi.spreadsheets.values.get(rowOpt)
   // console.log(resArray[0][0])
    for (let i = 0; i < getData.data.values.length; i++) {
        rowCounter += 1
        if (getData.data.values[i][0] == resArray[0][0]) {
         //   console.log(getData.data.values[i[0]])
            rowCounter += 1
            var rangeString = 'A' + rowCounter.toString() + ':' + 'B' + rowCounter.toString()
            updateOpt['range'] = rangeString
            var tempData = await gSApi.spreadsheets.values.update(updateOpt)
            updateFlag = 1
            console.log("Key exists, key value pair has been updated.\n")
            res.send(JSON.stringify({
                result: 200,
                description: "OK"
               }
               ))
            break

        }
    }
    if (updateFlag == 0) {
        var addData = await gSApi.spreadsheets.values.append(appendOpt)
        console.log("A new key value pair has been added")
        res.send(JSON.stringify({
            result: 200,
            description: "OK"
           }
           ))
    }
}
async function deleteRow(req, res) {
    var rowCounter = 0
    const key = req.params
    var found = 0
   // console.log(key)
    var tempKey = key['key'].substring(1)
  //  console.log(tempKey)
    const rowOpt = {  
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: 'A2:A100'
    }

    var getData = await gSApi.spreadsheets.values.get(rowOpt)
    for (let i = 0; i < getData.data.values.length; i++) {
        rowCounter += 1 // counter increments as each element in the array
        if (getData.data.values[i][0] == tempKey) { // if equal, then key found
            rowCounter += 1 // increment counter again to match the row number because the array starts from row2
            found = 1 // flag 
        //    console.log(rowCounter)
            break
        }
    }
    
    if (rowCounter + 1 >= getData.data.values.length && found == 0) { // if we have iterated through the array and flag is not 1
        res.send(JSON.stringify({
            result: 404,
            description: "key not found"
           }
           ))
           return 
    }
    // composing a range string for the location of row which we want to delete
    var rangeString = 'A' + rowCounter.toString() + ':' + 'B' + rowCounter.toString()
    const deleteOpt = {
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: rangeString
    }

    var tempData = await gSApi.spreadsheets.values.clear(deleteOpt)
    if (tempData['status'] == 200) {
        console.log(`${tempKey} has been deleted`)
        res.send(JSON.stringify({
            result: 200,
            description: "OK"
           }
           ))
    }
}
/***
 * Landing page renders the main page
 */
app.get('/', function(req, res) {
    res.render('main')
})
/***
 * Adding new key value pair page
 */
app.get('/index.ejs', function(req, res) {
    res.render('index')
})
/***
 * Deleteing a key value pair page
 */
app.get('/delete.ejs', function(req, res) {
    res.render('delete')
})
/***
 * First API
 * Get all data in the sheet
 * To access it, go to: localhost:3000/all
 * The output is printed both on the page and the console
 */
app.get('/all', getAll) 
/***
 * Second API
 * Insert or update a key value pair using the input from index.ejs page
 */
app.post('/data', addTo)
/***
 * Third API
 * Delete a key value pair
 */
app.get('/data/:key', deleteRow)
startDbAndServer();

