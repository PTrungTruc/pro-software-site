require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const matter = require('gray-matter');
const { marked } = require('marked');
const { Server: SocketIOServer } = require("socket.io");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ================== CẤU HÌNH ==================
const allowedOrigins = [
    'http://localhost:5173',
    'http://14.241.225.202:3001',
    'http://192.168.1.49:3001' // Thêm IP nội bộ nếu cần
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
};
app.use(cors(corsOptions));
const io = new SocketIOServer(server, { cors: corsOptions });

app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));
app.use(morgan('dev'));

const tempDir = path.join(__dirname, 'storage', 'uploads_temp');
const finalDir = path.join(__dirname, 'storage', 'downloads');
// const tempDir = path.join('E:', 'prosite-storage', 'uploads_temp');
// const finalDir = path.join('E:', 'prosite-storage', 'downloads');
app.use('/downloads', express.static(finalDir));
app.use(express.static(path.join(__dirname, 'public')));

//['storage/downloads', tempDir, 'data', 'posts'].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
[finalDir, tempDir, path.join(__dirname, 'data'), path.join(__dirname, 'posts')].forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });
['chats.json', 'comments.json', 'software.json', 'courses.json', 'exams.json', 'requests.json', 'submissions.json', 'software_categories.json', 'blog_categories.json', 'course_categories.json', 'exam_categories.json'].forEach(file => {
    const filePath = path.join(__dirname, 'data', file);
    if (!fs.existsSync(filePath)) {
        const initialContent = (file.includes('chats') || file.includes('comments')) ? '{}' : '[]';
        fs.writeFileSync(filePath, initialContent);
    }
});
app.use(session({ secret: process.env.SESSION_SECRET || 'day_la_chuoi_bi_mat_rat_manh_can_duoc_thay_the', resave: false, saveUninitialized: true, cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } }));

const upload = multer({ dest: tempDir });

