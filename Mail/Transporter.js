const nodemailer = require("nodemailer")
var randomize = require('randomatic');
const transport =nodemailer.createTransport({
    service:"gmail",
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.Email,
        pass: process.env.Email_Passward
    }
})

const Transporter=async(email,localStorage,brand_name,name)=>{

var randomnumber=randomize('0',6);

localStorage.setItem(JSON.stringify(email), randomnumber); 
  return await  transport.sendMail({
            		from: process.env.Email,
            		to: email,
            		subject: "Brand invited",
            		html: `<!DOCTYPE html>
                            <html>
                            <body>
                            Hi,
                            <b>${name}</b> with <b>Postager</b> has invited you to use <b>${brand_name}</b> to collaborate with them. Use the button below to set up your account and get started:
                            <br>
                            <br>
                            <br>
                            <center><a href="https://app.postager.com" style="background:#0606ff;color:white;padding:12px;font-weight: 700;text-decoration:none;">Set up account</a></center>
                            <br>
                            If you have any questions for <b>${name}</b>, you can reply to this email and it will go right to them. Alternatively, feel free to contact our customer success team anytime. (We're lightning quick at replying.) We also offer live chat during business hours.
                            <br>
                            <b>
                            Welcome aboard,
                            <br>
                            The Postager Team
                            </b>
                            </body>
                            </html>`
            	})
                
}
        
            

module.exports=Transporter;