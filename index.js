const parse = require('csv-parser')
const bodyParser = require('body-parser');
const fs = require('fs')
const express = require('express')
const handlebars = require('handlebars')
const app = express()
var exphbs = require('express-handlebars');
const multer = require('multer');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

var upload = multer({ dest: 'uploads/' })



// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse requests of content-type - application/json
app.use(bodyParser.json());


var fileName = ""
let csvData = [];
const savedata = [];


var hbs = exphbs.create({
    handlebars: allowInsecurePrototypeAccess(handlebars),
});

// Register `hbs.engine` with the Express app.
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');



app.get('/', (req, res) => {
    res.render('home')
})
app.post('/filter', (req, res) => {
   // condition query channel = noti
    const data_noti = []
    const mapData = []
    const fill_noti = {
        product: req.body.product,
        promotion: req.body.promotion,
        channel: req.body.channel
    }
    // condition query channel get all
    const data_all = []
    const fill_all = {
        product: req.body.product,
        promotion: req.body.promotion        
    }
    //end test
    console.log(fill_noti)
    console.log(fill_all)
    csvData.forEach((item) => {

        if (
            item.product === fill_noti.product &&
            item.promotion === fill_noti.promotion &&
            item.channel === fill_noti.channel
           
        ) {
            data_noti.push({ Encrypted_Phone: item.Encrypted_Phone })
        }
        item.product === fill_all.product &&
        item.promotion === fill_all.promotion 
        data_all.push({ Encrypted_Phone: item.Encrypted_Phone })
       
    });

    // write file channel = noti
    const csvWriter = createCsvWriter({
        path:  fill_noti.product + '_' + fill_noti.promotion + '_' + fill_noti.channel + '.csv',
        header: [
            { id: 'Encrypted_Phone', title: 'Encrypted_Phone' },
        ]
    });

    const record_noti = data_noti

    csvWriter.writeRecords(record_noti)       // returns a promise
        .then(() => {
            console.log(data.length)
            console.log('...Done');
        });
    // console.log(data)
    res.render('home', { list: data_noti })
    // write file ALL
    const csvWriterAll = createCsvWriter({
        path:  fill_all.product + '_' + fill_all.promotion + '_' + 'ALL' + '.csv',
        header: [
            { id: 'Encrypted_Phone', title: 'Encrypted_Phone' },
        ]
    });

    const record_aLL = data_all

    csvWriterAll.writeRecords(record_aLL)       // returns a promise
        .then(() => {
            console.log(data_all.length)
            console.log('...Done');
        });
    res.render('home', { list: data_all })
      
})

app.get('/', (req, res) => {
    res.render('home')
})


app.post('/', upload.single('formFile'), (req, res) => {
    console.log(req.file)
    fileName = req.file.filename
    // reset list
    csvData = [];
    fs.createReadStream(__dirname + '/uploads/' + req.file.filename)
        
        .pipe(
            parse({
                delimiter: ","
            })
        )
        .on('data', function (dataRow) {
            csvData.push(dataRow);
        })
        .on('end', function () {
            res.render('home', {
                list: csvData
            });
        }
        );
})






app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})

