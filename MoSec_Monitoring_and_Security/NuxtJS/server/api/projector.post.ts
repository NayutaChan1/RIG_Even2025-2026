export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    console.log('Data dari Projector masuk : ', body)


    return {
        success: true,
        message: 'Status projector berhasil masuk',
        data_received: body
    }
})