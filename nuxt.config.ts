
console.log(`process.env.BASE_URL: ${process.env.BASE_URL}`)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  app: {
    baseURL: process.env.BASE_URL || '/html-video-grab/'
  }
})