// ================== HELPERS & AUTH ==================
function readData(fileName) { try { const data = fs.readFileSync(path.join(__dirname, 'data', `${fileName}.json`), 'utf-8'); if (!data) return (fileName.includes('chats') || fileName.includes('comments') ? {} : []); return JSON.parse(data); } catch (e) { return (fileName.includes('chats') || fileName.includes('comments') ? {} : []); } }
// function writeData(fileName, data) { fs.writeFileSync(path.join(__dirname, 'data', `${fileName}.json`), JSON.stringify(data, null, 2)); }
function writeData(fileName, data) {
    const filePath = path.join(__dirname, 'data', `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('[LOG] Data:', JSON.stringify(data, null, 2));
}
function getBlogPosts(includeContent = false) { try { const files = fs.readdirSync(path.join(__dirname, 'posts')).filter(f => f.endsWith('.md')); const posts = files.map(filename => { const slug = filename.replace('.md', ''); const fileContent = fs.readFileSync(path.join(__dirname, 'posts', filename), 'utf-8'); const { data: frontmatter, content } = matter(fileContent); if (includeContent) { return { slug, frontmatter, content }; } return { slug, frontmatter }; }); return posts.sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date)); } catch (e) { return []; } }
function getBlogPost(slug) { const filePath = path.join(__dirname, 'posts', slug + '.md'); if (!fs.existsSync(filePath)) return null; const content = fs.readFileSync(filePath, 'utf-8'); const { data: frontmatter, content: mdContent } = matter(content); return { frontmatter, htmlContent: marked.parse(mdContent) }; }
const requireAuth = (req, res, next) => { if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' }); next(); };

const apiRouter = express.Router();
const publicRouter = express.Router();

// ================== PUBLIC API ROUTES ==================
publicRouter.get('/stats', (req, res) => { const softwareCount = readData('software').length; const blogCount = getBlogPosts().length; const courseCount = readData('courses').length; const examCount = readData('exams').length; res.json({ softwareCount, blogCount, courseCount, examCount }); });
publicRouter.get('/software', (req, res) => res.json(readData('software')));
publicRouter.get('/courses', (req, res) => res.json(readData('courses')));
publicRouter.get('/exams', (req, res) => res.json(readData('exams')));
publicRouter.get('/blog', (req, res) => res.json(getBlogPosts()));
publicRouter.get('/blog/:slug', (req, res) => { const post = getBlogPost(req.params.slug); if (post) res.json(post); else res.status(404).json({ message: "Post not found" }); });
publicRouter.post('/request', (req, res) => { const { name, email, phone, message } = req.body; if (!name || !email || !message) { return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin.' }); } const requests = readData('requests'); const newRequest = { id: Date.now(), name, email, phone, message, status: 'new', date: new Date().toISOString() }; requests.unshift(newRequest); writeData('requests', requests); console.log(`[REQUEST] New request received from: ${name}`); res.json({ success: true, message: 'Yêu cầu của bạn đã được gửi thành công!\nChúng tôi sẽ liên hệ qua email được gửi!' }); });
publicRouter.get('/software_categories', (req, res) => res.json(readData('software_categories')));
publicRouter.get('/blog_categories', (req, res) => res.json(readData('blog_categories')));
publicRouter.get('/course_categories', (req, res) => res.json(readData('course_categories')));
publicRouter.get('/exam_categories', (req, res) => res.json(readData('exam_categories')));
publicRouter.get('/comments/:contentId', (req, res) => { const allComments = readData('comments'); const comments = allComments[req.params.contentId] || []; res.json(comments); });
publicRouter.post('/comments/:contentId', (req, res) => { const { author, text } = req.body; if (!author || !text) { return res.status(400).json({ message: 'Vui lòng nhập tên và nội dung bình luận.' }); } const allComments = readData('comments'); const { contentId } = req.params; if (!allComments[contentId]) { allComments[contentId] = []; } const newComment = { id: Date.now(), author: author.trim(), text: text.trim(), date: new Date().toISOString() }; allComments[contentId].unshift(newComment); writeData('comments', allComments); res.status(201).json(newComment); });
publicRouter.post('/submissions', upload.single('submissionFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'File bài làm là bắt buộc.' });

    // Đổi tên file để đảm bảo không bị trùng
    const tempPath = req.file.path;
    const finalFileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
    const finalPath = path.join(__dirname, 'storage', 'downloads', finalFileName);

    fs.renameSync(tempPath, finalPath);

    const { examId, name, phone, email } = req.body;
    const submissions = readData('submissions');
    const newSubmission = {
        id: Date.now(), examId, studentInfo: { name, phone, email },
        fileName: finalFileName, // LƯU TÊN FILE ĐÚNG
        downloadUrl: `/downloads/${finalFileName}`,
        submissionDate: new Date().toISOString()
    };
    submissions.unshift(newSubmission);
    writeData('submissions', submissions);
    res.status(201).json({ success: true, message: 'Nộp bài thành công!' });
});
// ================== ADMIN API ROUTES ==================
apiRouter.post('/login', (req, res) => { const { username, password } = req.body; if (username === 'admin' && password === '123') { req.session.user = { id: 1, username: 'admin' }; res.json({ success: true, user: req.session.user }); } else { res.status(401).json({ success: false, message: 'Invalid credentials' }); } });
apiRouter.post('/logout', (req, res) => { req.session.destroy(() => res.json({ success: true })); });
apiRouter.get('/auth-status', (req, res) => { if (req.session.user) res.json({ loggedIn: true, user: req.session.user }); else res.json({ loggedIn: false }); });
apiRouter.use(requireAuth);

// === UPLOAD ROUTES ===
apiRouter.post('/upload-thumbnail', upload.single('thumbnail'), (req, res) => { if (!req.file) { return res.status(400).json({ message: 'No file uploaded.' }); } const tempPath = req.file.path; const finalFileName = `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`; const finalPath = path.join(finalDir, finalFileName); fs.rename(tempPath, finalPath, err => { if (err) { console.error("[THUMBNAIL UPLOAD] Error moving file:", err); return res.status(500).json({ message: 'Could not save the file.' }); } console.log(`[THUMBNAIL UPLOAD] Saved file: ${finalFileName}`); res.json({ success: true, fileName: finalFileName }); }); });
apiRouter.post('/upload-chunk', upload.single('chunk'), (req, res) => { const chunkNumber = req.body.chunkNumber; const originalFilename = req.body.originalFilename; if (!req.file) { return res.status(400).send('Chunk file is missing.'); } const tempFilePath = req.file.path; const newChunkPath = path.join(tempDir, `${originalFilename}.part_${chunkNumber}`); fs.rename(tempFilePath, newChunkPath, (err) => { if (err) { console.error('[CHUNK] Error renaming chunk:', err); return res.status(500).send('Error saving chunk'); } console.log(`[CHUNK] Received chunk ${chunkNumber} for ${originalFilename}`); res.status(200).send('Chunk uploaded'); }); });
apiRouter.post('/assemble-chunks', (req, res) => { const { originalFilename, totalChunks, entity, ...metadata } = req.body; const finalFileName = `${Date.now()}-${originalFilename.replace(/\s+/g, '_')}`; const finalFilePath = path.join(finalDir, finalFileName); const writeStream = fs.createWriteStream(finalFilePath); console.log(`[ASSEMBLE] Assembling ${totalChunks} chunks for ${originalFilename}`); const appendChunk = (chunkNumber) => { if (chunkNumber >= parseInt(totalChunks)) { writeStream.end(); console.log(`[ASSEMBLE] Finished assembling ${finalFileName}`); if (entity && metadata.name) { const dataFile = entity; const data = readData(dataFile); const newItem = { ...metadata, id: Date.now(), fileName: finalFileName, downloadUrl: `/downloads/${finalFileName}` }; data.unshift(newItem); writeData(dataFile, data); console.log(`[DATA] Saved metadata for ${finalFileName} to ${dataFile}.json`); } return res.status(200).json({ success: true, message: 'File assembled successfully' }); } const chunkPath = path.join(tempDir, `${originalFilename}.part_${chunkNumber}`); if (!fs.existsSync(chunkPath)) { console.error(`[ASSEMBLE] Missing chunk number ${chunkNumber} for ${originalFilename}`); return res.status(400).json({ message: `Missing chunk number ${chunkNumber}` }); } const readStream = fs.createReadStream(chunkPath); readStream.pipe(writeStream, { end: false }); readStream.on('end', () => { fs.unlink(chunkPath, (err) => { if (err) console.error(`[CLEANUP] Failed to delete chunk ${chunkPath}`, err); }); appendChunk(chunkNumber + 1); }); readStream.on('error', (err) => { console.error('[ASSEMBLE] Error reading chunk:', err); res.status(500).send('Error assembling file'); }); }; appendChunk(0); });

// === OTHER ADMIN ROUTES ===
apiRouter.get('/stats', (req, res) => { const softwareCount = readData('software').length; const blogCount = getBlogPosts().length; const requestCount = readData('requests').filter(r => r.status === 'new').length; const courseCount = readData('courses').length; const examCount = readData('exams').length; res.json({ softwareCount, blogCount, requestCount, courseCount, examCount }); });
function createCategoryCrud(router, categoryFileName) { router.get(`/${categoryFileName}`, (req, res) => res.json(readData(categoryFileName))); router.post(`/${categoryFileName}`, (req, res) => { const categories = readData(categoryFileName); const newCategory = { id: Date.now(), name: req.body.name, slug: req.body.name.toLowerCase().replace(/\s+/g, '-') }; categories.push(newCategory); writeData(categoryFileName, categories); res.status(201).json(newCategory); }); router.put(`/${categoryFileName}/:id`, (req, res) => { let categories = readData(categoryFileName); categories = categories.map(c => c.id == req.params.id ? { ...c, name: req.body.name, slug: req.body.name.toLowerCase().replace(/\s+/g, '-') } : c); writeData(categoryFileName, categories); res.json({ success: true }); }); router.delete(`/${categoryFileName}/:id`, (req, res) => { let categories = readData(categoryFileName); categories = categories.filter(c => c.id != req.params.id); writeData(categoryFileName, categories); res.status(200).json({ message: 'Deleted' }); }); }
createCategoryCrud(apiRouter, 'software_categories'); createCategoryCrud(apiRouter, 'blog_categories'); createCategoryCrud(apiRouter, 'course_categories'); createCategoryCrud(apiRouter, 'exam_categories');
function createMetadataCrud(router, fileName) { router.get(`/${fileName}`, (req, res) => res.json(readData(fileName))); router.post(`/${fileName}`, (req, res) => { const list = readData(fileName); const newItem = { ...req.body, id: Date.now() }; list.unshift(newItem); writeData(fileName, list); res.status(201).json(newItem); }); router.put(`/${fileName}/:id`, (req, res) => { let list = readData(fileName); list = list.map(item => item.id == req.params.id ? { ...item, ...req.body } : item); writeData(fileName, list); res.json(list.find(item => item.id == req.params.id)); }); router.delete(`/${fileName}/:id`, (req, res) => { let list = readData(fileName); const itemToDelete = list.find(s => s.id == req.params.id); if (itemToDelete && itemToDelete.fileName) { const filePath = path.join(__dirname, 'storage', 'downloads', itemToDelete.fileName); if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } list = list.filter(s => s.id != req.params.id); writeData(fileName, list); res.status(200).json({ message: 'Deleted successfully' }); }); }
createMetadataCrud(apiRouter, 'software'); createMetadataCrud(apiRouter, 'courses'); createMetadataCrud(apiRouter, 'exams');
apiRouter.get('/blog', (req, res) => res.json(getBlogPosts(true))); apiRouter.post('/blog', (req, res) => {
    const { title, content, categoryId, images } = req.body; const date = new Date().toISOString().slice(0, 10); const slug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''); const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
categoryId: "${categoryId || ''}"
images: ${JSON.stringify(images || [])}
---

${content}`; fs.writeFileSync(path.join(__dirname, 'posts', `${slug}.md`), fileContent); res.status(201).json({ slug, frontmatter: { title, date, categoryId, images } });
}); apiRouter.put('/blog/:slug', (req, res) => {
    const { title, content, categoryId, images } = req.body; const oldSlug = req.params.slug; const oldFilePath = path.join(__dirname, 'posts', `${oldSlug}.md`); if (!fs.existsSync(oldFilePath)) return res.status(404).json({ message: "Post not found" }); const newSlug = title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''); const newFilePath = path.join(__dirname, 'posts', `${newSlug}.md`); const postData = matter(fs.readFileSync(oldFilePath, 'utf-8')); const fileContent = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${postData.data.date}"
categoryId: "${categoryId || ''}"
images: ${JSON.stringify(images || [])}
---

${content}`; if (oldSlug !== newSlug) { fs.unlinkSync(oldFilePath); } fs.writeFileSync(newFilePath, fileContent); res.json({ success: true, slug: newSlug });
}); apiRouter.delete('/blog/:slug', (req, res) => { const filePath = path.join(__dirname, 'posts', `${req.params.slug}.md`); if (fs.existsSync(filePath)) fs.unlinkSync(filePath); res.status(200).json({ message: 'Deleted successfully' }); });
apiRouter.get('/requests', (req, res) => res.json(readData('requests'))); apiRouter.put('/requests/:id', (req, res) => { let requests = readData('requests'); const { status } = req.body; requests = requests.map(r => r.id == req.params.id ? { ...r, status } : r); writeData('requests', requests); res.json({ success: true, request: requests.find(r => r.id == req.params.id) }); }); apiRouter.delete('/requests/:id', (req, res) => { let requests = readData('requests'); requests = requests.filter(r => r.id != req.params.id); writeData('requests', requests); res.json({ success: true, message: 'Deleted' }); });
apiRouter.get('/submissions', (req, res) => res.json(readData('submissions'))); apiRouter.delete('/submissions/:id', (req, res) => { let submissions = readData('submissions'); const itemToDelete = submissions.find(s => s.id == req.params.id); if (itemToDelete) { const filePath = path.join(__dirname, 'storage', 'downloads', itemToDelete.fileName); if (fs.existsSync(filePath)) fs.unlinkSync(filePath); submissions = submissions.filter(s => s.id != req.params.id); writeData('submissions', submissions); } res.status(200).json({ message: 'Deleted successfully' }); });

app.use('/api', apiRouter);
app.use('/public', publicRouter);
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// ========== LOGIC XỬ LÝ CHAT ==========
let adminSocketId = null;
const CHAT_FILE = path.join(__dirname, 'data', "chats.json");
// io.on('connection', (socket) => {
//     socket.on('admin_join', () => { adminSocketId = socket.id; console.log('[SOCKET] Admin joined:', adminSocketId); const chats = readData('chats'); const users = Object.keys(chats).map(roomId => ({ id: roomId, info: chats[roomId].info, lastMessage: chats[roomId].messages.slice(-1)[0] || null })); socket.emit('user_list', users); });
//     socket.on('user_join', ({ roomId, userInfo }) => { socket.join(roomId); console.log(`[SOCKET] User ${socket.id} (Name: ${userInfo.name}) joined room: ${roomId}`); const chats = readData('chats'); if (!chats[roomId]) { chats[roomId] = { info: userInfo, messages: [] }; } else { chats[roomId].info = userInfo; } writeData('chats', chats); socket.emit('chat_history', chats[roomId].messages); if(adminSocketId) { const users = Object.keys(chats).map(rId => ({ id: rId, info: chats[rId].info, lastMessage: chats[rId].messages.slice(-1)[0] || null })); io.to(adminSocketId).emit('user_list', users); } });
//     socket.on('admin_fetch_history', (roomId) => { socket.join(roomId); const chats = readData('chats'); if(chats[roomId]) { socket.emit('chat_history', chats[roomId].messages);}});
//     socket.on('send_message', ({ roomId, message, sender }) => { const newMessage = { roomId, message, sender, timestamp: new Date() }; const chats = readData('chats'); if (chats[roomId]) { chats[roomId].messages.push(newMessage); writeData('chats', chats); io.to(roomId).emit('receive_message', newMessage); if(sender !== 'admin' && adminSocketId) { io.to(adminSocketId).emit('receive_message', newMessage); } if (adminSocketId) { const updatedUsers = Object.keys(chats).map(rId => ({ id: rId, info: chats[rId].info, lastMessage: chats[rId].messages.slice(-1)[0] || null })); io.to(adminSocketId).emit('user_list', updatedUsers); } } });
//     socket.on('disconnect', () => { console.log('[SOCKET] User disconnected:', socket.id); if(socket.id === adminSocketId) { adminSocketId = null; console.log('[SOCKET] Admin disconnected.'); } });
// });
function readChats() {
    try {
        const data = fs.readFileSync(CHAT_FILE, "utf8");
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeChats(chats) {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(chats, null, 2));
}

io.on("connection", (socket) => {
    console.log("[SOCKET] Connected:", socket.id);

    /* ================= ADMIN JOIN ================= */
    socket.on("admin_join", () => {
        adminSocketId = socket.id;
        console.log("[SOCKET] Admin joined:", adminSocketId);
        socket.join('ADMIN_ROOM');
        const chats = readChats();

        const users = chats.map(chat => ({
            id: chat.roomId,
            info: chat.info,
            lastMessage: chat.messages.at(-1) || null
        }));
        socket.emit("user_list", users);
    });

    /* ================= USER JOIN ================= */
    socket.on("user_join", ({ roomId, userInfo }) => {
        if (!roomId) return;
        roomId = roomId.trim();
        const chats = readChats();
        // CHECK USER TỒN TẠI KO
        let chat = chats.find(c => c.roomId === roomId)
        if (!chat && userInfo?.name && userInfo?.class) {
            chat = chats.find(c =>
                c.info?.name === userInfo.name &&
                c.info?.class === userInfo.class
            )
        }
        if (!chat) {
            chat = {
                roomId,
                info: userInfo || {},
                messages: []
            };
            chats.push(chat);
        } else {
            chat.info = userInfo || chat.info;
            chat.messages ||= [];
        }

        socket.join(chat.roomId);
        writeChats(chats);

        socket.emit("chat_history", chat.messages);
        socket.emit("chat_roomId", chat.roomId);

        if (adminSocketId) {
            io.to(adminSocketId).emit(
                "user_list",
                chats.map(c => ({
                    id: c.roomId,
                    info: c.info,
                    lastMessage: c.messages.at(-1) || null
                }))
            );
        }
        console.log(`[SOCKET] User ${userInfo.name} joined room ${chat.roomId}`);
    });

    /* ================= ADMIN FETCH HISTORY ================= */
    socket.on("admin_fetch_history", (roomId) => {
        const chats = readChats();
        const chat = chats.find(c => c.roomId === roomId);
        if (!chat) return;

        // const rooms = socket.rooms
        // rooms.forEach(r => { if(r === "ADMIN_ROOM") socket.leave(r) })

        socket.join(roomId);
        console.log(socket.rooms);
        socket.emit("chat_history", chat.messages);
    });

    /* ================= SEND MESSAGE ================= */
    socket.on("send_message", ({ roomId, message, sender }) => {
        if (!roomId || !message) return;

        const chats = readChats();
        const chat = chats.find(c => c.roomId === roomId);
        if (!chat) return;

        const newMessage = {
            roomId,
            sender,
            message,
            timestamp: new Date()
        };

        chat.messages.push(newMessage);
        writeChats(chats);

        console.log(newMessage);
        io.to(roomId).emit("receive_message", newMessage)
        if (!socket.rooms.has(roomId) && socket.rooms.has(adminSocketId)) {
            io.to('ADMIN_ROOM').emit('receive_message', newMessage)
        }

        if (adminSocketId) {
            io.to(adminSocketId).emit(
                "user_list",
                chats.map(c => ({
                    id: c.roomId,
                    info: c.info,
                    lastMessage: c.messages.at(-1) || null
                }))
            );
        }
    });

    /* ================= DISCONNECT ================= */
    socket.on("disconnect", () => {
        console.log("[SOCKET] Disconnected:", socket.id);
        if (socket.id === adminSocketId) {
            adminSocketId = null;
            console.log("[SOCKET] Admin disconnected");
        }
    });
});

server.listen(PORT, () => console.log(`Server with Manual Chunk Upload running at http://localhost:${PORT}`));