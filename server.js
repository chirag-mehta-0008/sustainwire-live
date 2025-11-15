// --- Imports ---
const express = require('express');
const path = require('path');
const multer = require('multer'); 
const session = require('express-session'); 
require('dotenv').config(); // .env file load karega
const connectDB = require('./config/database'); // Humari database connection file
const mongoose = require('mongoose');

// --- Models ko import karna ---
const News = require('./models/News');
const Job = require('./models/Job');
const Event = require('./models/Event');
const Course = require('./models/Course');
const SpecialReport = require('./models/SpecialReport'); // Naya model

// --- App Setup ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Database Connect ---
connectDB();

// --- Middlewares ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(session({
    secret: 'sustainwire-super-secret-key', 
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

// --- Admin Users ---
const adminUsers = [
    { username: "Chirag.Mehta", password: "Chirag@123" },
    { username: "Chitra.Singla", password: "Chitra@123" },
    { username: "Jay.Monga",   password: "Jay@123" }
];

// --- Multer (Abhi ke liye local hi rakhte hain) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'public/uploads/'); },
    filename: (req, file, cb) => { cb(null, Date.now() + '-' + file.originalname); }
});
const upload = multer({ storage: storage });


// --- PUBLIC UTILITY FUNCTIONS (Jobs ke liye typeColor) ---
const getJobColor = (type) => {
    if (type === 'Contract') return 'blue';
    if (type === 'Internship') return 'yellow';
    return 'green';
};

// --- PUBLIC ROUTES ---

