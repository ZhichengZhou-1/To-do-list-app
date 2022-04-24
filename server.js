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
       // gsrun(client)
    }
})

const gSApi = google.sheets({version:'v4', auth: client}) 

app.set('view engine', 'ejs');
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

/*
 * Complete the startDbAndServer function, which connects to the MongoDB
 * server and creates a Node web server listening to port 3000.
 */ 
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
   // console.log(getData.data)
    if (getData) { // if 
        var allData = getData.data.values // get all data as array of arrays
     //   console.log(allData)
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
        res.send(JSON.stringify(outPut))
    }
    else {
        outPut["result"] = 200
        outPut["description"] = "something went wrong"
        console.log(outPut)
    }
}

async function addTo(req, res) {
    var updateFlag = 0
    const userKey = req.body
    var rowCounter = 0
    //console.log(userKey["firstName"])
    var resArray = [[]]
    resArray[0].push(userKey["firstName"])
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
    var getData = await gSApi.spreadsheets.values.get(rowOpt)
    console.log(resArray[0][0])
    for (let i = 0; i < getData.data.values.length; i++) {
        rowCounter += 1
        if (getData.data.values[i][0] == resArray[0][0]) {
            console.log(getData.data.values[i[0]])
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
    console.log(key)
    var tempKey = key['key'].substring(1)
    console.log(tempKey)
    const rowOpt = {  
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: 'A2:A100'
    }

    var getData = await gSApi.spreadsheets.values.get(rowOpt)
    for (let i = 0; i < getData.data.values.length; i++) {
        rowCounter += 1
        console.log(getData.data.values[i][0])
        if (getData.data.values[i][0] == tempKey) {
            rowCounter += 1
            console.log(rowCounter)
            break
        }
    }
    if (rowCounter == getData.data.values.length) {
        res.send(JSON.stringify({
            result: 404,
            description: "key not found"
           }
           ))
           return 
    }
    var rangeString = 'A' + rowCounter.toString() + ':' + 'B' + rowCounter.toString()
    console.log(rangeString)
    const deleteOpt = {
        spreadsheetId: '1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw',
        range: rangeString
    }

    var tempData = await gSApi.spreadsheets.values.clear(deleteOpt)
    //console.log(tempData)
    if (tempData['status'] == 200) {
        res.send(JSON.stringify({
            result: 200,
            description: "OK"
           }
           ))
    }
}
/***
 * Landing page renders a html file for getting input
 * The input is posted to /data
 */
app.get('/', function(req, res) {
    //res.sendFile(__dirname + '/views/index.html')
    res.render('index')
})

/***
 * First API
 * Get all data in the sheet
 * To access it, go to: localhost:3000/all
 * The output is printed both on the page and the console
 */
app.get('/all', getAll) 
app.post('/data', addTo)
app.get('/data/:key', deleteRow)
startDbAndServer();

