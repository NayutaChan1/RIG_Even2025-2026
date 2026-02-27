<template>
    <div class="Overall-Page">
        <div class="Title-Login">
            <h1>MoSec</h1>
            <p>Monitoring & Security Lab</p>
        </div>

        <div class="Box-Login">
            
            <div class="Username-Initial">Initial / Username</div>
            <div class="Textbox-Username">
                <input v-model="username" class="Value-Username" type="text" placeholder="Input Username" />
            </div>

            <div class="Password-Text">Password</div>
            <div class="Textbox-Password">
                <input v-model="password" class="Value-Password" type="password" placeholder="••••••••" />
            </div>

            <div class="Login-Button">
                <button @click="handleLogin">Sign In</button>
            </div>

        </div>
    </div>
</template>

<script setup>
const username = ref('')
const password = ref('')

const handleLogin = () => {
    console.log('Username:', username.value)
    console.log('Password:', password.value)
    
    // navigateTo('/dashboard')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.Overall-Page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #1a1a24;
    font-family: 'Inter', sans-serif;
    color: #ffffff;
}

.Title-Login {
    margin-bottom: 2rem;
    text-align: center;
}

.Title-Login h1 {
    font-size: 2.5rem;
    margin: 0;
    background: linear-gradient(90deg, #8b5cf6, #ec4899); 
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.Title-Login p {
    color: #a0a0b0;
    margin-top: 0.5rem;
}

.Box-Login {
    background-color: #272835;
    width: 100%;
    max-width: 400px;
    padding: 2.5rem;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    box-sizing: border-box;
}

.Username-Initial, .Password-Text {
    font-size: 0.9rem;
    color: #a0a0b0;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.Password-Text {
    margin-top: 1.5rem;
}

.Textbox-Username input, .Textbox-Password input {
    width: 100%;
    padding: 1rem;
    background-color: #1a1a24;
    border: 2px solid transparent;
    border-radius: 12px;
    color: #ffffff;
    font-size: 1rem;
    outline: none;
    transition: all 0.3s ease;
    box-sizing: border-box;
}

.Textbox-Username input:focus, .Textbox-Password input:focus {
    border-color: #6c48ff; 
}

.Login-Button {
    margin-top: 2.5rem;
}

.Login-Button button {
    width: 100%;
    padding: 1rem;
    background-color: #6c48ff;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.1s;
}

.Login-Button button:hover {
    background-color: #5733e6;
}

.Login-Button button:active {
    transform: scale(0.97);
}

.to-Register {
    margin-top: 1.5rem;
    text-align: center;
    color: #a0a0b0;
    font-size: 0.9rem;
}

.to-Register a {
    color: #8b5cf6;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
}

.to-Register a:hover {
    color: #ec4899;
}
</style>