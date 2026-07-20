export default defineNuxtRouteMiddleware(() => {
  const authUser = useCookie('auth_user')
  if (!authUser.value) {
    return navigateTo('/login')
  }
})
