let d = new Date();
console.log(d.toISOString().substr(0, 19).replace('T', ' '));

let validUsername = false;
let validEmail = false;

let loginUsername = document.getElementById('login-username');
let loginPassword = document.getElementById('login-password');
let signupUsername = document.getElementById('signup-username');
let signupEmail = document.getElementById('signup-email');
let signupPassword = document.getElementById('signup-password');
let signupConfirm = document.getElementById('signup-confirm');
let signupUsernameStatus = document.getElementById('username-status');
let signupEmailStatus = document.getElementById('email-status');
let signupSubmit = document.getElementById('signup-submit');
let signupForm = document.getElementById('signup-form');
let passwordLength = document.getElementById('password-length');
let passwordLowercase = document.getElementById('password-lowercase');
let passwordUppercase = document.getElementById('password-uppercase');
let passwordNumber = document.getElementById('password-number');
let passwordSpecial = document.getElementById('password-special');
let passwordConfirmStatus = document.getElementById('password-confirm-status');

let requiredInputs = [loginUsername, loginPassword, signupUsername, signupEmail, signupPassword, signupConfirm];
for (let i of requiredInputs)
{
    i.addEventListener('blur', highlightRequired);
}

signupForm.addEventListener('submit', validateSignupForm);
signupUsername.addEventListener('blur', checkUsername);
signupEmail.addEventListener('blur', checkEmail);
signupPassword.addEventListener('input', validatePassword);
signupConfirm.addEventListener('input', confirmPassword);

function highlightRequired(e)
{
    let target = e.target;
    if (target.value)
    {
        target.classList.remove('highlight-red');
    }
    else 
    {
        target.classList.add('highlight-red');
    }
}

function checkUsername(e)
{
    let target = e.target;
    let req = new XMLHttpRequest();
    req.open('get', `/check-username?username=${target.value}`, true);
    req.onreadystatechange = showUsernameAvailability;
    req.send();
}

function showUsernameAvailability()
{
    if (this.status >= 400)
    {
        signupUsernameStatus.classList.add('red');
        signupUsernameStatus.innerText = "Validation error - refresh page";
        signupUsername.classList.add('highlight-red');
        validUsername = false;
    }
    else if (this.readyState === 4)
    {
        let res = JSON.parse(this.responseText);
        signupUsernameStatus.innerText = res.status;
        signupUsernameStatus.style = 'display: block';
        if (res.available)
        {
            signupUsername.classList.add('highlight-green');
            signupUsername.classList.remove('highlight-red');
            signupUsernameStatus.classList.add('green');
            signupUsernameStatus.classList.remove('red');
            validUsername = true;
        }
        else
        {
            signupUsername.classList.add('highlight-red');
            signupUsername.classList.remove('highlight-green');
            signupUsernameStatus.classList.add('red');
            signupUsernameStatus.classList.remove('green');
            validUsername = false;
        }
    }
}

function checkEmail(e)
{
    let target = e.target;
    if (!target.value.match(/.+@.+/gm))
    {
        signupEmailStatus.innerText = 'Email is invalid';
        signupEmailStatus.style = 'display: block';
        signupEmail.classList.add('highlight-red');
        signupEmail.classList.remove('highlight-green');
        signupEmailStatus.classList.add('red');
        signupEmailStatus.classList.remove('green');
        return;
    }
    let req = new XMLHttpRequest();
    req.open('get', `/check-email?email=${target.value}`, true);
    req.onreadystatechange = showEmailAvailability;
    req.send();
}

function showEmailAvailability()
{
    if (this.status >= 400)
    {
        signupEmailStatus.classList.add('red');
        signupEmailStatus.innerText = "Validation error - refresh page";
        signupEmail.classList.add('highlight-red');
        validEmail = false;
    }
    else if (this.readyState === 4)
    {
        let res = JSON.parse(this.responseText);
        signupEmailStatus.innerText = res.status;
        signupEmailStatus.style = 'display: block';
        if (res.available)
        {
            signupEmail.classList.add('highlight-green');
            signupEmail.classList.remove('highlight-red');
            signupEmailStatus.classList.add('green');
            signupEmailStatus.classList.remove('red');
            validEmail = true;
        }
        else
        {
            signupEmail.classList.add('highlight-red');
            signupEmail.classList.remove('highlight-green');
            signupEmailStatus.classList.add('red');
            signupEmailStatus.classList.remove('green');
            validEmail = false;
        }
    }
}

function validatePassword()
{
    let password = signupPassword.value;
    let valid = true;
    if (password.length < 8)
    {
        passwordLength.classList.add('red');
        passwordLength.classList.remove('green');
        valid = false;
    }
    else
    {
        passwordLength.classList.add('green');
        passwordLength.classList.remove('red');
    }

    if (!password.match(/[a-z]/gm))
    {
        passwordLowercase.classList.add('red');
        passwordLowercase.classList.remove('green');
        valid = false;
    }
    else
    {
        passwordLowercase.classList.add('green');
        passwordLowercase.classList.remove('red');
    }

    if (!password.match(/[A-Z]/gm))
    {
        passwordUppercase.classList.add('red');
        passwordUppercase.classList.remove('green');
        valid = false;
    }
    else
    {
        passwordUppercase.classList.add('green');
        passwordUppercase.classList.remove('red');
    }

    if (!password.match(/\d/gm))
    {
        passwordNumber.classList.add('red');
        passwordNumber.classList.remove('green');
        valid = false;
    }
    else
    {
        passwordNumber.classList.add('green');
        passwordNumber.classList.remove('red');
    }

    if (!password.match(/[\W_]/gm))
    {
        passwordSpecial.classList.add('red');
        passwordSpecial.classList.remove('green');
        valid = false;
    }
    else
    {
        passwordSpecial.classList.add('green');
        passwordSpecial.classList.remove('red');
    }

    return valid;
}

function confirmPassword()
{
    if (signupConfirm.value === "")
    {
        passwordConfirmStatus.innerText = "Password confirmation is required";
        passwordConfirmStatus.style = 'display: block';
        passwordConfirmStatus.classList.add('red');
        signupConfirm.classList.add('highlight-red');
        return false;
    }
    else if (signupPassword.value !== signupConfirm.value)
    {
        passwordConfirmStatus.innerText = "Passwords do not match";
        passwordConfirmStatus.style = 'display: block';
        passwordConfirmStatus.classList.add('red');
        signupConfirm.classList.add('highlight-red');
        return false;
    }
    else
    {
        passwordConfirmStatus.style = 'display: none';
        passwordConfirmStatus.classList.remove('red');
        signupConfirm.classList.remove('highlight-red');
        return true;
    }
}

function validateSignupForm(e)
{
    let valid = true;

    // Check whether the email and username are valid
    if (!validUsername || !validEmail)
    {
        valid = false;
    }

    // Check whether password meets requirements (validatePassword handles error messages)
    if (!validatePassword())
    {
        valid = false;
    }

    // Check whether confirm password box matches password box (confirmPassword() handles error messages)
    if (!confirmPassword())
    {
        valid = false;
    }

    // Don't submit the form if anything is invalid
    if (!valid)
    {
        e.preventDefault();
    }

}