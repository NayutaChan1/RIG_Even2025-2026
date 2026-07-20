<template>
	<div class="login-page">
		<div class="login-container">
			<div class="login-header">
				<div class="brand">
					<div class="brand-icon"></div>
					<h1>MoSec</h1>
				</div>
				<p class="brand-tagline">Monitoring & Security Lab</p>
			</div>

			<form class="login-form" @submit.prevent="handleLogin">
				<div class="form-group">
					<label for="username">Username</label>
					<input
						id="username"
						v-model="username"
						type="text"
						placeholder="Enter your username"
						:disabled="loading"
						autocomplete="username"
					/>
				</div>

				<div class="form-group">
					<label for="password">Password</label>
					<input
						id="password"
						v-model="password"
						type="password"
						placeholder="Enter your password"
						:disabled="loading"
						autocomplete="current-password"
					/>
				</div>

				<p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

				<button type="submit" class="btn-login" :disabled="loading">
					<span v-if="loading" class="spinner"></span>
					<span>{{ loading ? 'Signing in...' : 'Sign In' }}</span>
				</button>
			</form>
		</div>
	</div>
</template>

<script setup>
definePageMeta({ layout: false })

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
	errorMessage.value = ''

	if (!username.value.trim() || !password.value.trim()) {
		errorMessage.value = 'Please enter both username and password.'
		return
	}

	loading.value = true

	try {
		const response = await $fetch('/api/auth/login', {
			method: 'POST',
			body: {
				initial: username.value,
				password: password.value
			}
		})

		if (response.success) {
			const authUser = useCookie('auth_user')
			authUser.value = {
				...response.user,
				token: response.token,
			}
			navigateTo('/dashboard')
		}
	} catch (error) {
		errorMessage.value = error.data?.message || error.message || 'Login failed. Please try again.'
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

.login-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%);
	font-family: 'Inter', sans-serif;
	padding: 2rem;
}

.login-container {
	width: 100%;
	max-width: 420px;
	background: rgba(37, 37, 58, 0.6);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(132, 148, 255, 0.2);
	border-radius: 24px;
	padding: 3rem;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

.login-header {
	text-align: center;
	margin-bottom: 2.5rem;
}

.brand {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	margin-bottom: 0.5rem;
}

.brand-icon {
	width: 32px;
	height: 32px;
	background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
	border-radius: 8px;
	box-shadow: 0 4px 12px rgba(99, 103, 255, 0.4);
}

.brand h1 {
	font-size: 2rem;
	font-weight: 800;
	background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.brand-tagline {
	color: #C9BEFF;
	font-size: 0.9rem;
	font-weight: 500;
}

.login-form {
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
}

.form-group {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.form-group label {
	color: #C9BEFF;
	font-size: 0.875rem;
	font-weight: 600;
	letter-spacing: 0.3px;
}

.form-group input {
	width: 100%;
	padding: 0.875rem 1rem;
	background: rgba(26, 26, 46, 0.8);
	border: 1.5px solid rgba(132, 148, 255, 0.3);
	border-radius: 12px;
	color: #ffffff;
	font-size: 0.95rem;
	font-family: 'Inter', sans-serif;
	outline: none;
	transition: all 0.3s ease;
}

.form-group input:focus {
	border-color: #6367FF;
	background: rgba(26, 26, 46, 1);
	box-shadow: 0 0 0 3px rgba(99, 103, 255, 0.1);
}

.form-group input::placeholder {
	color: rgba(201, 190, 255, 0.4);
}

.btn-login {
	width: 100%;
	padding: 0.875rem;
	background: linear-gradient(135deg, #6367FF 0%, #8494FF 100%);
	border: none;
	border-radius: 12px;
	color: white;
	font-size: 0.95rem;
	font-weight: 600;
	font-family: 'Inter', sans-serif;
	cursor: pointer;
	transition: all 0.3s ease;
	box-shadow: 0 4px 12px rgba(99, 103, 255, 0.3);
	margin-top: 0.5rem;
}

.btn-login:hover {
	transform: translateY(-2px);
	box-shadow: 0 6px 20px rgba(99, 103, 255, 0.4);
}

.btn-login:active {
	transform: translateY(0);
}

.btn-login:disabled {
	opacity: 0.7;
	cursor: not-allowed;
	transform: none;
}

.btn-login:disabled:hover {
	transform: none;
}

.btn-login .spinner {
	display: inline-block;
	width: 18px;
	height: 18px;
	margin: 0 10px 0 0;
	border: 2px solid rgba(255, 255, 255, 0.3);
	border-top-color: #ffffff;
	border-radius: 50%;
	animation: spin 0.6s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.error-message {
	color: #ff6b6b;
	font-size: 0.85rem;
	font-weight: 500;
	text-align: center;
	margin: 0;
}

.form-group input:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
</style>