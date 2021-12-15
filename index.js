const express = require('express');
const mysql = require('mysql');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 80;
const DB_CONFIG = {
    host: '127.0.0.1',
    user: 'root',
    password: 'root_pass',
    database: 'calendar'
};

const HTML_HEAD = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calendar</title>
    <link rel='stylesheet' href='style.css'>
    <link rel='stylesheet' href='grid-layout.css'>
</head>
<body>
`;
const HTML_END = `
</body>
</html>
`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const USERNAME_WHITELIST = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_`;
const EMAIL_WHITELIST = USERNAME_WHITELIST + `@+.`;

app.use(express.static('static'));
app.use(express.urlencoded({
    extended: true
}));
app.use(cookieParser('amogus'));

// Home page: Generates a monthly calendar for the current month
app.get('/', (req, res) => {
    let username = '';
    let queryFinished = false;
    let sessionID = req.signedCookies.session;

    // If there is a session cookie, get the associated username from the database
    if (sessionID)
    {
        let conn = mysql.createConnection(DB_CONFIG);
        let query = `SELECT username FROM Sessions WHERE sessionID = "${sessionID}";`;
        conn.query(query, (err, rows, fields) => {
            if (err)
            {
                console.log(err);
                queryFinished = true;
            }
            else if (rows.length > 0)
            {
                username = rows[0].username;
                queryFinished = true;
            }
            else
            {
                // If session is invalid, then delete the cookie
                console.log('Invalid session ID');
                res.clearCookie('session');
                queryFinished = true;
            }

            let d = new Date();
            let content = HTML_HEAD;
            content += generateNavBar(username, 'home');
            content += generateMonthlyCalendar(d);
            content += HTML_END;
            res.send(content);
            return;
        });
    }
    else
    {
        let d = new Date();
        let content = HTML_HEAD;
        content += generateNavBar('', 'home');
        content += generateMonthlyCalendar(d);
        content += HTML_END;
        res.send(content);
    }

    
});

// Checks whether a username is in use and whether it contains invalid characters
app.get('/check-username', (req, res) => {
    let username = req.query.username;
    if (!username || username.length < 3)
    {
        res.json({
            available: false,
            status: "Username must be at least 3 characters long"
        });
        return;
    }
    else if (containsBannedCharacters(username, USERNAME_WHITELIST)) {
        res.json({
            available: false,
            status: "Username can only contain alphanumeric characters and underscores"
        });
        return;
    }
    username = username.toLowerCase();
    let conn = mysql.createConnection(DB_CONFIG);
    let query = `SELECT * FROM Users
    WHERE username = "${username}";`;
    conn.query(query, (err, rows, fields) => {
        if (err)
        {
            console.log(err);
            res.json({
                available: false,
                status: "DB error - see server log"
            });
            return;
        }
        if (rows.length === 0)
        {
            res.json({
                available: true,
                status: "Username is available"
            });
            return;
        }
        else {
            res.json({
                available: false,
                status: "Username is already in use"
            });
        }
    });
    
});

// Checks whether an email address is in use and whether it contains invalid characters
app.get('/check-email', (req, res) => {
    let email = req.query.email;
    if (!email)
    {
        res.json({
            available: false,
            status: "Email is required"
        });
        return;
    }
    else if (containsBannedCharacters(email, EMAIL_WHITELIST)) {
        res.json({
            available: false,
            status: "Email can only contain alphanumeric characters and the following special characters: _ + . @"
        });
        return;
    }
    email = email.toLowerCase();
    let conn = mysql.createConnection(DB_CONFIG);
    let query = `SELECT * FROM Users
    WHERE email = "${email}";`;
    conn.query(query, (err, rows, fields) => {
        if (err)
        {
            console.log(err);
            res.json({
                available: false,
                status: "DB error - see server log"
            });
            return;
        }
        if (rows.length === 0)
        {
            res.json({
                available: true,
                status: "Email is valid and not in use"
            });
            return;
        }
        else {
            res.json({
                available: false,
                status: "Email is already in use"
            });
        }
    });
    
});

// Creates a new account, creates a session for the new account, and redirects the user to the home page with the new session cookie
app.post('/create-account', (req, res) => {
    // Get params from request body
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    // Make sure all required parameters are present and valid
    if (!username || containsBannedCharacters(username, USERNAME_WHITELIST))
    {
        res.redirect('/login.html?error=1');
        return;
    }
    if (!email || containsBannedCharacters(email, EMAIL_WHITELIST))
    {
        res.redirect('/login.html?error=2');
        return;
    }
    if (!password)
    {
        res.redirect('/login.html?error=3');
        return;
    }

    // Encrypt password
    let [encryptedPassword, salt] = encryptPassword(password);
    
    // Get current date
    let d = new Date();

    // Connect to DB and send INSERT query
    let conn = mysql.createConnection(DB_CONFIG);
    let query = `INSERT INTO Users(username, email, isAdmin, passwdSalt, passwd, creationDate) VALUES(
        "${username}",
        "${email}",
        0,
        "${salt}",
        "${encryptedPassword}",
        "${d.toISOString().substr(0, 19).replace('T', ' ')}"
    );`;
    conn.query(query, (err, rows, fields) => {
        if (err)
        {
            console.log(err);
            res.redirect("/login.html?error=5");
            return;
        }
        else
        {
            // Create a new session for the new account
            let sessionID = randomString(128);
            let sessionQuery = `INSERT INTO Sessions(sessionID, username) VALUES ("${sessionID}", "${username}");`;
            conn.query(sessionQuery, (err, rows, fields) => {
                if (err)
                {
                    console.log(err);
                    res.redirect('/login.html?error=5');
                    return;
                }
                else
                {
                    res.cookie('session', sessionID, {signed: true});
                    res.redirect('/');
                    return;
                }
            });
            
        }
    });
});

