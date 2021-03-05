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

let upload = multer({ dest: 'Uploads/' })

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('FileProcess'))

let csvData = [];
let countData = [];
let tempFile = [];

let hbs = exphbs.create({
    handlebars: allowInsecurePrototypeAccess(handlebars),
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/', (req, res) => {
    //Tạo thư mục nếu không tồn tại
    if (!fs.existsSync('./Uploads')) {
        fs.mkdirSync('./Uploads');
    }
    //Tạo thư mục nếu không tồn tại
    if (!fs.existsSync('./FileProcess')) {
        fs.mkdirSync('./FileProcess');
    }
    res.render('home', {
        list: countData
    });
})


app.get('/download', async (req, res) => {
    // Lọc điều kiện
    const query = csvData.filter(item => item.product == req.query.prod && item.promotion == req.query.prom);
    let fileNameDownload = getID() + '.csv';

    const csvWriter = createCsvWriter({
        path: './FileProcess/' + fileNameDownload,
        header: [
            { id: 'Encrypted_Phone', title: 'Encrypted_Phone' },
        ]
    });
    // Ghi ra file
    csvWriter.writeRecords(query).then(() => {
        tempFile.push(fileNameDownload);
        // Tải file
        res.download('./FileProcess/' + fileNameDownload, () => {
            fs.unlinkSync('./FileProcess/' + fileNameDownload);
        });
    })
})



app.post('/', upload.single('formFile'), (req, res) => {
    countData = [];
    csvData = [];
    let listProd = [];
    let listProm = [];
    let listChannel = [];

    if (req.file != null) {
        fileName = req.file.filename
        fs.createReadStream(__dirname + '/Uploads/' + req.file.filename)
            .pipe(
                parse({
                    delimiter: ","
                }))
            .on('data', function (dataRow) {
                csvData.push(dataRow);
            })
            .on('end', function () {
                // Lấy tất cá trường hợp của trường product, promotion và channel
                csvData = csvData.filter(item => item.product != '' && item.promotion != '' && item.channel != '')
                // Lọc trùng + lấy dữ liệu
                listProd = Array.from(new Set(csvData.map((item) => {
                    return item.product;
                })))
                listProm = Array.from(new Set(csvData.map((item) => {
                    return item.promotion;
                })))
                listChannel = Array.from(new Set(csvData.map((item) => {
                    return item.channel;
                })))
                // Lấy tất cả các trường hợp theo thứ tự product > promotion
                listProd.forEach((prod) => {
                    listProm.forEach((prom) => {
                        let filler = csvData.filter(item => item.product == prod && item.promotion == prom)
                        const channelOnRs = Array.from(new Set(filler.map((item) => {
                            return item.channel;
                        })))
                        if (filler.length >= 100) {
                            countData.push({ Product: prod, Promotion: prom, Channel: JSON.stringify(channelOnRs), Quatity: filler.length, Link: "/download?prod=" + prod + "&prom=" + prom })
                        }
                        listChannel.forEach((channel) => {
                            filler = csvData.filter(item => item.product == prod && item.promotion == prom && item.channel == channel);
                            if (filler.length >= 100) {
                                countData.push({ Product: prod, Promotion: prom, Channel: channel, Quatity: filler.length, Link: "/download?prod=" + prod + "&prom=" + prom })
                            }
                        })
                    })
                })
                fs.unlinkSync(__dirname + '/Uploads/' + req.file.filename);
                res.render('home', {
                    list: countData
                });
            });
    } else {
        res.render('home');
    }
})




app.listen(3000, () => {
    console.log("Server is listening on port" + 3000);
})

function getID() {
    let date = new Date();
    return date.getFullYear() + '' + date.getMonth() + '' + date.getDay() + '' + date.getTime();
}