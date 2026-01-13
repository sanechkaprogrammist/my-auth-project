const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Подключение к MongoDB (на Render будем использовать переменную окружения)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vlasenkoaleksandr2005_db_user:6Bbn29iFuKtHOomg@cluster0.bkk6pap.mongodb.net/authDB?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB успешно подключён'))
  .catch(err => console.error('Ошибка подключения к MongoDB:', err));

// Схема пользователя
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// ──────────────── Админ-панель (CRUD) ──────────────────
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // без паролей
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin/create', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username и password обязательны' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.status(201).json({ message: 'Пользователь создан', id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/admin/delete/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Пользователь удалён' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ──────────────── Логин для основного сайта ────────────
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Введите логин и пароль' });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Неверный логин' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  res.json({ message: 'Успешный вход!' });
});

// Запуск сервера
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});