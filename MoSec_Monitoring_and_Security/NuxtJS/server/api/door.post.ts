export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const { room, state } = body

    console.log('Data dari Sensor Pintu masuk:', body)
    await useStorage('data').setItems([
        {key: 'room', value: String(room)}, 
        {key: 'state', value: String(state)}
    ]);
    
    return {
        success: true,
        message: 'Status pintu berhasil diupdate!',
        room: room,
        status: state
    }
})