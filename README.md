# To-do-list-app
## To run this app:
### 1. `npm install` to install all dependencies in package.json
### 2. `node server.js` to start the server
### 3. The app runs default on *localhost:3000* 
### 4. The URL to my googlesheet is: https://docs.google.com/spreadsheets/d/1UAl8Mfv5n9_nyBjM3cRSFU_UuE-rmDrE5DdLJ-JRspw/edit#gid=0 I made it public so user can edit freely <br />

## Quick rundown:
### *localhost:3000* will show the landing page consists of 3 buttons where you can choose to list, add or delete
### *list* button prints a dump of the sheets, also returns a response in JSON format in the console
### *add* button redirects the user to a form where user can enter key value pair
### *delete* button redirects the user to a page where it tells the user to go to *localhost:3000/data/:key* to delete a key value pair where *key* should be replaced with the desired key
### After each action, the result will be returned to the page as well as logged in the console
