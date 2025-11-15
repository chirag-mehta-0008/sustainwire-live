// --- Imports ---
require('dotenv').config(); 
const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');
const multer = require('multer'); 
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const util = require('util'); // YEH NAYA ADD HUA HAI (Super Logger)

// --- Database Connection ---
const connectDB = require('./config/database');
connectDB(); 

// --- Models ko import karna ---
const News = require('./models/News');
const Job = require('./models/Job');
const Event = require('./models/Event');
const Course = require('./models/Course');
const SpecialReport = require('./models/SpecialReport');

// --- App Setup ---
const app = express();
const PORT = process.env.PORT || 3000; 

// --- Cloudinary Configuration ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sustainwire-uploads', 
    format: async (req, file) => 'jpg',
    public_id: (req, file) => Date.now() + '-' + file.originalname,
  },
});

const upload = multer({ storage: storage });


// --- Middlewares ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sustainwire-super-secret-key', 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } 
}));

// --- User Database ---
const users = [
    { id: 1, username: "Chirag.Mehta", password: "Chirag@123" },
    { id: 2, username: "Chitra.Singla", password: "Chitra@123" },
    { id: 3, username: "Jay.Monga", password: "Jay@123" }
];

// --- Middleware (Admin Routes ko Protect karne ke liye) ---
const isAdmin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    res.locals.username = req.session.username; 
    return next();
  }
  res.redirect('/login');
};

// --- PUBLIC ROUTES ---

app.get('/', async (req, res) => {
    try {
        const specialReport = await SpecialReport.findOne();
        const newsArticles = await News.find().sort({ _id: -1 }).limit(3);
        const esgJobs = await Job.find().sort({ _id: -1 }).limit(10);
        const upcomingEvents = await Event.find().sort({ _id: -1 }).limit(3);
        const featuredCourses = await Course.find().sort({ _id: -1 }).limit(3);

        if (!specialReport) {
             // Agar database bilkul khali hai, toh crash hone se roko
            return res.status(503).send("Service Initializing: Special Report not found. Please add one via admin panel.");
        }

        res.render('index', {
            pageTitle: "SustainWire - ESG News, Jobs, Events & Courses",
            report: specialReport,
            news: newsArticles,
            jobs: esgJobs,
            events: upcomingEvents,
            courses: featuredCourses,
            username: req.session.username || null
        });
    } catch (err) {
        console.error("Error loading homepage:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.status(500).send("Server Error loading homepage");
    }
});

// List Pages
app.get('/news', async (req, res) => {
    const allNews = await News.find().sort({ _id: -1 });
    res.render('news-list', { pageTitle: "All News", news: allNews, username: req.session.username || null });
});
app.get('/jobs', async (req, res) => {
    const allJobs = await Job.find().sort({ _id: -1 });
    res.render('jobs-list', { pageTitle: "All Jobs", jobs: allJobs, username: req.session.username || null });
});
app.get('/events', async (req, res) => {
    const allEvents = await Event.find().sort({ _id: -1 });
    res.render('events-list', { pageTitle: "All Events", events: allEvents, username: req.session.username || null });
});
app.get('/courses', async (req, res) => {
    const allCourses = await Course.find().sort({ _id: -1 });
    res.render('courses-list', { pageTitle: "All Courses", courses: allCourses, username: req.session.username || null });
});

// Detail Pages
app.get('/news/:id', async (req, res) => {
    try {
        const article = await News.findById(req.params.id);
        if (!article) return res.redirect('/news');
        res.render('news-detail', { pageTitle: article.title, article: article, username: req.session.username || null });
    } catch (err) { res.redirect('/news'); }
});
app.get('/job/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.redirect('/jobs');
        res.render('job-detail', { pageTitle: job.title, job: job, username: req.session.username || null });
    } catch (err) { res.redirect('/jobs'); }
});
app.get('/event/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.redirect('/events');
        res.render('event-detail', { pageTitle: event.title, event: event, username: req.session.username || null });
    } catch (err) { res.redirect('/events'); }
});
app.get('/course/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.redirect('/courses');
        res.render('course-detail', { pageTitle: course.title, course: course, username: req.session.username || null });
    } catch (err) { res.redirect('/courses'); }
});
app.get('/special-report', async (req, res) => {
    try {
        const report = await SpecialReport.findOne();
        if (!report) return res.redirect('/');
        res.render('report-detail', { pageTitle: report.title, report: report, username: req.session.username || null });
    } catch (err) { res.redirect('/'); }
});


