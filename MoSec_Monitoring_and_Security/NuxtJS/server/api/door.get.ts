export default defineEventHandler(async (event) => {
    const room = await useStorage('data').getItem('room') || '';
    const state = await useStorage('data').getItem('state') || '';

    return {
        success: true,
        room: room,
        state: state
    };
});