export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    console.log('Data dari Sensor Pintu masuk:', body)

    return {
        success: true,
        message: 'Status pintu berhasil diupdate!',
        data_received: body
    }
})