require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const axios = require("axios");
const cron = require("node-cron");
const moment = require("moment-timezone");
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

const requestOptions = {
  headers: { accept: "application/json" }
};

cron.schedule(`*/1 * * * *`, function() {
  console.log("-----------------");
  console.log("A minute in cron land as passed!!!!");
  axios
    .get(
      `${process.env.BACKEND_URL}/twilioRoute/getAllScheduledMessages`,
      requestOptions
    )
    .then(results => {
      for (let i = 0; i < results.data.data.length; i++) {
        if (results.data.data[i].month === "") {
          if (
            `${results.data.data[i].weekday},${results.data.data[i].hour}:${results.data.data[i].min}${results.data.data[i].ampm}` ===
            moment()
              .tz("America/Los_Angeles")
              .format("dddd,h:mma")
          ) {
            const cleanedNumber = results.data.data[i].userPhone.replace(
              /(\d{3})(\d{3})(\d{4})/,
              "($1) $2-$3"
            );
            client.messages
              .create({
                body: results.data.data[i].msg,
                from: `${process.env.TWILIO_NUMBER}`,
                to: `+1${cleanedNumber}`
              })
              .then(message => console.log(`message sent ${message.sid}.`))
              .catch(err => console.log(error, err));
          } else {
            console.log("no messages scheduled at this time.");
          }
        } else {
          if (
            `${results.data.data[i].month} ${results.data.data[i].dom}, ${
              results.data.data[i].year
            } ${results.data.data[i].hour}:${
              results.data.data[i].min
            } ${results.data.data[i].ampm.toUpperCase()}` ===
            moment().format("lll")
          ) {
            const cleanedNumber = results.data.data[i].userPhone.replace(
              /(\d{3})(\d{3})(\d{4})/,
              "($1) $2-$3"
            );
            client.messages
              .create({
                body: results.data.data[i].msg,
                from: `${process.env.TWILIO_NUMBER}`,
                to: `+1${cleanedNumber}`
              })
              .then(message => console.log(`message sent ${message.sid}.`))
              .catch(err => console.log(error, err));
          } else {
            console.log("no messages scheduled at this time.");
          }
        }
      }
    })
    .catch(err => {
      console.log(err);
    });
});

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

server.get("/newRoute", (req, res) => {
  axios
    .get(
      `http://localhost:4000/twilioRoute/getAllScheduledMessages`,
      requestOptions
    )
    .then(results => {
      res.status(200).json({ message: "hello there!!!", data: results.data });
    })
    .catch(err => {
      res
        .status(500)
        .json({ message: "this is also not working!", error: err });
    });
});

server.listen(process.env.PORT, () => {
  console.log(`Listening to port: ${process.env.PORT}`);
});

// {
// 	"patientId": "recmLlbDsUaCMUFhf",
// 	"scheduleDate": "july 22nd",
//     "msg": "hello mason from the past!!!",
//     "min": "09",
//     "hour": "4",
//     "weekday": "Monday"
// }
