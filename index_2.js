'use strict';
const parse = require('csv-parser')
const fs = require('fs')
const express = require('express')
const PORT = 3000;
const HOST = '0.0.0.0'
const handlebars = require('handlebars')
const app = express()
var exphbs = require('express-handlebars');
const multer = require('multer');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let upload = multer({ dest: 'Uploads/' })

app.use(express.static('FileProcess'))
app.use(express.static('FileProcessAll'))

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
    let channels = req.query.channel.split(',')
    let types = req.query.type.split()
    const query = csvData.filter(item => item.product == req.query.prod && item.promotion == req.query.prom && channels.includes(item.channel));
    console.log(query.length)
   // console.log('------------'+query.length)
    let fileNameDownload = getID() + '_' + req.query.type + '_' + req.query.prod + '_' + req.query.prom + '_' + req.query.channel + '.csv';    

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
    let listType = [];
    if (req.file != null) {
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
                listType = Array.from(new Set(csvData.map((item) => {
                    return item.type;
                })))
                // Lấy tất cả các trường hợp theo thứ tự product > promotion : .replace("NOTI,SMS", "ALL").replace("SMS,NOTI", "ALL")
                listProd.forEach((prod) => {
                    listProm.forEach((prom) => {
                        listType.forEach((type) => {
                            let filler = csvData.filter(item => item.product == prod && item.promotion == prom)
                            const channelOnRs = Array.from(new Set(filler.map((item) => {
                                return item.channel;
                            })))
                            // a = channelOnRs.toString();
                            if (filler.length >= 100) {
                                countData.push({
                                    Product: prod, Promotion: prom, Channel: JSON.stringify(channelOnRs),
                                    Type: type, Quatity: filler.length, Link: "/download?prod=" + prod + "&prom=" + prom + "&channel=" + channelOnRs.toString() + "&type=" + type
                                })
                            }
                            listChannel.forEach((channel) => {
                                filler = csvData.filter(item => item.product == prod && item.promotion == prom && item.channel == channel);
                                if (filler.length >= 100) {
                                    countData.push({ Product: prod, Promotion: prom, Channel: channel, Type: type, Quatity: filler.length, Link: "/download?prod=" + prod + "&prom=" + prom + "&channel=" + channel + "&type=" + type })
                                }
                            })

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

app.listen(PORT,HOST);
console.log('runnng port: ${HOST}:${PORT}');

function getID() {
    let date = new Date();
    return ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + (date.getDate())).slice(-2)
}
