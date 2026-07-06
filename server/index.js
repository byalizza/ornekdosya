const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ========== DATA STORE ==========
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadData(name) {
  try {
    const p = path.join(DATA_DIR, name + '.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { console.error('Load error:', name, e.message); }
  return [];
}

function saveData(name, data) {
  try {
    fs.writeFileSync(path.join(DATA_DIR, name + '.json'), JSON.stringify(data, null, 2));
  } catch (e) { console.error('Save error:', name, e.message); }
}

// ========== MESSAGES API ==========
let messages = loadData('messages');

app.get('/api/messages', (req, res) => {
  res.json(messages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)));
});

app.post('/api/messages', (req, res) => {
  const msg = req.body;
  if (!msg || !msg.id) return res.status(400).json({ error: 'Invalid message' });
  const exists = messages.some(m => m.id === msg.id);
  if (!exists) {
    messages.push(msg);
    saveData('messages', messages);
    io.emit('new_message', msg);
  }
  res.json({ ok: true });
});

app.put('/api/messages/:id', (req, res) => {
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  messages[idx].text = req.body.text || '';
  saveData('messages', messages);
  res.json({ ok: true });
});

app.delete('/api/messages/:id', (req, res) => {
  messages = messages.filter(m => m.id !== req.params.id);
  saveData('messages', messages);
  res.json({ ok: true });
});

// ========== PHOTOS API ==========
let photos = loadData('photos');

// Clean expired photos on startup
photos = photos.filter(p => Date.now() < (p.expiresAt || Infinity));
saveData('photos', photos);

app.get('/api/photos', (req, res) => {
  const valid = photos.filter(p => Date.now() < (p.expiresAt || Infinity));
  res.json(valid.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
});

app.post('/api/photos', (req, res) => {
  const photo = req.body;
  if (!photo || !photo.id) return res.status(400).json({ error: 'Invalid photo' });
  const exists = photos.some(p => p.id === photo.id);
  if (!exists) {
    photos.unshift(photo);
    saveData('photos', photos);
    io.emit('new_photo', photo);
  }
  res.json({ ok: true });
});

app.delete('/api/photos/:id', (req, res) => {
  photos = photos.filter(p => (p.id || p.timestamp) != req.params.id);
  saveData('photos', photos);
  res.json({ ok: true });
});

// ========== CLEANUP EXPIRED PHOTOS ==========
setInterval(() => {
  const before = photos.length;
  photos = photos.filter(p => Date.now() < (p.expiresAt || Infinity));
  if (photos.length !== before) saveData('photos', photos);
}, 60000);

// ========== SOCKET.IO ==========
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  socket.on('send_message', (msg) => {
    if (!msg || !msg.id) return;
    const exists = messages.some(m => m.id === msg.id);
    if (!exists) {
      messages.push(msg);
      saveData('messages', messages);
    }
    socket.broadcast.emit('new_message', msg);
  });

  socket.on('send_photo', (photo) => {
    if (!photo || !photo.id) return;
    const exists = photos.some(p => p.id === photo.id);
    if (!exists) {
      photos.unshift(photo);
      saveData('photos', photos);
    }
    socket.broadcast.emit('new_photo', photo);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`💖 Sunucu çalışıyor: http://localhost:${PORT}`);
});
