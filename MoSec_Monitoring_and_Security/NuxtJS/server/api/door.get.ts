export default defineEventHandler(async (event) => {
    const id = await useStorage('data').getItem('door-id') || '';

    return {
        success: true,
        id: id
    };
});