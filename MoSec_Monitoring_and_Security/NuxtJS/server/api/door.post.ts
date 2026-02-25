export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { id } = body

    console.log('Data dari Sensor Pintu masuk:', body)
    await useStorage('data').setItem('door-id', String(id));
    

    return {
        success: true,
        message: 'Status pintu berhasil diupdate!',
        id: id
    }
})