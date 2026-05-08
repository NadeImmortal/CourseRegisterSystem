const express = require('express');
const cors = require('cors');
const path = require('path'); // Required for file paths
const apiRoutes = require('./routes/api');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// 1. Tell Express where to find your frontend files (CSS, JS, HTML)
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Load your API routes
app.use('/api', apiRoutes);

// 3. Redirect root requests (localhost:3000) to the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});