// --- AUTHENTICATION ROUTES ---
app.get('/login', (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/admin/dashboard');
  }
  res.render('login', { pageTitle: "Admin Login", error: null, username: req.session.username || null });
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.isLoggedIn = true;
        req.session.username = user.username;
        res.redirect('/admin/dashboard');
    } else {
        res.render('login', { pageTitle: "Admin Login", error: "Invalid username or password", username: req.session.username || null });
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.redirect('/');
    });
});


// --- ADMIN ROUTES (Protected) ---
app.get('/admin/dashboard', isAdmin, async (req, res) => {
    try {
        const news = await News.find().sort({ _id: -1 });
        const jobs = await Job.find().sort({ _id: -1 });
        const events = await Event.find().sort({ _id: -1 });
        const courses = await Course.find().sort({ _id: -1 });
        res.render('admin/dashboard', {
            pageTitle: "Admin Dashboard",
            news: news, jobs: jobs, events: events, courses: courses
        });
    } catch (err) {
        console.error("Error loading dashboard data:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.status(500).send("Error loading dashboard data.");
    }
});

// --- SPECIAL REPORT CRUD (Admin) ---
app.get('/admin/special-report/edit', isAdmin, async (req, res) => {
    let report = await SpecialReport.findOne();
    if (!report) {
        report = new SpecialReport({ 
            title: "Default Title", 
            content: "Default Content", 
            imageUrl: "https://placehold.co/800x600/e2e8f0/334155?text=Default+Image",
            updatedBy: "Admin",
            applyLink: "#"
        });
        await report.save();
    }
    res.render('admin/edit-special-report', { pageTitle: "Edit Special Report", report: report });
});

app.post('/admin/special-report/edit', isAdmin, upload.single('imageUrl'), async (req, res) => {
    try {
        const { title, content, applyLink } = req.body;
        let report = await SpecialReport.findOne();
        report.title = title;
        report.content = content;
        report.applyLink = applyLink;
        report.updatedBy = req.session.username;
        if (req.file) {
            report.imageUrl = req.file.path; 
        }
        await report.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error updating Special Report:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

// --- NEWS CRUD (Admin) ---
app.get('/admin/news/add', isAdmin, (req, res) => {
    res.render('admin/add-news', { pageTitle: "Add New Article" });
});

app.post('/admin/news/add', isAdmin, upload.single('imageUrl'), async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const imageUrl = req.file ? req.file.path : "https://placehold.co/600x400/e2e8f0/334155?text=No+Image+Uploaded";
        
        const newArticle = new News({
            title: title,
            content: content,
            category: category,
            imageUrl: imageUrl, 
            updatedBy: req.session.username,
        });
        await newArticle.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error adding news:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/news/edit/:id', isAdmin, async (req, res) => {
    const article = await News.findById(req.params.id);
    if (!article) return res.redirect('/admin/dashboard');
    res.render('admin/edit-news', { pageTitle: "Edit Article", article: article });
});

app.post('/admin/news/edit/:id', isAdmin, upload.single('imageUrl'), async (req, res) => {
    try {
        const { title, content, category } = req.body;
        const article = await News.findById(req.params.id);
        article.title = title;
        article.content = content;
        article.category = category;
        article.updatedBy = req.session.username;
        if (req.file) {
            article.imageUrl = req.file.path; 
        }
        await article.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error editing news:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/news/delete/:id', isAdmin, async (req, res) => {
    await News.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});

// --- JOBS CRUD (Admin) ---
app.get('/admin/jobs/add', isAdmin, (req, res) => {
    res.render('admin/add-job', { pageTitle: "Add New Job" });
});

app.post('/admin/jobs/add', isAdmin, async (req, res) => {
    try {
        const { title, company, location, type, description, applyLink } = req.body;
        let typeColor = 'green';
        if (type === 'Contract') typeColor = 'blue';
        if (type === 'Internship') typeColor = 'yellow';
        const newJob = new Job({
            title, company, location, type, description, applyLink, typeColor,
            updatedBy: req.session.username
        });
        await newJob.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error adding job:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/jobs/edit/:id', isAdmin, async (req, res) => {
    const job = await Job.findById(req.params.id);
    if (!job) return res.redirect('/admin/dashboard');
    res.render('admin/edit-job', { pageTitle: "Edit Job", job: job });
});

app.post('/admin/jobs/edit/:id', isAdmin, async (req, res) => {
    try {
        const { title, company, location, type, description, applyLink } = req.body;
        const job = await Job.findById(req.params.id);
        let typeColor = 'green';
        if (type === 'Contract') typeColor = 'blue';
        if (type === 'Internship') typeColor = 'yellow'; 

        job.title = title;
        job.company = company;
        job.location = location;
        job.type = type;
        job.description = description;
        job.applyLink = applyLink;
        job.typeColor = typeColor;
        job.updatedBy = req.session.username;
        await job.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error editing job:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/jobs/delete/:id', isAdmin, async (req, res) => {
    await Job.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});

// --- EVENTS CRUD (Admin) ---
app.get('/admin/events/add', isAdmin, (req, res) => {
    res.render('admin/add-event', { pageTitle: "Add New Event" });
});

app.post('/admin/events/add', isAdmin, async (req, res) => {
    try {
        const { title, date, location, description, applyLink } = req.body;
        const newEvent = new Event({
            title, date, location, description, applyLink,
            updatedBy: req.session.username
        });
        await newEvent.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error adding event:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/events/edit/:id', isAdmin, async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) return res.redirect('/admin/dashboard');
    res.render('admin/edit-event', { pageTitle: "Edit Event", event: event });
});

app.post('/admin/events/edit/:id', isAdmin, async (req, res) => {
    try {
        const { title, date, location, description, applyLink } = req.body;
        const event = await Event.findById(req.params.id);
        event.title = title;
        event.date = date;
        event.location = location;
        event.description = description;
        event.applyLink = applyLink;
        event.updatedBy = req.session.username;
        await event.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error editing event:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/events/delete/:id', isAdmin, async (req, res) => {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});

// --- COURSES CRUD (Admin) ---
app.get('/admin/courses/add', isAdmin, (req, res) => {
    res.render('admin/add-course', { pageTitle: "Add New Course" });
});

app.post('/admin/courses/add', isAdmin, async (req, res) => {
    try {
        const { title, provider, format, description, applyLink } = req.body;
        const newCourse = new Course({
            title, provider, format, description, applyLink,
            updatedBy: req.session.username
        });
        await newCourse.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error adding course:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/courses/edit/:id', isAdmin, async (req, res) => {
    const course = await Course.findById(req.params.id);
    if (!course) return res.redirect('/admin/dashboard');
    res.render('admin/edit-course', { pageTitle: "Edit Course", course: course });
});

app.post('/admin/courses/edit/:id', isAdmin, async (req, res) => {
    try {
        const { title, provider, format, description, applyLink } = req.body;
        const course = await Course.findById(req.params.id);
        course.title = title;
        course.provider = provider;
        course.format = format;
        course.description = description;
        course.applyLink = applyLink;
        course.updatedBy = req.session.username;
        await course.save();
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error("Error editing course:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});

app.get('/admin/courses/delete/:id', isAdmin, async (req, res) => {
    await Course.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
});


// --- ANALYTICS ROUTE (Admin) ---
app.get('/admin/analytics/:type/:id', isAdmin, async (req, res) => {
    const { type, id } = req.params;
    let item;
    
    try {
        if (type === 'news') item = await News.findById(id);
        else if (type === 'job') item = await Job.findById(id);
        else if (type === 'event') item = await Event.findById(id);
        else if (type === 'course') item = await Course.findById(id);
        else if (type === 'special-report') item = await SpecialReport.findOne();
        else return res.redirect('/admin/dashboard');
        
        if (!item) return res.redirect('/admin/dashboard');
        
        res.render('admin/analytics-detail', {
            pageTitle: `Analytics: ${item.title}`,
            item: item,
            analytics: item.analytics,
            type: type
        });
    } catch (err) {
        console.error("Error loading analytics:", util.inspect(err)); // YEH UPDATE HUA HAI
        res.redirect('/admin/dashboard');
    }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server http://localhost:${PORT} par chal raha hai`);
});