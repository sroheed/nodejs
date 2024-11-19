import inquirer from "inquirer";
import qr from "qr-image";
import fs from "fs";

inquirer.prompt([
    {
        message: 'type your url:',
        name: 'URL',
    }
])
.then((answer) => {
    const url = answer.URL;
    var qr_svg = qr.image(url);
    var randNum = Math.random()
    qr_svg.pipe(fs.createWriteStream(Math.random()+1+".png"));
    fs.writeFile("url.txt", url, (err) => {
        if (err) throw err;
        console.log("The file has been saved!");
    })
})
.catch((error) => {
    if (error.isTtyError) {

    } else {
        console.Console('there was some general error');
    }
}
) 