// Generates a calendar for the month specified by the given date object
function generateMonthlyCalendar(date)
{
    let year = date.getFullYear();
    let month = date.getMonth();
    let monthName = MONTHS[month];
    let monthLength = MONTH_LENGTHS[month];
    // Check for leap years if it's February
    if (month == 1 && year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0))
    {
        monthLength += 1;
    }

    // Create a temporary date object to find the first weekday of the month
    let wd = new Date(year, month);
    let firstWeekday = wd.getDay();

    // Create a date object for the current date to highlight the current date on the calendar
    let cd = new Date();
    let cDate = cd.getDate();
    let cMonth = cd.getMonth();
    let cYear = cd.getFullYear();

    // Month and year header
    let content = `
    <div id='calendar-container'>
    <h2 class='month-header'>${monthName} ${date.getFullYear()}</h2>`;
    
    // Weekday header row
    content += `
    <div id='weekday-row'>
    `;

    for (let day = 0; day < 7; day++)
    {
        content += `
        <div class='row1 col${day + 1} weekday-cell'>
            <h3 class='weekday-header'>${WEEKDAYS[day]}</h3>
        </div>
        `;
    }

    content += `
    </div>
    `;

    // Generate calendar
    content += `<div id='calendar'>
    `;
    // Keep track of the current day being generated
    let currentDay = 1;
    // 6 rows (to handle all possible month layouts)
    for (let row = 0; row < 6; row++)
    {
        // 7 days per row
        for (let day = 0; day < 7; day++)
        {
            // Create empty cells before the first day of the month
            if (row === 0 && day < firstWeekday)
            {
                content += `
                <div class='row1 col${day + 1} empty-day'></div>
                `;
            }
            // Create empty cells after the last day of the month
            else if (currentDay > monthLength)
            {
                content += `
                <div class='row${row + 1} col${day + 1} empty-day'></div>
                `;
            }
            // Generate days with numbers
            else
            {
                content += `
                <div class='row${row + 1} col${day + 1} day ${(cDate === currentDay && cMonth === month && cYear === year) ? 'current-day' : ''}'>
                <div class='day-header'>
                    <h2 class='day-number'>${currentDay}</h2>
                </div>
                </div>
                `;
                currentDay++;
            }
        }
        // End the loop early if all days have been generated, to avoid displaying an empty week
        if (currentDay > monthLength)
        {
            break;
        }
    }

    // Close divs
    content += `
    </div>
    </div>
    `;

    return content;
}

function generateNavBar(username, activePage)
{
    let content = '';
    if (username)
    {
        content += `
        <header id='page-header'>
            <h2 id='header-title'>Calendar</h2>
            <p id='header-greeting'>Logged in as ${username}</p>
            <nav id='nav-bar'>
                <div class='nav-item'>
                    <a href='/sign-out' class='nav-link'>Log Out</a>
                </div>
                <div class='nav-item ${activePage === 'calendars' ? 'active' : ''}'>
                    <a href='/calendars' class='nav-link'>Your Calendars</a>
                </div>
                <div class='nav-item ${activePage === 'home' ? 'active' : ''}'>
                    <a href='/' class='nav-link'>Home</a>
                </div>            
            </nav>
        </header>
        `;
    }
    else
    {
        content += `
        <header id='page-header'>
            <h2 id='header-title'>Calendar</h2>
            <nav id='nav-bar'>
                <div class='nav-item'>
                    <a href='/login' class='nav-link'>Log In</a>
                </div>
                <div class='nav-item active'>
                    <a href='/' class='nav-link'>Home</a>
                </div>            
            </nav>
        </header>
        `;
    }

    return content;
}

/**
 * Encrypts a password using a random salt or one provided as a parameter
 * @param {string} password The password to encrypt
 * @param {string} salt Optional - password will be encrypted using this salt, or a new one will be generated if not provided
 * @returns 2-element array containing the encrypted password and the salt used to encrypt it
 */
function encryptPassword(password, salt)
{
    if (salt === undefined)
        salt = randomString(32);
    let pepper = 'bruhmoment42069lmao';
    let saltedPasswd = salt + password + pepper;
    let encryptedPasswd = crypto.createHash('sha512').update(saltedPasswd).digest('base64');
    return [encryptedPasswd, salt];
}

/**
 * Generates a random string of n characters in [A-Za-z0-9]
 * @param {number} n The length of the string
 * @returns A random string of n characters
 */
function randomString(n)
{
    let salt = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < n; i++)
    {
        let index = Math.floor(Math.random() * characters.length);
        salt += characters[index];
    }
    return salt;
}

/**
 * Checks whether a string contains any characters not in the given whitelist string
 * @param {string} str The string to validate
 * @param {string} charList String containing all allowed characters
 * @returns True if the string contains any characters not in the whitelist, false otherwise
 */
function containsBannedCharacters(str, charList)
{
    // For every character in the input string, if it's not in the whitelist then return true
    for (let i = 0; i < str.length; i++)
    {
        let char = str[i];
        if (!charList.includes(char))
        {
            return true;
        }
    }
    return false;
}

app.listen(PORT);