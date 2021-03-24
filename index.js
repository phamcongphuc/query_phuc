'use strict';
const parse = require('csv-parser')
const fs = require('fs')
const express = require('express')
const handlebars = require('handlebars')
const app = express()
var exphbs = require('express-handlebars');
const multer = require('multer');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const e = require('express');

let upload = multer({ dest: 'Uploads/' })

app.use(express.static('FileProcess'))
app.use(express.static('FileProcessAll'))
const PORT = 3000;
const HOST = '0.0.0.0';
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
    const query = csvData.filter(item => item.product == req.query.prod && item.promotion == req.query.prom && channels.includes(item.channel));
    let fileNameDownload = getID() + '_' + req.query.type + '_' + req.query.prod + '_' +  + req.query.prom + '_' + req.query.channel + '.csv';
    const csvWriter = createCsvWriter({
        path: './FileProcess/' + fileNameDownload,
        header: [
            { id: 'Encrypted_Phone', title: 'Encrypted_Phone' },
        ]
    });
    // Ghi ra file
    csvWriter.writeRecords(query).then(() => {
        tempFile.push(fileNameDownload);
        console.log('----download---------' + fileNameDownload + '_length:' + query.length)
        // Tải file
        res.download('./FileProcess/' + fileNameDownload, () => {
            // fs.unlinkSync('./FileProcess/' + fileNameDownload);
        });
    })

})
// download gift
app.get('/downloadGift', async (req, res) => {
    // Lọc điều kiện

    let channels = req.query.channel.split(',')
    const query = csvData.filter(item => item.product == req.query.prod && item.promotion == req.query.prom && item.gift == req.query.gift && channels.includes(item.channel));
    let fileNameDownload = getID() + '_' + req.query.type + '_' + req.query.prod + '_' + req.query.gift + '_' + req.query.prom + '_' + req.query.channel + '.csv';
    const csvWriter = createCsvWriter({
        path: './FileProcess/' + fileNameDownload,
        header: [
            { id: 'Encrypted_Phone', title: 'Encrypted_Phone' },
        ]
    });
    // Ghi ra file
    csvWriter.writeRecords(query).then(() => {
        tempFile.push(fileNameDownload);
        console.log('----download---------' + fileNameDownload + '_length:' + query.length)
        // Tải file
        res.download('./FileProcess/' + fileNameDownload, () => {
            // fs.unlinkSync('./FileProcess/' + fileNameDownload);
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
// load file gift 
app.post('/Gift', upload.single('formFile'), (req, res) => {
    countData = [];
    csvData = [];
    let listProd = [];
    let listProm = [];
    let listChannel = [];
    let listType = [];
    let listGift = [];
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
                listGift = Array.from(new Set(csvData.map((item) => {
                    return item.gift;
                })))

                listProd.forEach((prod) => {
                    listProm.forEach((prom) => {
                        listGift.forEach((gift) => {
                            listType.forEach((type) => {

                                let filler = csvData.filter(item => item.product == prod && item.promotion == prom && item.gift == gift)
                                const channelOnRs = Array.from(new Set(filler.map((item) => {
                                    return item.channel;
                                })))
                                // a = channelOnRs.toString();
                                if (filler.length >= 100) {
                                    countData.push({
                                        Product: prod, Promotion: prom, Gift: gift, Channel: JSON.stringify(channelOnRs),
                                        Type: type, Quatity: filler.length, Link: "/downloadGift?prod=" + prod + "&prom=" + prom + "&gift=" + gift + "&channel=" + channelOnRs.toString() + "&type=" + type
                                    })
                                }
                                listChannel.forEach((channel) => {
                                    filler = csvData.filter(item => item.product == prod && item.promotion == prom && item.channel == channel && item.gift == gift);
                                    if (filler.length >= 100) {
                                        countData.push({ Product: prod, Promotion: prom, Gift: gift, Channel: channel, Type: type, Quatity: filler.length, Link: "/downloadGift?prod=" + prod + "&prom=" + prom + "&gift=" + gift + "&channel=" + channel + "&type=" + type })
                                    }
                                })
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

app.listen(PORT, HOST);
console.log(`Running on:${PORT}`);
function getID() {
    let date = new Date();
    return ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + (date.getDate())).slice(-2)

}