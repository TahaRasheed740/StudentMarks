function assignGrade(marks) {
    if (marks >= 90) return 'A';
    else if (marks >= 80) return 'B';
    else if (marks >= 70) return 'C';
    else if (marks >= 60) return 'D';
    else return 'F';
}


const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 8080;


const connection = require('./database');
const bodyParser = require('body-parser');
const session = require('express-session');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Session middleware setup
app.use(session({
    secret: 'mySystem',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(express.static('public'));

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Connecting to database
connection.connect(function (err) {
    if (err) {
        console.error("Error connecting to the database: ", err);
        return;
    }
    console.log("Database Connected!");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

app.get('/initialize', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/Input_Students.html'));
});



// This part remains the same
app.post('/initialize-students', (req, res) => {
    const totalStudents = parseInt(req.body.totalStudents);
    if (isNaN(totalStudents) || totalStudents <= 0) {
        return res.status(400).send('Invalid number of students');
    }

    // Insert a new Stats record
    connection.query('INSERT INTO Stats (AverageMarks, MaxMarks, MinMarks, TotalStudents) VALUES (NULL, NULL, NULL, ?)', [totalStudents], (err, statsResults) => {
        if (err) {
            console.error("Error inserting into Stats: ", err);
            return res.status(500).send('Error initializing stats');
        }
        // Redirect to populate page with the total number of students
        res.render('Populate', { totalStudents: totalStudents });
    });
});

// Updated to insert data directly instead of updating NULL entries
app.post('/submit-students', (req, res) => {
    let totalMarks = 0;
    let maxMarks = 0;
    let minMarks = 100; // Assuming marks are out of 100
    let students = [];
    let studentEntries = [];

    for (let i = 0; req.body[`studentName${i}`]; i++) {
        const name = req.body[`studentName${i}`];
        const marks = parseFloat(req.body[`obtainedMarks${i}`]);
        students.push({ name, marks });

        // Prepare SQL data insertions
        studentEntries.push([name, marks]);

        totalMarks += marks;
        if (marks > maxMarks) maxMarks = marks;
        if (marks < minMarks) minMarks = marks;
    }

    const averageMarks = totalMarks / students.length;

    // Insert student records into Marks
    const insertMarksSQL = 'INSERT INTO Marks (StudentName, ObtainedMarks, Grade) VALUES ?';
    const values = studentEntries.map(student => [student[0], student[1], assignGrade(student[1])]); // Assuming assignGrade is your grading function
    connection.query(insertMarksSQL, [values], (err, results) => {
        if (err) {
            console.error("Error inserting Marks: ", err);
            return res.status(500).send('Error adding student marks');
        }

        // Update the stats in the database
        connection.query('UPDATE Stats SET AverageMarks = ?, MaxMarks = ?, MinMarks = ? WHERE StatsID = 1', [averageMarks, maxMarks, minMarks], (err, result) => {
            if (err) {
                console.error("Error updating Stats:", err);
                return res.status(500).send('Database update failed');
            }
            // Redirect to the results page
            res.redirect('/results');
        });
    });
});


app.get('/results', (req, res) => {
    const studentQuery = 'SELECT StudentName, ObtainedMarks, Grade FROM Marks ORDER BY StudentID';
    const statsQuery = 'SELECT AverageMarks, MaxMarks, MinMarks FROM Stats ORDER BY StatsID DESC LIMIT 1'; // Fetch the most recent stats

    // First, fetch the student data
    connection.query(studentQuery, (err, studentResults) => {
        if (err) {
            console.error("Error fetching student results: ", err);
            return res.status(500).send('Error retrieving student results');
        }

        // Then, fetch the stats data
        connection.query(statsQuery, (err, statsResults) => {
            if (err) {
                console.error("Error fetching stats: ", err);
                return res.status(500).send('Error retrieving stats');
            }

            // Render the page with both student and stats data
            if (statsResults.length > 0) {
                const stats = statsResults[0];
                res.render('Results', { students: studentResults, stats: stats });
            } else {
                // Render without stats if none are found
                res.render('Results', { students: studentResults, stats: null });
            }
        });
    });
});



