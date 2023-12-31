const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;
const jwt = require('jsonwebtoken')
const {decode} = require('jsonwebtoken')
require('dotenv').config();


const { MongoClient, ServerApiVersion } = require('mongodb');
const {query} = require("express");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.user_db}:${process.env.user_pass}@cluster0.cefd8nv.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const dbConnect = async () => {
    try{
        await client.connect()
        console.log('DB Connected Successfully')
    } catch (error){
        console.log(error.name, error.message)
    }
}
dbConnect()


const logger = async (req, res, next) => {
    next();
}

const taskCollection = client.db('tasky').collection('AllTasks');
const userCollection = client.db('tasky').collection('users');

app.get('/', (req, res) => {
    res.send('Server Started');
})

app.post('/jwt', logger, async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn: '1h'});
    res.send({token});
})

const verifyToken = async (req, res, next) => {
    // console.log('inside verify token', req.headers.authorization)
    if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'});
    }
    const token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if(err){
            return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

app.get('/logout', async (req, res) => {
    const logout = req.body;
    res.clearCookie('token', {maxAge: 0}).send({success: true});
})

app.get('/userdata', async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
})

app.get('/users', verifyToken, async (req, res) => {
    const email = req.query.email;
    const query = {email: email}
    const result = await userCollection.find(query).toArray();
    res.send(result);
})

app.post('/users', verifyToken, async (req, res) => {
    const users = req.body;
    const query = {email: users.email}
    const existingUser = await userCollection.findOne(query);
    if(existingUser){
        return res.send({message: 'user already exists', insertedId: null})
    }
    const result = await userCollection.insertOne(users);
    res.send(result);
})

app.get('/tasks', verifyToken, async (req, res) => {
    const email = req.query.email;
    const query = {email: email}
    const result = await taskCollection.find(query).toArray();
    res.send(result);
})

app.post('/tasks', verifyToken, async (req, res) => {
    const tasks = req.body;
    const result = await taskCollection.insertOne(tasks);
    res.send(result);
})

app.listen(port, () => {
    console.log(`server started, ${port}`)
})
