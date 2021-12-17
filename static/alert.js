let params = new URLSearchParams(window.location.search);
if (params.has('error'))
{
    switch(params.get('error'))
    {
        case '1':
            // No username given when signing up
            alert('Error: Username is invalid or not specified');
            break;
        case '2':
            // No email given when signing up
            alert('Error: Email address is invalid or not specified');
            break;
        case '3':
            // No password given when signing up
            alert('Error: Password is invalid or not specified');
            break;
        case '4':
            // Incorrect username or password when logging in
            alert('Invalid username or password');
            break;
        case '5':
            // Database error
            alert('DB error - check server log');
    }
}