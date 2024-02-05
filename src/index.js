const express = require('express');
const bodyParser = require('body-parser');
const { default: axios } = require('axios')
const app = express();
require('dotenv').config();
app.use(bodyParser.json());

const port = process.env.PORT || 8080;
const pvm_instance_id = process.env.PVM_INSTANCE_ID;
const cloud_instance_id = process.env.CLOUD_INSTANCE_ID;

const generateToken = async () => {
    const url = 'https://iam.cloud.ibm.com/identity/token'
    console.log("pvm instance", pvm_instance_id);
    console.log("cloud instance", cloud_instance_id);
    const apikey = process.env.IBM_CLOUD_API_KEY;
    console.log("apikey: ", apikey);

    const body = {
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
        apikey: apikey,
    }

    const config = {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: 'Basic Yng6Yng=',
        },
    }

    const response = await axios.post(url, body, config)


    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
    }
}

app.listen(port, () => {
    console.log(`App listening on port ${port}`);
})


app.get('/getPower', async (req, res) => {
    const session = await generateToken()
    const accesstoken = session.access_token
    try {
        const response = await axios.get(`https://us-east.power-iaas.cloud.ibm.com/pcloud/v1/cloud-instances/${cloud_instance_id}/pvm-instances/${pvm_instance_id}`, {
            headers: { 
                Authorization: `Bearer ${accesstoken}`, 
                CRN: 'crn:v1:bluemix:public:power-iaas:us-east:a/7746f5d28823528f9bda3f8ee8d49f45:41f48fac-38e3-4564-941c-e620543ae2fb::', 
                'Content-Type': 'application/json'
            } 
        });
        console.log("Axios response:", response.data);
        res.status(200).send(response.data);            
    }catch(error){
        console.error("Axios error:", error.message);
        res.status(500).send("Internal Server Error");
    }
})

app.put('/updatePower', async (req, res) => {

    const body = {
        serverName: process.env.LPAR_NAME,
        processors: req.body.processors || 1,
        memory: req.body.memory || 20,
        procType: "shared",
        softwareLicences: {
            ibmCSS: false,
            ibmPHA: false,
            ibmRDS: false,
        },
        migratable: false,
        pinPolicy: "none",
        storagePoolAffinity: true
    }

    const session = await generateToken()

    const accesstoken = session.access_token

    console.log("generando token", accesstoken);


    try {

        const response = await axios.put(`https://us-east.power-iaas.cloud.ibm.com/pcloud/v1/cloud-instances/${cloud_instance_id}/pvm-instances/${pvm_instance_id}`, body, {
            headers: {
                Authorization: `Bearer ${accesstoken}`,
                CRN: 'crn:v1:bluemix:public:power-iaas:us-east:a/7746f5d28823528f9bda3f8ee8d49f45:41f48fac-38e3-4564-941c-e620543ae2fb::',
                'Content-Type': 'application/json',

            } 
        });
        console.log(response);
        res.status(200).send(response.data);
    }catch(error){
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})
