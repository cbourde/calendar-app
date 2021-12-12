const express = require('express');
const mysql = require('mysql');

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

app.use(express.static('static'));

app.get('/', (req, res) => {
    let d = new Date();
    let content = HTML_HEAD;
    content += generateMonthlyCalendar(d);
    content += HTML_END;
    res.send(content);
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
                <div class='row${row + 1} col${day + 1} day'>
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

app.listen(PORT);