// Homepage Route (ab async hai)
app.get('/', async (req, res) => {
    try {
        const newsArticles = await News.find().limit(3).sort({ _id: -1 });
        const jobs = await Job.find().limit(4).sort({ _id: -1 });
        const events = await Event.find().limit(3).sort({ _id: -1 });
        const courses = await Course.find().limit(3).sort({ _id: -1 });
        
        // Special Report (Pehle item ko hero section mein use karenge)
        let specialReport = await SpecialReport.findOne();
        if (!specialReport) {
            // Agar database mein Special Report nahi hai, toh default create karo
            specialReport = await SpecialReport.create({
                title: "India Is Becoming the New Backbone of the Global Chemical Industry",
                content: "Environmental curbs in China and rising energy costs in Europe have opened the door for a new contender...",
                imageUrl: "/uploads/special-report-placeholder.jpg",
                applyLink: "https://www.google.com"
            });
        }

        res.render('index', {
            pageTitle: "SustainWire - ESG News, Jobs, Events & Courses",
            report: specialReport, 
            news: newsArticles,
            jobs: jobs, 
            events: events, 
            courses: courses
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// All List Pages (News, Jobs, Events, Courses)
app.get('/news', async (req, res) => {
    try {
        const newsArticles = await News.find().sort({ _id: -1 });
        res.render('news-list', { pageTitle: "All News - SustainWire", news: newsArticles });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ _id: -1 });
        res.render('jobs-list', { pageTitle: "All Jobs - SustainWire", jobs: jobs });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ _id: -1 });
        res.render('events-list', { pageTitle: "All Events - SustainWire", events: events });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find().sort({ _id: -1 });
        res.render('courses-list', { pageTitle: "All Courses - SustainWire", courses: courses });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// Detail Pages (News, Job, Event, Course)
app.get('/news/:id', async (req, res) => {
    try {
        const article = await News.findById(req.params.id);
        if (!article) return res.redirect('/');
        res.render('news-detail', { pageTitle: article.title, article: article });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/job/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.redirect('/');
        res.render('job-detail', { pageTitle: job.title, job: job });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/event/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.redirect('/');
        res.render('event-detail', { pageTitle: event.title, event: event });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/course/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.redirect('/');
        res.render('course-detail', { pageTitle: course.title, course: course });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/special-report', async (req, res) => {
    try {
        const report = await SpecialReport.findOne();
        if (!report) return res.redirect('/');
        res.render('report-detail', { pageTitle: report.title, report: report });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});


// --- AUTHENTICATION ROUTES (No changes here) ---
app.get('/login', (req, res) => { res.render('login', { error: null }); });
app.post('/login', (req, res) => { const { username, password } = req.body; const user = adminUsers.find(u => u.username === username && u.password === password); if (user) { req.session.isLoggedIn = true; req.session.username = user.username; res.redirect('/admin/dashboard'); } else { res.render('login', { error: "Invalid username or password" }); }});
app.get('/logout', (req, res) => { req.session.destroy(err => { if (err) { return res.redirect('/admin/dashboard'); } res.redirect('/login'); }); });
const requireLogin = (req, res, next) => { if (req.session.isLoggedIn) { next(); } else { res.redirect('/login'); }};

// --- ADMIN ROUTES ---
app.use('/admin', requireLogin); 

// Admin Dashboard 
app.get('/admin/dashboard', async (req, res) => {
    try {
        const newsArticles = await News.find().sort({ _id: -1 });
        const jobs = await Job.find().sort({ _id: -1 });
        const events = await Event.find().sort({ _id: -1 });
        const courses = await Course.find().sort({ _id: -1 });
        
        res.render('admin/dashboard', {
            pageTitle: "Admin Dashboard",
            username: req.session.username,
            news: newsArticles,
            jobs: jobs,
            events: events,
            courses: courses
        });
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});


// --- SPECIAL REPORT CRUD ---
app.get('/admin/special-report/edit', async (req, res) => {
    try {
        const report = await SpecialReport.findOne();
        if (!report) return res.redirect('/admin/dashboard');
        res.render('admin/edit-special-report', { pageTitle: "Edit Special Report", report: report, username: req.session.username }); 
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.post('/admin/special-report/edit', upload.single('imageUrl'), async (req, res) => {
    try {
        const { title, content, applyLink } = req.body;
        let updateData = {
            title, content, applyLink, updatedBy: req.session.username
        };
        if (req.file) { updateData.imageUrl = '/' + req.file.path.replace(/\\/g, '/').replace('public/', ''); }

        // FindOneAndUpdate, upsert:true ke saath use karein taaki agar report na ho toh ban jaye
        await SpecialReport.findOneAndUpdate({}, updateData, { new: true, upsert: true });
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});


// --- NEWS CRUD ---
app.get('/admin/news/add', (req, res) => { res.render('admin/add-news', { pageTitle: "Add New Article", username: req.session.username }); });
app.post('/admin/news/add', upload.single('imageUrl'), async (req, res) => {
    const { title, content, category } = req.body;
    const imageUrl = '/' + req.file.path.replace(/\\/g, '/').replace('public/', '');
    try {
        await News.create({ title, content, category, imageUrl, updatedBy: req.session.username, analytics: { views: 0, unique: 0, topCountry: 'N/A' } });
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/news/edit/:id', async (req, res) => {
    try { const article = await News.findById(req.params.id); if (!article) return res.redirect('/admin/dashboard'); res.render('admin/edit-news', { pageTitle: "Edit Article", article: article, username: req.session.username }); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.post('/admin/news/edit/:id', upload.single('imageUrl'), async (req, res) => {
    try {
        const { title, content, category } = req.body;
        let updateData = { title, content, category, updatedBy: req.session.username };
        if (req.file) { updateData.imageUrl = '/' + req.file.path.replace(/\\/g, '/').replace('public/', ''); }
        await News.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/news/delete/:id', async (req, res) => {
    try { await News.findByIdAndDelete(req.params.id); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// --- JOBS CRUD ---
app.get('/admin/jobs/add', (req, res) => { res.render('admin/add-job', { pageTitle: "Add New Job", username: req.session.username }); });
app.post('/admin/jobs/add', async (req, res) => {
    const { title, company, location, type, description, applyLink } = req.body; 
    try { await Job.create({ title, company, location, type, typeColor: getJobColor(type), description, applyLink, updatedBy: req.session.username, analytics: { views: 0, unique: 0, topCountry: 'N/A' } }); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/jobs/edit/:id', async (req, res) => {
    try { const job = await Job.findById(req.params.id); if (!job) return res.redirect('/admin/dashboard'); res.render('admin/edit-job', { pageTitle: "Edit Job", job: job, username: req.session.username }); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.post('/admin/jobs/edit/:id', async (req, res) => {
    try {
        const { title, company, location, type, description, applyLink } = req.body;
        const updateData = { title, company, location, type, description, applyLink, updatedBy: req.session.username, typeColor: getJobColor(type) };
        await Job.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/jobs/delete/:id', async (req, res) => {
    try { await Job.findByIdAndDelete(req.params.id); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// --- EVENTS CRUD ---
app.get('/admin/events/add', (req, res) => { res.render('admin/add-event', { pageTitle: "Add New Event", username: req.session.username }); });
app.post('/admin/events/add', async (req, res) => {
    const { title, date, location, description, applyLink } = req.body;
    try { await Event.create({ title, date, location, description, applyLink, updatedBy: req.session.username, analytics: { views: 0, unique: 0, topCountry: 'N/A' } }); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/events/edit/:id', async (req, res) => {
    try { const event = await Event.findById(req.params.id); if (!event) return res.redirect('/admin/dashboard'); res.render('admin/edit-event', { pageTitle: "Edit Event", event: event, username: req.session.username }); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.post('/admin/events/edit/:id', async (req, res) => {
    try {
        const { title, date, location, description, applyLink } = req.body;
        const updateData = { title, date, location, description, applyLink, updatedBy: req.session.username };
        await Event.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/events/delete/:id', async (req, res) => {
    try { await Event.findByIdAndDelete(req.params.id); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});

// --- COURSES CRUD ---
app.get('/admin/courses/add', (req, res) => { res.render('admin/add-course', { pageTitle: "Add New Course", username: req.session.username }); });
app.post('/admin/courses/add', async (req, res) => {
    const { title, provider, format, description, applyLink } = req.body;
    try { await Course.create({ title, provider, format, description, applyLink, updatedBy: req.session.username, analytics: { views: 0, unique: 0, topCountry: 'N/A' } }); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/courses/edit/:id', async (req, res) => {
    try { const course = await Course.findById(req.params.id); if (!course) return res.redirect('/admin/dashboard'); res.render('admin/edit-course', { pageTitle: "Edit Course", course: course, username: req.session.username }); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.post('/admin/courses/edit/:id', async (req, res) => {
    try {
        const { title, provider, format, description, applyLink } = req.body;
        const updateData = { title, provider, format, description, applyLink, updatedBy: req.session.username };
        await Course.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin/dashboard');
    } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});
app.get('/admin/courses/delete/:id', async (req, res) => {
    try { await Course.findByIdAndDelete(req.params.id); res.redirect('/admin/dashboard'); } catch (err) { console.error(err); res.status(500).send("Server Error"); }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});