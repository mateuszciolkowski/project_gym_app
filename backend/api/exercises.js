import express from 'express';
import multer from 'multer';
import pkg from 'pg';
import path from 'path';
import fs from 'fs';
import { authenticate } from './auth.js'; 

const { Client } = pkg;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'unknown_user'; 
    const exerciseName = req.body.name || 'exercise';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const filename = `${userId}_${exerciseName}_${timestamp}${fileExtension}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  fields: [
    { name: 'imageOne', maxCount: 1 },
    { name: 'imageTwo', maxCount: 1 }
  ]
});

const router = express.Router();
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'gym_app',
  password: 'admin',
  port: 5432,
});

client.connect()
  .then(() => console.log('Połączono z bazą danych PostgreSQL'))
  .catch(err => console.error('Błąd połączenia z bazą:', err));

router.post('/', authenticate, upload.array('images', 2), async (req, res) => {
  const { name, muscleGroup, currentWeight, maxWeight, maxWeightDate, description } = req.body;
  const images = req.files;
  const userId = req.user.userId; 

  console.log('userId:', userId); 

  const parsedMaxWeight = (maxWeight === 'null' || maxWeight === '') ? null : parseFloat(maxWeight);
  const parsedMaxWeightDate = (maxWeightDate === 'null' || maxWeightDate === '') ? null : new Date(maxWeightDate);

  const imageOnePath = images && images['imageOne'] ? `/uploads/${images['imageOne'][0].filename}` : null;
  const imageTwoPath = images && images['imageTwo'] ? `/uploads/${images['imageTwo'][0].filename}` : null;

  try {
    const result = await client.query(
      'INSERT INTO exercises(name, muscle_group, current_weight, max_weight, max_weight_date, image_one, image_two, description, user_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [name, muscleGroup, currentWeight, parsedMaxWeight, parsedMaxWeightDate, imageOnePath, imageTwoPath, description || null, userId]  
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Błąd przy dodawaniu ćwiczenia:', err);
    res.status(500).json({ error: 'Błąd przy dodawaniu ćwiczenia' });
  }
});

router.get('/', authenticate, async (req, res) => {
  const muscleGroup = req.query.muscle_group; 
  const userId = req.user.userId; 

  try {
    let query = 'SELECT * FROM exercises WHERE user_id = $1';
    const queryParams = [userId];

    if (muscleGroup) {
      query += ' AND muscle_group = $2';
      queryParams.push(muscleGroup);
    }

    const result = await client.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Błąd przy pobieraniu ćwiczeń z bazy danych' });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await client.query('SELECT * FROM exercises WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ćwiczenie o podanym ID nie zostało znalezione' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Błąd przy pobieraniu ćwiczenia' });
  }
});

router.put('/:id', authenticate, upload.array('images', 2), async (req, res) => {
  const { name, muscleGroup, currentWeight, maxWeight, maxWeightDate, description } = req.body;
  const images = req.files;

  const parsedCurrentWeight = currentWeight === '' || currentWeight === null ? null : parseFloat(currentWeight);
  const parsedMaxWeight = maxWeight === '' || maxWeight === null ? null : parseFloat(maxWeight);
  const parsedMaxWeightDate = maxWeightDate === '' || maxWeightDate === null ? null : new Date(maxWeightDate);

  const imageOnePath = images && images['imageOne'] ? `/uploads/${images['imageOne'][0].filename}` : req.body.imageOne || null;
  const imageTwoPath = images && images['imageTwo'] ? `/uploads/${images['imageTwo'][0].filename}` : req.body.imageTwo || null;

  try {
    const result = await client.query(
      `UPDATE exercises SET name = $1, muscle_group = $2, current_weight = $3, max_weight = $4, max_weight_date = $5, 
      image_one = COALESCE($6, image_one), image_two = COALESCE($7, image_two), description = COALESCE($8, description) WHERE id = $9 RETURNING *`,
      [name, muscleGroup, parsedCurrentWeight, parsedMaxWeight, parsedMaxWeightDate, imageOnePath, imageTwoPath, description || null, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ćwiczenie o podanym ID nie zostało znalezione' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Błąd przy edytowaniu ćwiczenia:', err);
    res.status(500).json({ error: 'Błąd przy edytowaniu ćwiczenia' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query('SELECT * FROM exercises WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ćwiczenie o podanym ID nie zostało znalezione' });
    }

    const exercise = result.rows[0];
    const imageOnePath = exercise.image_one ? path.join(__dirname, 'uploads', exercise.image_one.split('/').pop()) : null;
    const imageTwoPath = exercise.image_two ? path.join(__dirname, 'uploads', exercise.image_two.split('/').pop()) : null;

    if (imageOnePath && fs.existsSync(imageOnePath)) {
      fs.unlinkSync(imageOnePath);
    }

    if (imageTwoPath && fs.existsSync(imageTwoPath)) {
      fs.unlinkSync(imageTwoPath);
    }

    await client.query('DELETE FROM exercises WHERE id = $1', [id]);
    res.json({ message: 'Ćwiczenie zostało usunięte' });
  } catch (err) {
    console.error('Błąd przy usuwaniu ćwiczenia:', err);
    res.status(500).json({ error: 'Błąd przy usuwaniu ćwiczenia' });
  }
});

export default router;
