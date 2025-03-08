const accountSid = 'AC6d7c79cd4b988eb3069603043e2c043d';
const authToken = '[AuthToken]';
const client = require('twilio')(accountSid, authToken);

client.messages
    .create({
                from: 'whatsapp:+14155238886',
        contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
        contentVariables: '{"1":"12/1","2":"3pm"}',
        to: 'whatsapp:+918431632913'
    })
    .then(message => console.log(message.sid))
    .done();

Sid = AC6d7c79cd4b988eb3069603043e2c043d ;
AuthToken = cd8210377d452e2513e4f1b558bb12ef ;
phoneNumber = +17755998575 ;

https://4xnpp2sm-1919.inc1.devtunnels.ms/