import express from 'express';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import bodyParser from 'body-parser';
import jwt from 'jsonwebtoken';
import exercisesRouter from './api/exercises.js';
import trainingDaysRouter from './api/training-days.js';
import userSessionRouter from './api/user-session.js';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    methods: ['GET', 'POST', 'DELETE', 'PUT'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'User-ID'], 
    credentials: true, 
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } 
}));

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (token) {
        jwt.verify(token, 'your-secret-key', (err, user) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user; 
            console.log('Authenticated user:', user);
            next();
        });
    } else {
        res.sendStatus(401); 
    }
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/exercises', authenticateJWT, exercisesRouter);
app.use('/api/training-days', authenticateJWT, trainingDaysRouter);

app.use('/api', userSessionRouter);

app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    res.send('Serwer działa!');
});

app.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});
